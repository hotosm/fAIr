from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from .swagger_schemas import (
    DATASET_CREATE_EXAMPLE,
    MODEL_CREATE_EXAMPLE,
    AOI_CREATE_EXAMPLE,
    LABEL_CREATE_EXAMPLE,
    TRAINING_CREATE_EXAMPLE,
    PREDICTION_CREATE_EXAMPLE,
    FEEDBACK_CREATE_EXAMPLE,
    TASK_STATUS_RESPONSE,
    CENTROID_RESPONSE,
)

def dataset_viewset_schema():
    return {
        'list': swagger_auto_schema(
            operation_summary="List all datasets",
            operation_description="Get paginated list of datasets. Supports filtering and search.",
            tags=['Datasets'],
            manual_parameters=[
                openapi.Parameter('search', openapi.IN_QUERY, description='Search by name', type=openapi.TYPE_STRING),
                openapi.Parameter('status', openapi.IN_QUERY, description='Filter by status', type=openapi.TYPE_STRING, enum=['DRAFT', 'PUBLISHED']),
            ]
        ),
        'create': swagger_auto_schema(
            operation_summary="Create a new dataset",
            operation_description="Create a dataset with imagery source URL and metadata.",
            tags=['Datasets'],
            request_body=DATASET_CREATE_EXAMPLE,
            responses={
                201: openapi.Response(description="Dataset created successfully"),
                400: "Validation error"
            }
        ),
        'retrieve': swagger_auto_schema(
            operation_summary="Get dataset details",
            operation_description="Retrieve detailed information about a specific dataset including model count.",
            tags=['Datasets'],
        ),
        'update': swagger_auto_schema(
            operation_summary="Update dataset",
            operation_description="Full update of a dataset. Requires all fields.",
            tags=['Datasets'],
            request_body=DATASET_CREATE_EXAMPLE,
        ),
        'partial_update': swagger_auto_schema(
            operation_summary="Partially update dataset",
            operation_description="Update specific fields of a dataset.",
            tags=['Datasets'],
        ),
        'destroy': swagger_auto_schema(
            operation_summary="Delete dataset",
            operation_description="Delete a dataset. Requires ownership or admin permissions.",
            tags=['Datasets'],
            responses={
                204: "Dataset deleted successfully",
                403: "Permission denied",
                404: "Dataset not found"
            }
        ),
    }

def model_viewset_schema():
    return {
        'list': swagger_auto_schema(
            operation_summary="List all models",
            operation_description="Get paginated list of AI models. Filter by status, dataset, dates.",
            tags=['Models'],
            manual_parameters=[
                openapi.Parameter('search', openapi.IN_QUERY, description='Search by name', type=openapi.TYPE_STRING),
                openapi.Parameter('status', openapi.IN_QUERY, description='Filter by status', type=openapi.TYPE_STRING, enum=['DRAFT', 'PUBLISHED']),
                openapi.Parameter('dataset', openapi.IN_QUERY, description='Filter by dataset ID', type=openapi.TYPE_INTEGER),
                openapi.Parameter('ordering', openapi.IN_QUERY, description='Order by field', type=openapi.TYPE_STRING),
            ]
        ),
        'create': swagger_auto_schema(
            operation_summary="Create a new model",
            operation_description="Initialize a new AI model linked to a dataset.",
            tags=['Models'],
            request_body=MODEL_CREATE_EXAMPLE,
            responses={
                201: openapi.Response(description="Model created successfully"),
                400: "Validation error"
            }
        ),
        'retrieve': swagger_auto_schema(
            operation_summary="Get model details",
            operation_description="Get detailed model info including accuracy, training info, thumbnail.",
            tags=['Models'],
        ),
        'update': swagger_auto_schema(
            operation_summary="Update model",
            operation_description="Full update of model metadata.",
            tags=['Models'],
            request_body=MODEL_CREATE_EXAMPLE,
        ),
        'partial_update': swagger_auto_schema(
            operation_summary="Partially update model",
            operation_description="Update specific fields like status, description.",
            tags=['Models'],
        ),
        'destroy': swagger_auto_schema(
            operation_summary="Delete model",
            operation_description="Delete a model. Requires ownership or admin permissions.",
            tags=['Models'],
            responses={
                204: "Model deleted successfully",
                403: "Permission denied"
            }
        ),
    }

def aoi_viewset_schema():
    return {
        'list': swagger_auto_schema(
            operation_summary="List all AOIs",
            operation_description="Get list of Areas of Interest with GeoJSON geometry.",
            tags=['AOI (Areas of Interest)'],
            manual_parameters=[
                openapi.Parameter('dataset', openapi.IN_QUERY, description='Filter by dataset ID', type=openapi.TYPE_INTEGER),
            ]
        ),
        'create': swagger_auto_schema(
            operation_summary="Create a new AOI",
            operation_description="Create an Area of Interest with polygon geometry.",
            tags=['AOI (Areas of Interest)'],
            request_body=AOI_CREATE_EXAMPLE,
            responses={
                201: openapi.Response(description="AOI created successfully"),
                400: "Invalid geometry or dataset not found"
            }
        ),
        'retrieve': swagger_auto_schema(
            operation_summary="Get AOI details",
            operation_description="Retrieve AOI with full GeoJSON geometry and label statistics.",
            tags=['AOI (Areas of Interest)'],
        ),
        'update': swagger_auto_schema(
            operation_summary="Update AOI",
            operation_description="Update AOI geometry or metadata.",
            tags=['AOI (Areas of Interest)'],
            request_body=AOI_CREATE_EXAMPLE,
        ),
        'partial_update': swagger_auto_schema(
            operation_summary="Partially update AOI",
            operation_description="Update specific AOI fields.",
            tags=['AOI (Areas of Interest)'],
        ),
        'destroy': swagger_auto_schema(
            operation_summary="Delete AOI",
            operation_description="Delete an AOI and all associated labels.",
            tags=['AOI (Areas of Interest)'],
            responses={
                204: "AOI deleted successfully",
                403: "Permission denied"
            }
        ),
    }

def training_viewset_schema():
    return {
        'list': swagger_auto_schema(
            operation_summary="List training sessions",
            operation_description="Get list of training sessions with status and metrics.",
            tags=['Training'],
            manual_parameters=[
                openapi.Parameter('model', openapi.IN_QUERY, description='Filter by model ID', type=openapi.TYPE_INTEGER),
                openapi.Parameter('status', openapi.IN_QUERY, description='Filter by status', type=openapi.TYPE_STRING, enum=['SUBMITTED', 'RUNNING', 'FINISHED', 'FAILED']),
                openapi.Parameter('search', openapi.IN_QUERY, description='Search in description', type=openapi.TYPE_STRING),
            ]
        ),
        'create': swagger_auto_schema(
            operation_summary="Start model training",
            operation_description="Submit a new training job. Rate limited to 10/hour per user.",
            tags=['Training'],
            request_body=TRAINING_CREATE_EXAMPLE,
            responses={
                201: openapi.Response(description="Training job submitted successfully"),
                400: "Validation error (e.g., no labels, invalid params)",
                429: "Rate limit exceeded"
            }
        ),
        'retrieve': swagger_auto_schema(
            operation_summary="Get training details",
            operation_description="Get training status, accuracy, and feedback statistics.",
            tags=['Training'],
        ),
        'destroy': swagger_auto_schema(
            operation_summary="Delete training",
            operation_description="Delete a training session. Cannot delete running trainings.",
            tags=['Training'],
            responses={
                204: "Training deleted successfully",
                400: "Cannot delete running training",
                403: "Permission denied"
            }
        ),
    }

def feedback_viewset_schema():
    return {
        'list': swagger_auto_schema(
            operation_summary="List feedback entries",
            operation_description="Get feedback (accepted/rejected predictions) with spatial filtering.",
            tags=['Feedback'],
            manual_parameters=[
                openapi.Parameter('training', openapi.IN_QUERY, description='Filter by training ID', type=openapi.TYPE_INTEGER),
                openapi.Parameter('action', openapi.IN_QUERY, description='Filter by action', type=openapi.TYPE_STRING, enum=['ACCEPT', 'REJECT']),
                openapi.Parameter('in_bbox', openapi.IN_QUERY, description='Spatial filter (minLon,minLat,maxLon,maxLat)', type=openapi.TYPE_STRING),
            ]
        ),
        'create': swagger_auto_schema(
            operation_summary="Create feedback",
            operation_description="Submit feedback to accept or reject a prediction.",
            tags=['Feedback'],
            request_body=FEEDBACK_CREATE_EXAMPLE,
            responses={
                201: openapi.Response(description="Feedback created successfully"),
                400: "Invalid geometry or parameters"
            }
        ),
        'retrieve': swagger_auto_schema(
            operation_summary="Get feedback details",
            operation_description="Retrieve specific feedback entry with geometry.",
            tags=['Feedback'],
        ),
        'update': swagger_auto_schema(
            operation_summary="Update feedback",
            operation_description="Update feedback action or comments.",
            tags=['Feedback'],
        ),
        'partial_update': swagger_auto_schema(
            operation_summary="Partially update feedback",
            operation_description="Update specific feedback fields.",
            tags=['Feedback'],
        ),
        'destroy': swagger_auto_schema(
            operation_summary="Delete feedback",
            operation_description="Delete a feedback entry.",
            tags=['Feedback'],
            responses={
                204: "Feedback deleted successfully",
                403: "Permission denied"
            }
        ),
    }

def label_viewset_schema():
    return {
        'list': swagger_auto_schema(
            operation_summary="List labels",
            operation_description="Get training labels with GeoJSON geometry.",
            tags=['Labels'],
            manual_parameters=[
                openapi.Parameter('aoi', openapi.IN_QUERY, description='Filter by AOI ID', type=openapi.TYPE_INTEGER),
                openapi.Parameter('aoi__dataset', openapi.IN_QUERY, description='Filter by dataset ID', type=openapi.TYPE_INTEGER),
                openapi.Parameter('in_bbox', openapi.IN_QUERY, description='Spatial filter', type=openapi.TYPE_STRING),
            ]
        ),
        'create': swagger_auto_schema(
            operation_summary="Create a label",
            operation_description="Create or update a training label with geometry.",
            tags=['Labels'],
            request_body=LABEL_CREATE_EXAMPLE,
            responses={
                200: openapi.Response(description="Label created or updated successfully"),
                400: "Invalid geometry"
            }
        ),
        'retrieve': swagger_auto_schema(
            operation_summary="Get label details",
            operation_description="Get specific label with full geometry and OSM tags.",
            tags=['Labels'],
        ),
        'destroy': swagger_auto_schema(
            operation_summary="Delete label",
            operation_description="Delete a label. Requires staff permissions.",
            tags=['Labels'],
            responses={
                204: "Label deleted successfully",
                403: "Staff permission required"
            }
        ),
    }
