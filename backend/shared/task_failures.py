from collections.abc import Callable

from django.db import models
from django_tasks import TaskResult, TaskResultStatus
from django_tasks.base import Task
from django_tasks.signals import task_finished

from shared.enums import PipelineRunStatus


def _error_line(task_result: TaskResult) -> str:
    """The exception line that ends the traceback, e.g. "RuntimeError: no tiles"."""
    return task_result.errors[-1].traceback.strip().splitlines()[-1]


def mark_failed_when_task_fails(
    task: Task,
    model: type[models.Model],
    id_kwarg: str,
    cleanup: Callable[[int], None] | None = None,
) -> None:
    """When `task` raises, mark its row failed with the error, then run `cleanup` on the row id."""

    def mark_failed(sender, task_result: TaskResult, **kwargs) -> None:
        failed = task_result.status == TaskResultStatus.FAILED
        if failed and task_result.task.module_path == task.module_path:
            row_id = task_result.kwargs[id_kwarg]
            model.objects.filter(id=row_id).update(
                status=PipelineRunStatus.FAILED, error=_error_line(task_result)
            )
            if cleanup:
                cleanup(row_id)

    task_finished.connect(mark_failed, weak=False, dispatch_uid=task.module_path)
