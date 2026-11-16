from django.apps import AppConfig


class PredictionConfig(AppConfig):
    name = "predictions"

    def ready(self) -> None:
        from shared.task_failures import mark_failed_when_task_fails

        from .models import Prediction
        from .tasks import delete_prediction_input_tiles, submit_prediction

        mark_failed_when_task_fails(
            submit_prediction,
            Prediction,
            "prediction_id",
            cleanup=lambda prediction_id: delete_prediction_input_tiles.enqueue(
                prediction_id=prediction_id
            ),
        )
