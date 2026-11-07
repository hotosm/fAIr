from django.db import models
from django_tasks import TaskResult, TaskResultStatus
from django_tasks.base import Task
from django_tasks.signals import task_finished

from shared.enums import PipelineRunStatus


def _error_line(task_result: TaskResult) -> str:
    """The exception line that ends the traceback, e.g. "RuntimeError: no tiles"."""
    return task_result.errors[-1].traceback.strip().splitlines()[-1]


def mark_failed_when_task_fails(task: Task, model: type[models.Model], id_kwarg: str) -> None:
    """Mark the row failed with its error when `task` raises, so it never stays initializing."""

    def mark_failed(sender, task_result: TaskResult, **kwargs) -> None:
        failed = task_result.status == TaskResultStatus.FAILED
        if failed and task_result.task.module_path == task.module_path:
            model.objects.filter(id=task_result.kwargs[id_kwarg]).update(
                status=PipelineRunStatus.FAILED, error=_error_line(task_result)
            )

    task_finished.connect(mark_failed, weak=False, dispatch_uid=task.module_path)
