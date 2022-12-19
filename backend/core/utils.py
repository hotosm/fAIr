import json
import math
import os
from uuid import uuid4
from xml.dom import ValidationErr
from zipfile import ZipFile

import requests
from django.conf import settings

from .models import Label
from .serializers import LabelSerializer

DEFAULT_TILE_SIZE = 256
DEFAULT_ZOOM_LEVEL = 19


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


def convert2worldcd(lat, lng, tile_size):
    """
    World coordinates  are measured from the Mercator projection's origin
    (the northwest corner of the map at 180 degrees longitude and
    approximately 85 degrees latitude) and increase in the x direction
    towards the east (right) and increase in the y direction towards the south
    (down).Because the basic Mercator  tile is 256 x 256 pixels, the usable
    world coordinate space is {0-256}, {0-256}
    """
    siny = math.sin((lat * math.pi) / 180)
    siny = min(max(siny, -0.9999), 0.9999)
    world_x = tile_size * (0.5 + (lng / 360))
    world_y = tile_size * (0.5 - math.log((1 + siny) / (1 - siny)) / (4 * math.pi))
    # print("world coordinate space is %s, %s",world_x,world_y)
    return world_x, world_y


def latlng2tile(zoom, lat, lng, tile_size):
    """By dividing the pixel coordinates by the tile size and taking the
    integer parts of the result, you produce as a by-product the tile
    coordinate at the current zoom level."""
    zoom_byte = 1 << zoom  # converting zoom level to pixel bytes
    # print(zoom_byte)
    w_x, w_y = convert2worldcd(lat, lng, tile_size)

    t_x = math.floor((w_x * zoom_byte) / tile_size)
    t_y = math.floor((w_y * zoom_byte) / tile_size)
    print(t_x, t_y)
    return t_x, t_y


def download_imagery(
    start: list, end: list, zm_level, dataset_id, base_path, source="maxar"
):
    """Downloads imagery from start to end tile coordinate system

    Args:
        start (list):[tile_x,tile_y]
        end (list): [tile_x,tile_y],
        source (string): it should be eithre url string or maxar value
        zm_level : Zoom level
        dataset_id (int) : Dataset id

    """

    begin_x = start[0]  # this will be the beginning of the download loop for x
    begin_y = start[1]  # this will be the beginning of the download loop for x
    stop_x = end[0]  # this will be the end of the download loop for x
    stop_y = end[1]  # this will be the end of the download loop for x

    print(f"Download starting from {start} to {end}")

    start_x = begin_x  # starting loop from beginning
    start_y = begin_y  # starting y loop from beginnig
    source_name = "OAM"  # default

    while start_x <= stop_x:  # download  x section while keeping y as c
        start_y = begin_y
        while start_y >= stop_y:  # download  y section while keeping x as c
            download_path = [start_x, start_y]
            if source == "maxar":
                try:
                    connect_id = os.environ.get("MAXAR_CONNECT_ID")
                except Exception as ex:
                    raise ex
                source_name = source
                download_url = f"https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{zm_level}/{download_path[0]}/{download_path[1]}.jpg?connectId={connect_id}&flipy=true"

            # add multiple logic on supported sources here
            else:
                # source should be url as string , like this :  https://tiles.openaerialmap.org/62dbd947d8499800053796ec/0/62dbd947d8499800053796ed/{z}/{x}/{y}
                download_url = source.format(
                    x=download_path[0], y=download_path[1], z=zm_level
                )
            file = f"{base_path}/{source_name}-{start_x}-{start_y}-{zm_level}.png"
            if os.path.exists(file):
                os.remove(file)

            with open(file, "wb") as handle:
                response = requests.get(download_url, stream=True)

                if not response.ok:
                    print(response)

                for block in response.iter_content(1024):
                    if not block:
                        break
                    handle.write(block)
            print(f"Downloaded : {download_path}")
            start_y = start_y - 1  # decrease the y

        start_x = start_x + 1  # increase the x

    # TODO: Save geojson labels to the same folder


def request_rawdata(request_params):
    """will make call to galaxy API & provides response as json

    Args:
        request_params (dict): Galaxy API Request Body

    Raises:
        ImportError: If galaxy url is not exists

    Returns:
        Response(json): API Response
    """

    export_tool_api_url = settings.EXPORT_TOOL_API_URL

    # following block should be a background task
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
    }
    print(request_params)
    with requests.post(
        url=export_tool_api_url, data=json.dumps(request_params), headers=headers
    ) as r:  # curl can also be option
        response_back = r.json()
        print(response_back)
        return response_back


def process_rawdata(file_download_url, aoi_id):
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
    print("Zip File from API wrote to disk")
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
        process_geojson(geojson_file, aoi_id)
    remove_file(file_temp_path)
    remove_file(geojson_file)


def remove_file(path: str) -> None:
    """Used for removing temp file"""
    os.unlink(path)


def process_geojson(geojson_file_path, aoi_id):
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

    with open(geojson_file_path) as f:
        data = json.load(f)
        for i in range(len(data["features"])):
            properties = data["features"][i]["properties"]
            osm_id = properties["osm_id"]
            geometry = data["features"][i]["geometry"]
            print(osm_id)
            if Label.objects.filter(osm_id=int(osm_id)).exists():
                print("already exists")
                pass
            else:
                label = LabelSerializer(
                    data={"osm_id": int(osm_id), "geom": geometry, "aoi": aoi_id}
                )
                if label.is_valid():
                    label.save()
                else:
                    raise ValidationErr(label.errors)
    print("writing to database finished")
