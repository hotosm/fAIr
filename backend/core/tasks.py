import json
import logging
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import time
import traceback
from shutil import rmtree

from celery import shared_task
from core.models import (
    AOI,
    Feedback,
    FeedbackAOI,
    FeedbackLabel,
    Label,
    Model,
    Training,
)
from core.serializers import (
    AOISerializer,
    FeedbackAOISerializer,
    FeedbackFileSerializer,
    FeedbackLabelFileSerializer,
    LabelFileSerializer,
)
from core.utils import bbox, is_dir_empty
from django.conf import settings
from django.contrib.gis.db.models.aggregates import Extent
from django.contrib.gis.geos import GEOSGeometry
from django.shortcuts import get_object_or_404
from django.utils import timezone
from predictor import download_imagery, get_start_end_download_coords

from .utils import S3Uploader

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO
)


logger = logging.getLogger(__name__)
logger.propagate = False


# from core.serializers import LabelFileSerializer


DEFAULT_TILE_SIZE = 256


def upload_to_s3(
    path,
    parent=settings.PARENT_BUCKET_FOLDER,
    bucket_name=settings.BUCKET_NAME,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
):
    uploader = S3Uploader(
        bucket_name=bucket_name,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        parent=parent,
    )
    return uploader.upload(path)


class print_time:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, type, value, traceback):
        print(f"{self.name} took {round(time.perf_counter() - self.start, 2)} seconds")


def xz_folder(folder_path, output_filename, remove_original=False):
    """
    Compresses a folder and its contents into a .tar.xz file and optionally removes the original folder.

    Parameters:
    - folder_path: The path to the folder to compress.
    - output_filename: The name of the output .tar.xz file.
    - remove_original: If True, the original folder is removed after compression.
    """

    if not output_filename.endswith(".tar.xz"):
        output_filename += ".tar.xz"

    with tarfile.open(output_filename, "w:xz") as tar:
        tar.add(folder_path, arcname=os.path.basename(folder_path))

    if remove_original:
        shutil.rmtree(folder_path)


def get_file_count(path):
    try:
        return len(
            [
                entry
                for entry in os.listdir(path)
                if os.path.isfile(os.path.join(path, entry))
            ]
        )
    except Exception as e:
        print(f"An error occurred: {e}")
        return 0


def prepare_data(training_instance, dataset_id, feedback, zoom_level, source_imagery):
    training_input_base_path = os.path.join(
        settings.TRAINING_WORKSPACE, f"dataset_{dataset_id}"
    )
    training_input_image_source = os.path.join(training_input_base_path, "input")
    if os.path.exists(training_input_image_source):
        shutil.rmtree(training_input_image_source)
    os.makedirs(training_input_image_source)

    if feedback:
        aois = FeedbackAOI.objects.filter(training=feedback)
        aoi_serializer = FeedbackAOISerializer(aois, many=True)
    else:
        aois = AOI.objects.filter(dataset=dataset_id)
        aoi_serializer = AOISerializer(aois, many=True)

    first_aoi_centroid = aois[0].geom.centroid
    training_instance.centroid = first_aoi_centroid
    training_instance.save()

    for obj in aois:
        bbox_coords = bbox(obj.geom.coords[0])
        for z in zoom_level:
            zm_level = z
            try:
                tile_size = DEFAULT_TILE_SIZE
                start, end = get_start_end_download_coords(
                    bbox_coords, zm_level, tile_size
                )
                download_imagery(
                    start,
                    end,
                    zm_level,
                    base_path=training_input_image_source,
                    source=source_imagery,
                )
            except Exception as ex:
                raise ex
        if is_dir_empty(training_input_image_source):
            raise ValueError("No images found in the area")

    if feedback:
        label = FeedbackLabel.objects.filter(feedback_aoi__in=[r.id for r in aois])
        serialized_field = FeedbackLabelFileSerializer(label, many=True)
    else:
        label = Label.objects.filter(aoi__in=[r.id for r in aois])
        serialized_field = LabelFileSerializer(label, many=True)

    with open(
        os.path.join(training_input_image_source, "labels.geojson"),
        "w",
        encoding="utf-8",
    ) as f:
        f.write(json.dumps(serialized_field.data))

    return training_input_image_source, aoi_serializer, serialized_field


def ramp_model_training(
    training_instance,
    dataset_id,
    training_input_image_source,
    serialized_field,
    aoi_serializer,
    epochs,
    batch_size,
    freeze_layers,
    multimasks,
    input_contact_spacing,
    input_boundary_width,
):
    import hot_fair_utilities
    import ramp.utils
    import tensorflow as tf
    from hot_fair_utilities import preprocess
    from hot_fair_utilities.training.ramp import run_feedback, train

    base_path = os.path.join(settings.RAMP_HOME, "ramp-data", str(dataset_id))
    if os.path.exists(base_path):
        rmtree(base_path)
    destination_image_input = os.path.join(base_path, "input")

    if not os.path.exists(training_input_image_source):
        raise ValueError(
            "Training folder has not been created, Build the dataset first /dataset/build/"
        )
    if os.path.exists(destination_image_input):
        shutil.rmtree(destination_image_input)
    shutil.copytree(training_input_image_source, destination_image_input)

    model_input_image_path = f"{base_path}/input"
    preprocess_output = f"/{base_path}/preprocessed"

    preprocess(
        input_path=model_input_image_path,
        output_path=preprocess_output,
        rasterize=True,
        rasterize_options=["binary"],
        georeference_images=True,
        multimasks=multimasks,
        input_contact_spacing=input_contact_spacing,
        input_boundary_width=input_boundary_width,
    )
    training_instance.chips_length = get_file_count(
        os.path.join(preprocess_output, "chips")
    )
    training_instance.save()

    train_output = f"{base_path}/train"
    final_accuracy, final_model_path = train(
        input_path=preprocess_output,
        output_path=train_output,
        epoch_size=epochs,
        batch_size=batch_size,
        model="ramp",
        model_home=os.environ["RAMP_HOME"],
        freeze_layers=freeze_layers,
        multimasks=multimasks,
    )

    output_path = os.path.join(
        pathlib.Path(training_input_image_source).parent,
        "output",
        f"training_{training_instance.id}",
    )
    if os.path.exists(output_path):
        shutil.rmtree(output_path)
    shutil.copytree(final_model_path, os.path.join(output_path, "checkpoint.tf"))

    shutil.copytree(preprocess_output, os.path.join(output_path, "preprocessed"))
    shutil.copytree(
        model_input_image_path, os.path.join(output_path, "preprocessed", "input")
    )

    graph_output_path = f"{base_path}/train/graphs"
    shutil.copytree(graph_output_path, os.path.join(output_path, "graphs"))

    model = tf.keras.models.load_model(os.path.join(output_path, "checkpoint.tf"))

    model.save(os.path.join(output_path, "checkpoint.h5"))

    logger.info(model.inputs)
    logger.info(model.outputs)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()

    with open(os.path.join(output_path, "checkpoint.tflite"), "wb") as f:
        f.write(tflite_model)

    with open(os.path.join(output_path, "labels.geojson"), "w", encoding="utf-8") as f:
        f.write(json.dumps(serialized_field.data))

    with open(os.path.join(output_path, "aois.geojson"), "w", encoding="utf-8") as f:
        f.write(json.dumps(aoi_serializer.data))

    tippecanoe_command = f"""tippecanoe -o {os.path.join(output_path,"meta.pmtiles")} -Z7 -z18 -L aois:{ os.path.join(output_path, "aois.geojson")} -L labels:{os.path.join(output_path, "labels.geojson")} --force --read-parallel -rg --drop-densest-as-needed"""
    try:
        result = subprocess.run(
            tippecanoe_command, shell=True, check=True, capture_output=True
        )
        logging.info(result.stdout.decode("utf-8"))
    except subprocess.CalledProcessError as ex:
        logger.error(ex.output)
        raise ex

    shutil.copyfile(
        os.path.join(output_path, "aois.geojson"),
        os.path.join(preprocess_output, "aois.geojson"),
    )
    shutil.copyfile(
        os.path.join(output_path, "labels.geojson"),
        os.path.join(preprocess_output, "labels.geojson"),
    )
    xz_folder(
        preprocess_output,
        os.path.join(output_path, "preprocessed.tar.xz"),
        remove_original=True,
    )
    shutil.rmtree(base_path)
    dir_result = upload_to_s3(
        output_path,
        parent=f"{settings.PARENT_BUCKET_FOLDER}/training_{training_instance.id}",
    )
    print(f"Uploaded to s3:{dir_result}")
    training_instance.accuracy = float(final_accuracy)
    training_instance.finished_at = timezone.now()
    training_instance.status = "FINISHED"
    training_instance.save()
    response = {
        "accuracy": float(final_accuracy),
        "tiles_path": os.path.join(output_path, "meta.pmtiles"),
        "model_path": os.path.join(output_path, "checkpoint.h5"),
        "graph_path": os.path.join(output_path, "graphs"),
    }
    return response


def yolo_model_training(
    training_instance,
    dataset_id,
    training_input_image_source,
    serialized_field,
    aoi_serializer,
    epochs,
    batch_size,
    multimasks,
    model="YOLO_V8_V1",
):
    from hot_fair_utilities import preprocess
    from hot_fair_utilities.preprocessing.yolo_v8_v1.yolo_format import (
        yolo_format as yolo_format_v1,
    )
    from hot_fair_utilities.preprocessing.yolo_v8_v2.yolo_format import (
        yolo_format as yolo_format_v2,
    )
    from hot_fair_utilities.training.yolo_v8_v1.train import train as train_yolo_v1
    from hot_fair_utilities.training.yolo_v8_v2.train import train as train_yolo_v2

    base_path = os.path.join(settings.YOLO_HOME, "yolo-data", str(dataset_id))
    if os.path.exists(base_path):
        rmtree(base_path)
    destination_image_input = os.path.join(base_path, "input")

    if not os.path.exists(training_input_image_source):
        raise ValueError(
            "Training folder has not been created, Build the dataset first /dataset/build/"
        )
    if os.path.exists(destination_image_input):
        shutil.rmtree(destination_image_input)
    shutil.copytree(training_input_image_source, destination_image_input)

    model_input_image_path = f"{base_path}/input"
    preprocess_output = f"/{base_path}/preprocessed"
    if model == "YOLO_V8_V1":
        multimasks = True
    preprocess(
        input_path=model_input_image_path,
        output_path=preprocess_output,
        rasterize=True,
        rasterize_options=["binary"],
        georeference_images=True,
        multimasks=multimasks,
        epsg=4326 if model == "YOLO_V8_V2" else 3857,
    )
    training_instance.chips_length = get_file_count(
        os.path.join(preprocess_output, "chips")
    )
    training_instance.save()

    yolo_data_dir = os.path.join(base_path, model)
    with print_time("yolo conversion"):
        if model == "YOLO_V8_V1":
            yolo_format_v1(
                preprocessed_dirs=preprocess_output,
                yolo_dir=yolo_data_dir,
                multimask=True,
                p_val=0.05,
            )
        else:
            yolo_format_v2(
                input_path=preprocess_output,
                output_path=yolo_data_dir,
            )
    if model == "YOLO_V8_V1":
        output_model_path, final_accuracy = train_yolo_v1(
            data=f"{base_path}",
            weights=os.path.join(settings.YOLO_HOME, "yolov8s_v1-seg-best.pt"),
            epochs=epochs,
            batch_size=batch_size,
            pc=2.0,
            output_path=yolo_data_dir,
            dataset_yaml_path=os.path.join(yolo_data_dir, "yolo_dataset.yaml"),
        )
    else:
        output_model_path, final_accuracy = train_yolo_v2(
            data=f"{base_path}",
            weights=os.path.join(settings.YOLO_HOME, "yolov8s_v2-seg.pt"),
            epochs=epochs,
            batch_size=batch_size,
            pc=2.0,
            output_path=yolo_data_dir,
            dataset_yaml_path=os.path.join(yolo_data_dir, "yolo_dataset.yaml"),
        )

    output_path = os.path.join(
        pathlib.Path(training_input_image_source).parent,
        "output",
        f"training_{training_instance.id}",
    )
    if os.path.exists(output_path):
        shutil.rmtree(output_path)
    # print(output_path)
    os.makedirs(output_path)

    shutil.copyfile(output_model_path, os.path.join(output_path, "checkpoint.pt"))
    shutil.copyfile(
        os.path.join(os.path.dirname(output_model_path), "best.onnx"),
        os.path.join(output_path, "checkpoint.onnx"),
    )

    shutil.copytree(preprocess_output, os.path.join(output_path, "preprocessed"))
    shutil.copytree(
        model_input_image_path, os.path.join(output_path, "preprocessed", "input")
    )
    os.makedirs(os.path.join(output_path, model), exist_ok=True)

    shutil.copytree(
        os.path.join(yolo_data_dir, "images"),
        os.path.join(output_path, model, "images"),
    )
    shutil.copytree(
        os.path.join(yolo_data_dir, "labels"),
        os.path.join(output_path, model, "labels"),
    )
    shutil.copyfile(
        os.path.join(yolo_data_dir, "yolo_dataset.yaml"),
        os.path.join(output_path, model, "yolo_dataset.yaml"),
    )

    graph_output_path = os.path.join(
        pathlib.Path(os.path.dirname(output_model_path)).parent, "iou_chart.png"
    )
    os.makedirs(os.path.join(output_path, "graphs"), exist_ok=True)
    shutil.copyfile(
        graph_output_path,
        os.path.join(
            output_path,
            "graphs",
            "training_accuracy.png",  ### TODO : replace this with actual graph that will be decided
        ),
    )

    with open(os.path.join(output_path, "labels.geojson"), "w", encoding="utf-8") as f:
        f.write(json.dumps(serialized_field.data))

    with open(os.path.join(output_path, "aois.geojson"), "w", encoding="utf-8") as f:
        f.write(json.dumps(aoi_serializer.data))

    tippecanoe_command = f"""tippecanoe -o {os.path.join(output_path,"meta.pmtiles")} -Z7 -z18 -L aois:{ os.path.join(output_path, "aois.geojson")} -L labels:{os.path.join(output_path, "labels.geojson")} --force --read-parallel -rg --drop-densest-as-needed"""
    try:
        result = subprocess.run(
            tippecanoe_command, shell=True, check=True, capture_output=True
        )
        logging.info(result.stdout.decode("utf-8"))
    except subprocess.CalledProcessError as ex:
        logger.error(ex.output)
        raise ex

    shutil.copyfile(
        os.path.join(output_path, "aois.geojson"),
        os.path.join(preprocess_output, "aois.geojson"),
    )
    shutil.copyfile(
        os.path.join(output_path, "labels.geojson"),
        os.path.join(preprocess_output, "labels.geojson"),
    )
    xz_folder(
        preprocess_output,
        os.path.join(output_path, "preprocessed.tar.xz"),
        remove_original=True,
    )
    shutil.rmtree(base_path)
    dir_result = upload_to_s3(
        output_path,
        parent=f"{settings.PARENT_BUCKET_FOLDER}/training_{training_instance.id}",
    )
    print(f"Uploaded to s3:{dir_result}")
    training_instance.accuracy = float(final_accuracy)
    training_instance.finished_at = timezone.now()
    training_instance.status = "FINISHED"
    training_instance.save()
    response = {
        "accuracy": float(final_accuracy),
        "tiles_path": os.path.join(output_path, "meta.pmtiles"),
        "model_path": os.path.join(output_path, "checkpoint.pt"),
        "graph_path": os.path.join(output_path, "graphs"),
    }
    return response


@shared_task
def train_model(
    dataset_id,
    training_id,
    epochs,
    batch_size,
    zoom_level,
    source_imagery,
    feedback=None,
    freeze_layers=False,
    multimasks=False,
    input_contact_spacing=8,
    input_boundary_width=3,
):

    training_instance = get_object_or_404(Training, id=training_id)
    model_instance = get_object_or_404(Model, id=training_instance.model.id)

    training_instance.status = "RUNNING"
    training_instance.started_at = timezone.now()
    training_instance.save()
    os.makedirs(settings.LOG_PATH, exist_ok=True)
    if training_instance.task_id is None or training_instance.task_id.strip() == "":
        training_instance.task_id = train_model.request.id
        training_instance.save()
    log_file = os.path.join(settings.LOG_PATH, f"run_{train_model.request.id}.log")

    if model_instance.base_model == "YOLO_V8_V1" and settings.YOLO_HOME is None:
        raise ValueError("YOLO Home is not configured")
    elif model_instance.base_model != "YOLO_V8_V1" and settings.RAMP_HOME is None:
        raise ValueError("Ramp Home is not configured")

    try:
        with open(log_file, "a") as f:
            # redirect stdout to the log file
            sys.stdout = f
            training_input_image_source, aoi_serializer, serialized_field = (
                prepare_data(
                    training_instance, dataset_id, feedback, zoom_level, source_imagery
                )
            )

            if model_instance.base_model in ("YOLO_V8_V1", "YOLO_V8_V2"):
                response = yolo_model_training(
                    training_instance,
                    dataset_id,
                    training_input_image_source,
                    serialized_field,
                    aoi_serializer,
                    epochs,
                    batch_size,
                    multimasks,
                    model=model_instance.base_model,
                )
            else:
                response = ramp_model_training(
                    training_instance,
                    dataset_id,
                    training_input_image_source,
                    serialized_field,
                    aoi_serializer,
                    epochs,
                    batch_size,
                    freeze_layers,
                    multimasks,
                    input_contact_spacing,
                    input_boundary_width,
                )

            logging.info(f"Training task {training_id} completed successfully")
            return response

    except Exception as ex:
        training_instance.status = "FAILED"
        training_instance.finished_at = timezone.now()
        training_instance.save()
        raise ex
