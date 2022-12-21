import logging
import os
import shutil

import hot_fair_utilities
import ramp.utils
from celery import shared_task
from core.models import Training
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from hot_fair_utilities import preprocess, train


@shared_task
def train_model(dataset_id, training_id, epochs, batch_size):

    training_instance = get_object_or_404(Training, id=training_id)
    training_instance.status = "RUNNING"
    training_instance.started_at = timezone.now()
    training_instance.save()
    try:
        # prepare data
        base_path = os.path.join(settings.RAMP_HOME, "ramp-data", str(dataset_id))
        destination_image_input = os.path.join(base_path, "input")
        training_input_base_path = os.path.join(
            settings.TRAINING_WORKSPACE, f"dataset_{dataset_id}"
        )
        training_input_image_source = os.path.join(training_input_base_path, "input")
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
        shutil.copytree(final_model_path, os.path.join(output_path, "checkpoint.tf"))
        shutil.copytree(preprocess_output, os.path.join(output_path, "preprocessed"))

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
        return response

    except Exception as ex:
        training_instance.status = "FAILED"
        training_instance.finished_at = timezone.now()
        training_instance.save()
        raise ex
