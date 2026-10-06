from django.apps import AppConfig


class TrainingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "trainings"

    def ready(self) -> None:
        from shared.task_failures import mark_failed_when_task_fails

        from .models import TrainingRunRef
        from .tasks import submit_training

        mark_failed_when_task_fails(submit_training, TrainingRunRef, "training_run_ref_id")
