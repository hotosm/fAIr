from django.db import models


class Visibility(models.TextChoices):
    """Owner-controlled read access for shareable artifacts."""

    PRIVATE = "private", "Private"
    PUBLIC = "public", "Public"


class PipelineRunStatus(models.TextChoices):
    """Lifecycle of a ZenML-backed training or prediction run.

    Mirrors ``fair.zenml.runs.RunStatus`` plus ``SUBMITTED``, which this backend
    sets between handing a pipeline to ZenML and the first status poll.
    """

    INITIALIZING = "initializing", "Initializing"
    SUBMITTED = "submitted", "Submitted"
    PROVISIONING = "provisioning", "Provisioning"
    RUNNING = "running", "Running"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    CACHED = "cached", "Cached"
    RETRYING = "retrying", "Retrying"
    RETRIED = "retried", "Retried"
    STOPPING = "stopping", "Stopping"
    STOPPED = "stopped", "Stopped"


class DatasetStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    BUILDING = "building", "Building"
    BUILT = "built", "Built"
    FAILED = "failed", "Failed"


class LocalModelStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    ARCHIVED = "archived", "Archived"


class BaseModelStatus(models.TextChoices):
    REGISTERING = "registering", "Registering"
    ACTIVE = "active", "Active"
    FAILED = "failed", "Failed"
    ARCHIVED = "archived", "Archived"


class ModelCategory(models.TextChoices):
    BUILDINGS = "buildings", "Buildings"
    SOLAR_PANELS = "solar-panels", "Solar Panels"
    TREES = "trees", "Trees"
    ROADS = "roads", "Roads"
    OTHER = "other", "Other"


class FeedbackAction(models.TextChoices):
    ACCEPT = "accept", "Accept"
    REJECT = "reject", "Reject"
