from django.apps import AppConfig


class PredictionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "predictions"

    def ready(self) -> None:
        from shared.task_failures import mark_failed_when_task_fails

        from .models import Prediction
        from .tasks import submit_prediction

        mark_failed_when_task_fails(submit_prediction, Prediction, "prediction_id")
