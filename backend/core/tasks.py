import json
import logging
import os
import shutil
import sys
import traceback
from shutil import rmtree

import hot_fair_utilities
import ramp.utils
from celery import shared_task
from core.models import AOI, Label, Training
from core.serializers import LabelFileSerializer
from core.utils import bbox, download_imagery, get_start_end_download_coords
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from hot_fair_utilities import preprocess, train

logger = logging.getLogger(__name__)

# from core.serializers import LabelFileSerializer


DEFAULT_TILE_SIZE = 256


@shared_task
def train_model(
    dataset_id, training_id, epochs, batch_size, zoom_level, source_imagery
):

    training_instance = get_object_or_404(Training, id=training_id)
    training_instance.status = "RUNNING"
    training_instance.started_at = timezone.now()
    training_instance.save()

    try:
        ## -----------IMAGE DOWNLOADER---------
        os.makedirs(settings.LOG_PATH, exist_ok=True)

        log_file = os.path.join(
            settings.LOG_PATH, f"run_{train_model.request.id}_log.txt"
        )
        with open(log_file, "w") as f:
            # redirect stdout to the log file
            sys.stdout = f
            try:
                aois = AOI.objects.filter(dataset=dataset_id)
            except AOI.DoesNotExist:
                raise ValueError(
                    f"No AOI is attached with supplied dataset id:{dataset_id}, Create AOI first",
                )
            training_input_base_path = os.path.join(
                settings.TRAINING_WORKSPACE, f"dataset_{dataset_id}"
            )
            training_input_image_source = os.path.join(
                training_input_base_path, "input"
            )
            if os.path.exists(training_input_image_source):  # always build dataset
                shutil.rmtree(training_input_image_source)
            os.makedirs(training_input_image_source)
            for obj in aois:
                for z in zoom_level:
                    zm_level = z
                    print(
                        f"""Running Download process for
                            aoi : {obj.id} - dataset : {dataset_id} , zoom : {zm_level}"""
                    )
                    try:
                        tile_size = DEFAULT_TILE_SIZE  # by default
                        bbox_coords = bbox(obj.geom.coords[0])
                        start, end = get_start_end_download_coords(
                            bbox_coords, zm_level, tile_size
                        )
                        # start downloading
                        download_imagery(
                            start,
                            end,
                            zm_level,
                            base_path=training_input_image_source,
                            source=source_imagery,
                        )
                    except Exception as ex:
                        raise ex

            ## -----------LABEL GENERATOR---------
            aoi_list = [r.id for r in aois]
            label = Label.objects.filter(aoi__in=aoi_list).values()
            serialized_field = LabelFileSerializer(data=list(label), many=True)

            if serialized_field.is_valid(raise_exception=True):
                with open(
                    os.path.join(training_input_image_source, "labels.geojson"),
                    "w",
                    encoding="utf-8",
                ) as f:
                    f.write(json.dumps(serialized_field.data))
                f.close()

            ## --------- Data Preparation ----------
            base_path = os.path.join(settings.RAMP_HOME, "ramp-data", str(dataset_id))
            # Check if the path exists
            if os.path.exists(base_path):
                # Delete the directory and its contents
                rmtree(base_path)
            destination_image_input = os.path.join(base_path, "input")

            logging.info(training_input_image_source)
            if not os.path.exists(training_input_image_source):
                raise ValueError(
                    "Training folder has not been created at , Build the dataset first /dataset/build/"
                )
            if os.path.exists(destination_image_input):
                shutil.rmtree(destination_image_input)
            shutil.copytree(training_input_image_source, destination_image_input)

            # preprocess
            model_input_image_path = f"{base_path}/input"
            preprocess_output = f"/{base_path}/preprocessed"
            preprocess(
                input_path=model_input_image_path,
                output_path=preprocess_output,
                rasterize=True,
                rasterize_options=["binary"],
                georeference_images=True,
            )

            # train

            train_output = f"{base_path}/train"
            final_accuracy, final_model_path = train(
                input_path=preprocess_output,
                output_path=train_output,
                epoch_size=epochs,
                batch_size=batch_size,
                model="ramp",
                model_home=os.environ["RAMP_HOME"],
            )

            # copy final model to output
            output_path = os.path.join(
                training_input_base_path, "output", f"training_{training_id}"
            )
            if os.path.exists(output_path):
                shutil.rmtree(output_path)
            shutil.copytree(
                final_model_path, os.path.join(output_path, "checkpoint.tf")
            )
            shutil.copytree(
                preprocess_output, os.path.join(output_path, "preprocessed")
            )

            graph_output_path = f"{base_path}/train/graphs"
            shutil.copytree(graph_output_path, os.path.join(output_path, "graphs"))

            # now remove the ramp-data all our outputs are copied to our training workspace
            shutil.rmtree(base_path)
            training_instance.accuracy = float(final_accuracy)
            training_instance.finished_at = timezone.now()
            training_instance.status = "FINISHED"
            training_instance.save()
            response = {}
            response["accuracy"] = float(final_accuracy)
            response["model_path"] = os.path.join(output_path, "checkpoint.tf")
            response["graph_path"] = os.path.join(output_path, "graphs")
            sys.stdout = sys.__stdout__
        logger.info(f"Training task {training_id} completed successfully")
        return response

    except Exception as ex:
        training_instance.status = "FAILED"
        training_instance.finished_at = timezone.now()
        training_instance.save()
        raise ex
