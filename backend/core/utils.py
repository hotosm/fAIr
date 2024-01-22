import concurrent.futures
import io
import json
import math
import os
import re
import time
import zipfile
from datetime import datetime
from uuid import uuid4
from xml.dom import ValidationErr
from zipfile import ZipFile

import requests
from django.conf import settings
from gpxpy.gpx import GPX, GPXTrack, GPXTrackSegment, GPXWaypoint
from tqdm import tqdm

from .models import AOI, FeedbackAOI, FeedbackLabel, Label
from .serializers import FeedbackLabelSerializer, LabelSerializer


def get_dir_size(directory):
    total_size = 0
    for entry in os.scandir(directory):
        if entry.is_file():
            total_size += entry.stat().st_size
        elif entry.is_dir():
            total_size += get_dir_size(entry.path)
    return total_size


def bbox(coord_list):
    """_summary_

    Args:
        coord_list (_type_): Polygon coordinate list

    Returns:
        list: bbox coords

    """
    box = []
    for i in (0, 1):
        res = sorted(coord_list, key=lambda x: x[i])
        box.append((res[0][i], res[-1][i]))
    correction = 0.000001  # need crctn because coordinate comming from js
    ret = [
        box[0][0] + correction,
        box[1][0] + correction,
        box[0][1] - correction,
        box[1][1] - correction,
    ]
    return ret


def is_dir_empty(directory_path):
    return not any(os.scandir(directory_path))


class RawDataAPI:
    def __init__(self, BASE_API_URL):
        self.BASE_API_URL = BASE_API_URL

    def request_snapshot(self, geometry):
        headers = {"accept": "application/json", "Content-Type": "application/json"}
        # Lets start with buildings for now
        payload = {
            "geometry": json.loads(geometry),
            "filters": {"tags": {"all_geometry": {"join_or": {"building": []}}}},
            "geometryType": ["polygon"],
            "useStWithin": "false",
        }
        response = requests.post(
            f"{self.BASE_API_URL}/snapshot/", data=json.dumps(payload), headers=headers
        )
        response.raise_for_status()
        return response.json()

    def poll_task_status(self, task_link):
        stop_loop = False
        while not stop_loop:
            check_result = requests.get(url=f"{self.BASE_API_URL}{task_link}")
            check_result.raise_for_status()
            res = check_result.json()
            if res["status"] == "SUCCESS" or res["status"] == "FAILED":
                stop_loop = True
            time.sleep(1)
        return res


import logging


def request_rawdata(geometry):
    """will make call to Raw Data API & provides response as json

    Args:
        geometry (dict): geometry to request

    Raises:
        ImportError: If raw data api url is not exists

    Returns:
        Response(json): API Response
    """

    export_tool_api_url = settings.EXPORT_TOOL_API_URL
    api = RawDataAPI(export_tool_api_url)
    snapshot_data = api.request_snapshot(geometry)
    task_link = snapshot_data["track_link"]
    logging.info("Fetching latest OSM snapshot")
    task_result = api.poll_task_status(task_link)
    logging.info(f"Fetch Task result: {task_result['status']}")
    if task_result["status"] != "SUCCESS":
        raise RuntimeError(
            "Raw Data API did not respond correctly. Please try again later."
        )
    snapshot_url = task_result["result"]["download_url"]
    return snapshot_url


def process_rawdata(file_download_url, aoi_id, feedback=False):
    """This will create temp directory , Downloads file from URL provided,
    Unzips it Finds a geojson file , Process it and finally removes
    processed Geojson file and downloaded zip file from Directory"""
    r = requests.get(file_download_url)
    # Check whether the export path exists or not
    path = "temp/"
    isExist = os.path.exists(path)
    if not isExist:
        # Create a exports directory because it does not exist
        os.makedirs(path)
    file_temp_path = os.path.join(path, f"{str(uuid4())}.zip")  # unique
    open(file_temp_path, "wb").write(r.content)
    with ZipFile(file_temp_path, "r") as zipObj:
        # Get a list of all archived file names from the zip
        listOfFileNames = zipObj.namelist()
        # Iterate over the file names
        geojson_file_path = f"""{path}/geojson/"""

        for fileName in listOfFileNames:
            # Check filename endswith csv
            if fileName.endswith(".geojson"):
                if fileName != "clipping_boundary.geojson":
                    # Extract a single file from zip
                    zipObj.extract(fileName, geojson_file_path)
                    print(f"""Geojson file{fileName} from API wrote to disk""")
                    break
        geojson_file = f"""{geojson_file_path}{fileName}"""
        process_geojson(geojson_file, aoi_id, feedback)
    remove_file(file_temp_path)
    remove_file(geojson_file)


def remove_file(path: str) -> None:
    """Used for removing temp file"""
    os.unlink(path)


def gpx_generator(geom_json):
    """Generates GPX for give geojson geometry

    Args:
        geom_json (_type_): _description_

    Returns:
        xml: gpx
    """

    gpx = GPX()
    gpx_track = GPXTrack()
    gpx.tracks.append(gpx_track)
    gpx_segment = GPXTrackSegment()
    gpx_track.segments.append(gpx_segment)
    for point in geom_json["coordinates"][0]:
        # Append each point as a GPXWaypoint to the GPXTrackSegment
        gpx_segment.points.append(GPXWaypoint(point[1], point[0]))
    gpx.creator = "fAIr"
    gpx_track.name = "Don't Edit this Boundary"
    gpx_track.description = "Map inside this boundary and go back to fAIr UI"
    gpx.time = datetime.now()
    gpx.link = "https://github.com/hotosm/fAIr"
    gpx.link_text = "AI Assisted Mapping - fAIr : HOTOSM"
    return gpx.to_xml()


def process_feature(feature, aoi_id, foreign_key_id, feedback=False):
    """Multi thread process of features"""
    properties = feature["properties"]
    osm_id = properties["osm_id"]
    tags = properties["tags"]
    geometry = feature["geometry"]
    if feedback:
        if FeedbackLabel.objects.filter(
            osm_id=int(osm_id), feedback_aoi__training=foreign_key_id
        ).exists():
            FeedbackLabel.objects.filter(
                osm_id=int(osm_id), feedback_aoi__training=foreign_key_id
            ).delete()

        label = FeedbackLabelSerializer(
            data={
                "osm_id": int(osm_id),
                "tags": tags,
                "geom": geometry,
                "feedback_aoi": aoi_id,
            }
        )

    else:
        if Label.objects.filter(
            osm_id=int(osm_id), aoi__dataset=foreign_key_id
        ).exists():
            Label.objects.filter(
                osm_id=int(osm_id), aoi__dataset=foreign_key_id
            ).delete()

        label = LabelSerializer(
            data={"osm_id": int(osm_id), "tags": tags, "geom": geometry, "aoi": aoi_id}
        )
    if label.is_valid():
        label.save()
    else:
        raise ValidationErr(label.errors)


def process_geojson(geojson_file_path, aoi_id, feedback=False):
    """Responsible for Processing Geojson file from directory ,
        Opens the file reads the record , Checks either record
        present or not if not inserts into database

    Args:
        geojson_file_path (_type_): _description_
        aoi_id (_type_): _description_

    Raises:
        ValidationErr: _description_
    """
    print("Geojson Processing Started")
    if feedback:
        foreign_key_id = FeedbackAOI.objects.get(id=aoi_id).training
    else:
        foreign_key_id = AOI.objects.get(id=aoi_id).dataset
    max_workers = (
        (os.cpu_count() - 1) if os.cpu_count() != 1 else 1
    )  # leave one cpu free always
    if feedback:
        FeedbackLabel.objects.filter(aoi__id=aoi_id).delete()
    else : 
        Label.objects.filter(aoi__id=aoi_id).delete()
    # max_workers = os.cpu_count()  # get total cpu count available on the

    with open(geojson_file_path) as f:
        data = json.load(f)
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(
                    process_feature, feature, aoi_id, foreign_key_id, feedback
                )
                for feature in data["features"]
            ]
            for f in tqdm(futures, total=len(data["features"])):
                f.result()

    print("writing to database finished")
