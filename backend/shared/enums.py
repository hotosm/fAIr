from django.db import models


class Visibility(models.TextChoices):
    """Owner-controlled read access for shareable artifacts."""

    PRIVATE = "private", "Private"
    PUBLIC = "public", "Public"


class PipelineRunStatus(models.TextChoices):
    """Lifecycle of a training or prediction run; `shared.run_status` maps ZenML onto it."""

    SUBMITTED = "submitted", "Submitted"
    RUNNING = "running", "Running"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"


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


class FeedbackAction(models.TextChoices):
    ACCEPT = "accept", "Accept"
    REJECT = "reject", "Reject"


class ValidationType(models.TextChoices):
    TRAINING = "training", "Training"
    PREDICTION = "prediction", "Prediction"


class ValidationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    FINISHED = "finished", "Finished"


class ValidationBuildStatus(models.TextChoices):
    BUILDING = "building", "Building"
    BUILT = "built", "Built"
    FAILED = "failed", "Failed"
