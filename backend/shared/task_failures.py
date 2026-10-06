from django.db import models
from django_tasks import TaskResult, TaskResultStatus
from django_tasks.base import Task
from django_tasks.signals import task_finished

from shared.enums import PipelineRunStatus


def mark_failed_when_task_fails(task: Task, model: type[models.Model], id_kwarg: str) -> None:
    """Set the row's status to failed when `task` raises, so its run never stays initializing."""

    def mark_failed(sender, task_result: TaskResult, **kwargs) -> None:
        failed = task_result.status == TaskResultStatus.FAILED
        if failed and task_result.task.module_path == task.module_path:
            model.objects.filter(id=task_result.kwargs[id_kwarg]).update(
                status=PipelineRunStatus.FAILED
            )

    task_finished.connect(mark_failed, weak=False, dispatch_uid=task.module_path)
