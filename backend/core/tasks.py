import asyncio
import json
import logging
import os
import pathlib
import shutil
import subprocess
import sys
import time
from contextlib import contextmanager
from datetime import datetime

from celery import shared_task
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone

from core.models import (
    AOI,
    FeedbackAOI,
    FeedbackLabel,
    Label,
    Model,
    Prediction,
    Training,
)
from core.serializers import (
    AOISerializer,
    FeedbackAOISerializer,
    FeedbackLabelFileSerializer,
    LabelFileSerializer,
)
from core.utils import bbox, is_dir_empty

from .utils import (
    S3Uploader,
    check_and_convert_crs,
    copyfile,
    get_file_count,
    safe_copytree,
    safe_rmtree,
    send_notification,
    setup_ramp,
    shift_labels_by_offset,
    write_json,
    xz_folder,
)

DEFAULT_TILE_SIZE = 256


@contextmanager
def capture_output_to_file(log_path):
    original_stdout, original_stderr = sys.stdout, sys.stderr

    root_logger = logging.getLogger()
    original_handlers = root_logger.handlers.copy()
    original_levels = {handler: handler.level for handler in original_handlers}

    f = None
    file_handler = None

    try:
        f = open(log_path, "a", encoding="utf-8")
        sys.stdout = sys.stderr = f

        file_handler = logging.StreamHandler(f)
        root_logger.addHandler(file_handler)

        for handler in original_handlers:
            root_logger.removeHandler(handler)

        yield
    finally:
        sys.stdout, sys.stderr = original_stdout, original_stderr

        if file_handler is not None and file_handler in root_logger.handlers:
            try:
                root_logger.removeHandler(file_handler)
            except Exception:
                pass

        for handler in original_handlers:
            if handler not in root_logger.handlers:
                try:
                    root_logger.addHandler(handler)
                except Exception:
                    pass

        if f is not None and not f.closed:
            f.close()


class print_time:
    def __init__(self, name):
        self.name = name
        self.logger = logging.getLogger(__name__)

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, *args):
        self.logger.info(
            f"{self.name} took {round(time.perf_counter() - self.start, 2)}s"
        )


class Trainer:
    def __init__(self, model_type, *args):
        self.model_type = model_type
        self.args = args

    def run(self, output_path):
        return (
            self._train_yolo(output_path)
            if self.model_type.startswith("YOLO")
            else self._train_ramp(output_path)
        )

    def _train_yolo(self, output_path):
        from hot_fair_utilities import preprocess
        from hot_fair_utilities.preprocessing.yolo_v8_v1.yolo_format import (
            yolo_format as v1,
        )
        from hot_fair_utilities.preprocessing.yolo_v8_v2.yolo_format import (
            yolo_format as v2,
        )
        from hot_fair_utilities.training.yolo_v8_v1.train import train as train_v1
        from hot_fair_utilities.training.yolo_v8_v2.train import train as train_v2

        (
            inst,
            dataset_id,
            input_path,
            labels,
            aois,
            epochs,
            batch_size,
            freeze_layers,
            multimasks,
            *_,
        ) = self.args
        base = os.path.join(
            settings.YOLO_HOME,
            "yolo-data",
            str(dataset_id),
            datetime.now().strftime("%Y%m%dT%H%M"),
        )
        safe_rmtree(base)
        prep = f"/{base}/preprocessed"
        model_dir = os.path.join(base, self.model_type)
        yaml = os.path.join(model_dir, "yolo_dataset.yaml")
        out = output_path
        safe_copytree(input_path, os.path.join(base, "input"))
        preprocess(
            input_path=os.path.join(base, "input"),
            output_path=prep,
            rasterize=True,
            rasterize_options=["binary"],
            georeference_images=True,
            multimasks=(multimasks or self.model_type == "YOLO_V8_V1"),
            epsg=4326 if self.model_type == "YOLO_V8_V2" else 3857,
            input_contact_spacing=4,
            input_boundary_width=2,
        )

        inst.chips_length = get_file_count(os.path.join(prep, "chips"))
        inst.save()

        with print_time("YOLO format"):
            if self.model_type == "YOLO_V8_V1":
                v1(
                    preprocessed_dirs=prep,
                    yolo_dir=model_dir,
                    multimask=True,
                    p_val=0.05,
                )
            else:
                v2(input_path=prep, output_path=model_dir)

        train_fn = train_v1 if self.model_type == "YOLO_V8_V1" else train_v2
        weights = (
            "yolov8s_v1-seg-best.pt"
            if self.model_type == "YOLO_V8_V1"
            else "yolov8s_v2-seg.pt"
        )

        model_path, acc = train_fn(
            data=base,
            weights=os.path.join(settings.YOLO_HOME, weights),
            epochs=epochs,
            batch_size=batch_size,
            pc=2.0,
            output_path=model_dir,
            dataset_yaml_path=yaml,
        )

        safe_rmtree(out)
        os.makedirs(out)
        copyfile(model_path, os.path.join(out, "checkpoint.pt"))
        copyfile(
            os.path.join(os.path.dirname(model_path), "best.onnx"),
            os.path.join(out, "checkpoint.onnx"),
        )
        safe_copytree(prep, os.path.join(out, "preprocessed"))
        safe_copytree(input_path, os.path.join(out, "preprocessed", "input"))

        for k in ["images", "labels"]:
            safe_copytree(
                os.path.join(model_dir, k), os.path.join(out, self.model_type, k)
            )

        copyfile(yaml, os.path.join(out, self.model_type, "yolo_dataset.yaml"))
        copyfile(
            os.path.join(pathlib.Path(model_path).parent.parent, "iou_chart.png"),
            os.path.join(out, "graphs", "training_accuracy.png"),
        )

        write_json(os.path.join(out, "labels.geojson"), labels)
        write_json(os.path.join(out, "aois.geojson"), aois.data)
        safe_rmtree(base)
        return {
            "accuracy": acc,
            "output_path": out,
            "preprocess_output": os.path.join(out, "preprocessed"),
        }

    def _train_ramp(self, output_path):
        os.environ["TF_XLA_FLAGS"] = "--tf_xla_auto_jit=-1"
        import tensorflow as tf
        from hot_fair_utilities import preprocess
        from hot_fair_utilities.training.ramp import train

        tf.config.optimizer.set_jit(
            False
        )  # Disable XLA for RAMP training , bug in tensorflow 2.9.*

        # os.environ["TF_XLA_FLAGS"] = "--tf_xla_auto_jit=-1"

        setup_ramp()
        (
            inst,
            dataset_id,
            input_path,
            labels,
            aois,
            epochs,
            batch_size,
            freeze_layers,
            multimasks,
            spacing,
            width,
        ) = self.args
        base = os.path.join(
            settings.RAMP_HOME,
            "ramp-data",
            str(dataset_id),
            datetime.now().strftime("%Y%m%dT%H%M"),
        )
        safe_rmtree(base)
        prep = f"/{base}/preprocessed"
        out = output_path
        safe_copytree(input_path, os.path.join(base, "input"))
        preprocess(
            input_path=os.path.join(base, "input"),
            output_path=prep,
            rasterize=True,
            rasterize_options=["binary"],
            georeference_images=True,
            multimasks=multimasks,
            input_contact_spacing=spacing,
            input_boundary_width=width,
        )

        inst.chips_length = get_file_count(os.path.join(prep, "chips"))
        inst.save()

        acc, model_path = train(
            input_path=prep,
            output_path=os.path.join(base, "train"),
            epoch_size=epochs,
            batch_size=batch_size,
            model="ramp",
            model_home=os.environ["RAMP_HOME"],
            freeze_layers=freeze_layers,
            multimasks=multimasks,
        )

        safe_rmtree(out)
        os.makedirs(out)
        safe_copytree(model_path, os.path.join(out, "checkpoint.tf"))
        safe_copytree(prep, os.path.join(out, "preprocessed"))
        safe_copytree(input_path, os.path.join(out, "preprocessed", "input"))
        copyfile(
            os.path.join(base, "train", "graphs", "training_accuracy.png"),
            os.path.join(out, "graphs", "training_accuracy.png"),
        )

        model = tf.keras.models.load_model(os.path.join(out, "checkpoint.tf"))
        model.save(os.path.join(out, "checkpoint.h5"))

        tflite_model = tf.lite.TFLiteConverter.from_keras_model(model).convert()
        with open(os.path.join(out, "checkpoint.tflite"), "wb") as f:
            f.write(tflite_model)

        write_json(os.path.join(out, "labels.geojson"), labels)
        write_json(os.path.join(out, "aois.geojson"), aois.data)
        safe_rmtree(base)
        return {"accuracy": acc, "output_path": out, "preprocess_output": prep}


def upload_to_s3(path, parent=None):
    return S3Uploader(
        bucket_name=settings.BUCKET_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        parent=parent or settings.PARENT_BUCKET_FOLDER,
    ).upload(path)


def prepare_data(
    inst, dataset_id, feedback, zoom_level, imagery, input_path, imagery_type
):
    from geomltoolkits.downloader import tms as TMSDownloader

    safe_rmtree(input_path)
    os.makedirs(input_path)

    aois = (
        FeedbackAOI.objects.filter(training=feedback)
        if feedback
        else AOI.objects.filter(dataset=dataset_id)
    )
    serializer = FeedbackAOISerializer if feedback else AOISerializer
    label_qs = (
        FeedbackLabel.objects.filter(feedback_aoi__in=aois)
        if feedback
        else Label.objects.filter(aoi__in=aois)
    )
    label_serializer = FeedbackLabelFileSerializer if feedback else LabelFileSerializer

    inst.centroid = aois[0].geom.centroid
    inst.save()

    for obj in aois:
        for z in zoom_level:
            asyncio.run(
                TMSDownloader.download_tiles(
                    bbox=bbox(obj.geom.coords[0]),
                    zoom=z,
                    tms=imagery,
                    out=input_path,
                    georeference=False,
                    crs="3857",
                    extension="png",
                    is_tilejson=("TILEJSON" == imagery_type),
                )
            )
    input_path = pathlib.Path(input_path)
    chips_folder = input_path / "chips"
    if chips_folder.exists() and chips_folder.is_dir():
        for file in chips_folder.iterdir():
            if file.is_file():
                destination = input_path / file.name
                shutil.move(str(file), destination)
        chips_folder.rmdir()
    else:
        print("[✗] 'chips' folder does not exist at:", chips_folder)
    if is_dir_empty(input_path):
        raise ValueError("No images found in the area")

    serialized = label_serializer(label_qs, many=True).data
    label_path = os.path.join(input_path, "labels.geojson")
    offset = inst.model.dataset.offset

    if (
        isinstance(offset, list)
        and len(offset) == 2
        and any(float(o) != 0 for o in offset)
    ):
        shift_labels_by_offset(serialized, offset).to_file(
            label_path, driver="GeoJSON", encoding="utf-8"
        )
    else:
        write_json(label_path, serialized)

    with open(label_path) as f:
        return input_path, serializer(aois, many=True), json.load(f)


def run_tippecanoe(out):
    logger = logging.getLogger(__name__)
    try:
        check_and_convert_crs(os.path.join(out, "labels.geojson"))

        layers = []
        if os.path.exists(os.path.join(out, "labels_points.geojson")):
            layers.append(f'-L labels_points:"{out}/labels_points.geojson"')

        layers.append(f'-L labels:"{out}/labels.geojson"')

        layers.append(f'-L aois:"{out}/aois.geojson"')

        layers_str = " ".join(layers)

        subprocess.check_output(
            f"tippecanoe -o {out}/meta.pmtiles -Z7 -z20 "
            f"{layers_str} "
            "--force --read-parallel -rg --drop-densest-as-needed",
            shell=True,
            preexec_fn=os.setsid,
            timeout=60 * 60 * 1,  # 1 hour timeout
        )
    except subprocess.CalledProcessError as e:
        logger.error("Vector tiles creation failed: %s", e.stderr.decode())
        raise


def finalize(inst, out, prep, acc):
    for f in ["aois.geojson", "labels.geojson"]:
        copyfile(os.path.join(out, f), os.path.join(prep, f))
    logger = logging.getLogger(__name__)
    logger.info(f"Setting up output path {out}")
    os.makedirs(out, exist_ok=True)
    xz_folder(prep, os.path.join(out, "preprocessed.tar.xz"), remove_original=True)
    if settings.USE_S3_TO_UPLOAD_MODELS:
        upload_to_s3(out, parent=f"{settings.PARENT_BUCKET_FOLDER}/training_{inst.id}")
    inst.accuracy = float(acc)
    inst.finished_at = timezone.now()
    inst.status = "FINISHED"
    inst.save()


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
    inst = get_object_or_404(Training, id=training_id)
    model = get_object_or_404(Model, id=inst.model.id)
    inst.status, inst.started_at, inst.task_id = (
        "RUNNING",
        timezone.now(),
        train_model.request.id,
    )
    inst.save()
    send_notification(inst, "Started")

    log_file = os.path.join(settings.LOG_PATH, f"run_{inst.task_id}.log")
    os.makedirs(settings.LOG_PATH, exist_ok=True)
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(file_handler)

    try:
        logger.info("Starting model training task")
        with capture_output_to_file(log_file):
            input_path = os.path.join(
                settings.TRAINING_WORKSPACE,
                f"dataset_{dataset_id}",
                "input",
                f"training_{training_id}",
            )
            logger.info(f"Setting up input path {input_path}")
            os.makedirs(input_path, exist_ok=True)

            input_path, aoi_ser, labels = prepare_data(
                inst,
                dataset_id,
                feedback,
                zoom_level,
                source_imagery,
                input_path,
                inst.get_source_imagery_type,
            )
            output_path = os.path.join(
                settings.TRAINING_WORKSPACE,
                f"dataset_{dataset_id}",
                "output",
                f"training_{training_id}",
            )
            args = (
                inst,
                dataset_id,
                input_path,
                labels,
                aoi_ser,
                epochs,
                batch_size,
                freeze_layers,
                multimasks,
                input_contact_spacing,
                input_boundary_width,
            )
            result = Trainer(model.base_model, *args).run(output_path)
            run_tippecanoe(result["output_path"])
            finalize(
                inst,
                result["output_path"],
                result["preprocess_output"],
                result["accuracy"],
            )
        logger.info(f"Cleaning up input path {input_path}")
        safe_rmtree(input_path)
        logger.info("Training completed successfully")
        send_notification(inst, "Completed")
        return result
    except Exception as ex:
        logger.exception("Training failed")
        inst.status, inst.finished_at = "FAILED", timezone.now()
        inst.save()
        send_notification(inst, "Failed")
        raise ex
    finally:
        logger.removeHandler(file_handler)
        file_handler.close()


@shared_task
def predict_area(prediction_request_id, folder=None):
    from predictor import predict
    from predictor.models import PredictionRequest

    inst = get_object_or_404(Prediction, id=prediction_request_id)
    log_file = os.path.join(settings.LOG_PATH, f"run_{inst.task_id}.log")
    os.makedirs(settings.LOG_PATH, exist_ok=True)
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(file_handler)
    try:
        result = {}
        logger.info("Starting model prediction task")
        with capture_output_to_file(log_file):
            send_notification(inst, "Started")
            inst.status, inst.started_at, inst.task_id = (
                "RUNNING",
                timezone.now(),
                predict_area.request.id,
            )
            inst.save()
            if not inst.config.get("bbox"):
                inst.config["bbox"] = [
                    0,
                    0,
                    0,
                    0,
                ]  # add default bbox to pass through validation , TODO : Fix this , improve the pydantic model at fairpredictor side
            params = PredictionRequest(**inst.config)
            out = os.path.join(settings.PREDICTION_WORKSPACE, str(inst.id))
            os.makedirs(out, exist_ok=True)
            predictions = asyncio.run(
                predict(
                    geojson=inst.geom.geojson,
                    model_path=params.checkpoint,
                    zoom_level=params.zoom_level,
                    tms_url=params.source,
                    confidence=params.confidence / 100,
                    tolerance=params.tolerance,
                    area_threshold=params.area_threshold,
                    orthogonalize=params.orthogonalize,
                    ortho_skew_tolerance_deg=params.ortho_skew_tolerance_deg,
                    ortho_max_angle_change_deg=params.ortho_max_angle_change_deg,
                    get_predictions_as_points=True,  # True by default for now , however once it is implemented in the frontend make it parameterized #todo
                    remove_metadata=True,
                    output_path=out,
                )
            )
            write_json(
                os.path.join(out, "aois.geojson"),
                json.loads(inst.geom.geojson),
            )
            shutil.copy(
                os.path.join(out, "results", "geojson", "predictions.geojson"),
                os.path.join(out, "labels.geojson"),
            )
            shutil.copy(
                os.path.join(out, "results", "geojson", "predictions_points.geojson"),
                os.path.join(out, "labels_points.geojson"),
            )
            shutil.rmtree(
                os.path.join(out, "results")
            )  # todo : later on after implementation with the frontend keep this
            # write_json(
            #     os.path.join(out, "labels.geojson"),
            #     predictions,
            # )
            if len(predictions["features"]) == 0:
                raise ValueError("No features found in the predictions geojson")
            result["len_predictions"] = len(predictions["features"])

            run_tippecanoe(out)
            if settings.USE_S3_TO_UPLOAD_MODELS:
                s3_out_path = (
                    f"{settings.PARENT_BUCKET_FOLDER}/prediction_{inst.id}"
                    if not folder
                    else f"{settings.PARENT_BUCKET_FOLDER}/prediction/{folder}"
                )
                result["s3_path"] = s3_out_path
                upload_to_s3(
                    out,
                    parent=s3_out_path,
                )
            inst.status, inst.finished_at, inst.result_count = (
                "FINISHED",
                timezone.now(),
                len(predictions["features"]),
            )
            send_notification(inst, "Finished")
            inst.save()
        return result
    except Exception as ex:
        logger.exception("Prediction failed")
        inst.status, inst.finished_at = "FAILED", timezone.now()
        inst.save()
        send_notification(inst, "Failed")
        raise ex
    finally:
        logger.removeHandler(file_handler)
        file_handler.close()
