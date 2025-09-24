# Standard Library
import concurrent.futures
import gc
import glob
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
import time
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from xml.dom import ValidationErr
from zipfile import ZipFile

# Third-party Libraries
import boto3
import geopandas as gpd
import requests
from botocore.exceptions import ClientError, NoCredentialsError

# Django
from django.conf import settings
from django.core.mail import send_mail
from gpxpy.gpx import GPX, GPXTrack, GPXTrackSegment, GPXWaypoint
from shapely.affinity import translate
from tqdm import tqdm

# Local imports
from .models import AOI, Label, UserNotification
from .serializers import LabelSerializer


def get_s3_client():
    if (hasattr(settings, 'AWS_ACCESS_KEY_ID') and hasattr(settings, 'AWS_SECRET_ACCESS_KEY') 
        and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY):
        return boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=getattr(settings, 'AWS_REGION', 'us-east-1'),
        )
    else:
        return boto3.client("s3")


s3_client = get_s3_client()


def km_to_degrees(km_distance, latitude=0.0):
    """
    Convert kilometers to degrees for bbox validation.

    Args:
        km_distance: Distance in kilometers
        latitude: Latitude for longitude conversion (default 0 for equator)

    Returns:
        tuple: (latitude_degrees, longitude_degrees)

    Examples:
        # 100km at equator
        lat_deg, lon_deg = km_to_degrees(100)  # (0.899, 0.899)

        # 50km at latitude 27 (Nepal/Kathmandu area)
        lat_deg, lon_deg = km_to_degrees(50, 27)  # (0.449, 0.504)
    """
    # 1 degree latitude ≈ 111 km everywhere
    lat_degrees = km_distance / 111.0

    # 1 degree longitude varies by latitude: 111 * cos(lat)
    import math

    lon_degrees = km_distance / (111.0 * math.cos(math.radians(latitude)))

    return lat_degrees, lon_degrees


def degrees_to_km(degrees, latitude=0.0):
    """
    Convert degrees to kilometers for human-readable display.

    Args:
        degrees: Distance in degrees
        latitude: Latitude for longitude conversion (default 0 for equator)

    Returns:
        tuple: (latitude_km, longitude_km)
    """
    import math

    lat_km = degrees * 111.0
    lon_km = degrees * 111.0 * math.cos(math.radians(latitude))
    return lat_km, lon_km


def s3_object_exists(bucket_name, key):
    """Check if an object exists in S3."""
    try:
        s3_client.head_object(Bucket=bucket_name, Key=key)
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return False
        raise


def download_s3_file(bucket_name, s3_key):
    """Generate a presigned URL for downloading a file from S3."""
    try:
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": s3_key},
            ExpiresIn=settings.PRESIGNED_URL_EXPIRY,
        )
        return presigned_url
    except ClientError as e:
        return None


def get_s3_metadata(bucket_name, key):
    """Retrieve metadata for an S3 object."""
    try:
        response = s3_client.head_object(Bucket=bucket_name, Key=key)
        return {"size": response.get("ContentLength")}
    except Exception as e:
        raise Exception(f"Error fetching metadata: {str(e)}")


def get_s3_directory_size_and_length(bucket_name, prefix):
    """
    Get the total size and number of files for a directory in S3.

    Args:
        bucket_name (str): The S3 bucket name.
        prefix (str): The prefix (path) to the directory.

    Returns:
        tuple: (size, length) - size in bytes, length as number of files.
    """
    total_size = 0
    total_length = 0
    paginator = s3_client.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix):
        total_length += len(page.get("Contents", []))

        total_size += sum(item["Size"] for item in page.get("Contents", []))

    return total_size, total_length


def get_s3_directory(bucket_name, prefix):
    """List objects in an S3 directory."""
    data = {"file": {}, "dir": {}}
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix, Delimiter="/"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            data["file"][os.path.basename(key)] = {"size": obj["Size"]}
        for prefix_obj in page.get("CommonPrefixes", []):
            sub_prefix = prefix_obj["Prefix"]
            sub_dir_size, sub_dir_len = get_s3_directory_size_and_length(
                bucket_name, sub_prefix
            )

            data["dir"][os.path.basename(sub_prefix.rstrip("/"))] = {
                "size": sub_dir_size,
                "len": sub_dir_len,
            }
    return data


def get_local_metadata(base_dir):
    """Retrieve metadata for local files or directories."""
    data = {"file": {}, "dir": {}}
    if os.path.isdir(base_dir):
        for entry in os.scandir(base_dir):
            if entry.is_file():
                data["file"][entry.name] = {"size": entry.stat().st_size}
            elif entry.is_dir():
                subdir_size = get_dir_size(entry.path)
                data["dir"][entry.name] = {
                    "len": sum(1 for _ in os.scandir(entry.path)),
                    "size": subdir_size,
                }
    elif os.path.isfile(base_dir):
        data["file"][os.path.basename(base_dir)] = {
            "size": os.path.getsize(base_dir),
        }
    return data


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
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Referer": "fAIr",
        }
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


def process_rawdata(file_download_url, aoi_id):
    """This will create temp directory , Downloads file from URL provided,
    Unzips it Finds a geojson file , Process it and finally removes
    processed Geojson file and downloaded zip file from Directory"""
    headers = {"Referer": "https://fair-dev.hotosm.org/"}  # TODO : Use request uri
    r = requests.get(file_download_url, headers=headers)
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
        process_geojson(geojson_file, aoi_id)
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


def process_feature(feature, aoi_id, foreign_key_id):
    """Multi thread process of features"""
    properties = feature["properties"]
    osm_id = properties["osm_id"]
    tags = properties["tags"]
    geometry = feature["geometry"]

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


def process_geojson(geojson_file_path, aoi_id):
    """Multi-threaded Geojson processing to  database

    Args:
        geojson_file_path (_type_): _description_
        aoi_id (_type_): _description_

    Raises:
        ValidationErr: _description_
    """
    print("Geojson Processing Started")
    foreign_key_id = AOI.objects.get(id=aoi_id).dataset
    max_workers = (
        (os.cpu_count() - 1) if os.cpu_count() != 1 else 1
    )  # leave one cpu free always
    Label.objects.filter(aoi__id=aoi_id).delete()
    # max_workers = os.cpu_count()  # get total cpu count available on the

    with open(geojson_file_path) as f:
        data = json.load(f)
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(
                    process_feature, feature, aoi_id, foreign_key_id
                )
                for feature in data["features"]
            ]


class S3Uploader:
    def __init__(
        self,
        bucket_name=None,
        aws_access_key_id=None,
        aws_secret_access_key=None,
        parent="fair-dev",
    ):
        try:
            if aws_access_key_id and aws_secret_access_key:
                self.aws_session = boto3.Session(
                    aws_access_key_id=aws_access_key_id,
                    aws_secret_access_key=aws_secret_access_key,
                )
            else:
                self.aws_session = boto3.Session()

            self.s3_client = self.aws_session.client("s3")
            self.bucket_name = bucket_name
            self.parent = parent
            logging.info("S3 connection initialized successfully")
        except (NoCredentialsError, ClientError) as ex:
            logging.error(f"S3 Connection Error: {ex}")
            raise

    def upload(self, path, bucket_name=None):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path not found: {path}")

        bucket = bucket_name or self.bucket_name
        if not bucket:
            raise ValueError("Bucket name must be provided")

        try:
            if os.path.isfile(path):
                return self._upload_file(path, bucket)
            elif os.path.isdir(path):
                return self._upload_directory(path, bucket)
            else:
                raise ValueError("Path must be a file or directory")
        except Exception as ex:
            logging.error(f"Upload failed: {ex}")
            raise

    def _upload_file(self, file_path, bucket_name):
        s3_key = f"{self.parent}/{os.path.basename(file_path)}"
        self.s3_client.upload_file(file_path, bucket_name, s3_key)
        return f"s3://{bucket_name}/{s3_key}"

    def _upload_directory(self, directory_path, bucket_name):
        total_files = 0
        for root, _, files in os.walk(directory_path):
            for file in files:
                local_path = os.path.join(root, file)
                relative_path = os.path.relpath(local_path, directory_path)
                relative_path = relative_path.replace("\\", "/")
                s3_key = f"{self.parent}/{relative_path}"
                self.s3_client.upload_file(local_path, bucket_name, s3_key)
                total_files += 1
        return {
            "directory_name": os.path.basename(directory_path),
            "total_files_uploaded": total_files,
            "s3_path": f"s3://{bucket_name}/{self.parent}/",
        }


def get_email_message(obj_instance, status):
    hostname = settings.FRONTEND_URL

    if obj_instance.__class__.__name__ == "Prediction":
        profile_url = f"{hostname}/profile/offline-predictions"  # todo : later on add the instance id here once we have the offline prediction page itself

    elif obj_instance.__class__.__name__ == "Training":
        profile_url = f"{hostname}/ai-models/{obj_instance.model.id}"

    else:
        profile_url = f"{hostname}/profile"

    message_template = (
        "Hi {username},\n\n"
        "Your {obj_class_name} task (ID: {object_id}) has {status}. You can view the details using following link:\n"
        "{profile_url}\n\n"
        "Thank you for using fAIr - AI Assisted Mapping Tool.\n\n"
        "Best regards,\n"
        "The fAIr Dev Team\n\n"
        "Get Involved : https://www.hotosm.org/get-involved/\n"
        "https://github.com/hotosm/fAIr/"
    )

    message = message_template.format(
        username=obj_instance.user.username,
        object_id=obj_instance.id,
        # model_name=obj_instance.model.name if obj_instance.model else "N/A",
        status=status.lower(),
        profile_url=profile_url,
        hostname=hostname,
        obj_class_name=obj_instance.__class__.__name__,
    )
    subject = f"fAIr : {obj_instance.__class__.__name__} {obj_instance.id} - {status.capitalize()}"
    return message, subject


def send_notification(obj_instance, status):
    if "web" in obj_instance.user.notifications_delivery_methods:
        UserNotification.objects.create(
            user=obj_instance.user,
            message=f"Your {obj_instance.__class__.__name__} {obj_instance.id} has been {status}.",
            related_object=obj_instance,
        )
    if "email" in obj_instance.user.notifications_delivery_methods:
        if (
            obj_instance.user.email
            and obj_instance.user.email != ""
            and obj_instance.user.email_verified
        ):
            try:
                message, subject = get_email_message(obj_instance, status)
                logging.info("Notification content generated, Sending email...")
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[obj_instance.user.email],
                    fail_silently=settings.FAIL_EMAIL_SILENTLY,
                )
            except Exception as e:
                logging.getLogger(__name__).error(
                    f"Error sending email notification: {e}"
                )


def shift_labels_by_offset(serialized_labels, offset):
    """
    Shifts label geometries by [x, y] offset in meters.

    Args:
        serialized_labels (dict): GeoJSON-like dictionary with features
        offset (list): [x, y] offset in meters

    Returns:
        GeoDataFrame: GeoDataFrame with shifted geometries
    """
    gdf = gpd.GeoDataFrame.from_features(serialized_labels["features"])

    if gdf.crs is None:
        gdf.set_crs(epsg=4326, inplace=True)

    gdf_mercator = gdf.to_crs(epsg=3857)
    # because we want shifting happens in meters not degrees
    gdf_mercator["geometry"] = gdf_mercator["geometry"].apply(
        lambda geom: translate(geom, xoff=offset[0], yoff=offset[1])
    )

    gdf_shifted = gdf_mercator.to_crs(epsg=4326)

    return gdf_shifted


def safe_rmtree(path):
    """
    Safely delete a directory, handling EFS/NFS .nfs* lock files.
    Retries `shutil.rmtree` and falls back to `rm -rf`.

    Args:
        path (str): Path to remove.
        sleep_time (int): Seconds to wait between retries.
        max_rmtree_retries (int): How many times to retry `shutil.rmtree`.
        use_sudo (bool): Whether to use `sudo` in fallback `rm -rf`.
    """
    shutil.rmtree(path, ignore_errors=True)


def safe_copytree(src, dst):
    safe_rmtree(dst)
    shutil.copytree(src, dst)


def copyfile(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)


def get_file_count(path):
    try:
        return len(
            [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
        )
    except Exception as e:
        logging.getLogger(__name__).error(f"Error counting files: {e}")
        return 0


def xz_folder(folder_path, output_filename, remove_original=False):
    if not output_filename.endswith(".tar.xz"):
        output_filename += ".tar.xz"
    with tarfile.open(output_filename, "w:xz") as tar:
        tar.add(folder_path, arcname=os.path.basename(folder_path))
    if remove_original:
        shutil.rmtree(folder_path)


def setup_ramp():
    env_ramp_home = settings.RAMP_HOME
    ramp_home = Path(env_ramp_home) if env_ramp_home else Path.cwd() / "ramp"
    if not env_ramp_home:
        print("[!] RAMP_HOME not set. Using default: ./ramp")
    elif not ramp_home.exists():
        print(
            f"[!] RAMP_HOME is set to '{ramp_home}', but folder does not exist. Will set it up."
        )
    ramp_home = ramp_home.resolve()

    env_training_ws = settings.TRAINING_WORKSPACE
    training_workspace = (
        Path(env_training_ws) if env_training_ws else Path.cwd() / "trainings"
    )
    if not env_training_ws:
        print("[!] TRAINING_WORKSPACE not set. Using default: ./trainings")
    elif not training_workspace.exists():
        print(
            f"[!] TRAINING_WORKSPACE is set to '{training_workspace}', but folder does not exist. Will set it up."
        )
    training_workspace = training_workspace.resolve()

    ramp_code_dir = ramp_home / "ramp-code"
    checkpoint_dir = ramp_code_dir / "ramp"

    print(f"[+] RAMP_HOME: {ramp_home}")
    print(f"[+] TRAINING_WORKSPACE: {training_workspace}")

    ramp_home.mkdir(parents=True, exist_ok=True)
    training_workspace.mkdir(parents=True, exist_ok=True)

    if not ramp_code_dir.exists():
        print("[+] Downloading ramp-code-fAIr repo ZIP...")
        zip_url = (
            "https://github.com/hotosm/ramp-code-fair/archive/refs/heads/master.zip"
        )
        with tempfile.NamedTemporaryFile(suffix=".zip") as tmp_zip:
            urllib.request.urlretrieve(zip_url, tmp_zip.name)
            with zipfile.ZipFile(tmp_zip.name, "r") as zip_ref:
                zip_ref.extractall(ramp_home)

            extracted_root = next(ramp_home.glob("ramp-code-fair-*"), None)
            if extracted_root and extracted_root.is_dir():
                ramp_code_dir.mkdir(parents=True, exist_ok=True)
                for item in extracted_root.iterdir():
                    item.rename(ramp_code_dir / item.name)
                extracted_root.rmdir()
        print("[✓] ramp-code-fAIr setup complete.")
    else:
        print("[✓] ramp-code-fAIr already present.")

    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    checkpoint_index = checkpoint_dir / "checkpoint.tf"
    if not checkpoint_index.exists():
        print("[+] Downloading base model...")
        base_url = "https://api-prod.fair.hotosm.org/api/v1/workspace/download/ramp/baseline.zip"
        with tempfile.NamedTemporaryFile(suffix=".zip") as tmp_zip:
            urllib.request.urlretrieve(base_url, tmp_zip.name)
            with zipfile.ZipFile(tmp_zip.name, "r") as zip_ref:
                zip_ref.extractall(checkpoint_dir)
        print("[✓] Base model setup complete.")
    else:
        print("[✓] Base model already present.")

    os.environ["RAMP_HOME"] = str(ramp_home)
    os.environ["TRAINING_WORKSPACE"] = str(training_workspace)


def check_and_convert_crs(geojson_path):
    gdf = gpd.read_file(geojson_path)
    print(f"Original CRS: {gdf.crs}")

    if gdf.crs.to_epsg() != 4326:
        print("Converting to EPSG:4326")
        gdf_4326 = gdf.to_crs(epsg=4326)
        gdf_4326.to_file(geojson_path, driver="GeoJSON")
    else:
        print("Already in EPSG:4326, no conversion needed")


def geojson_to_fgb(input_path, output_path):
    gpd.read_file(input_path).to_file(output_path, driver="FlatGeobuf")
