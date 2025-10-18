from drf_yasg import openapi

DATASET_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "name": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Dataset name",
            example="Building Detection Nepal",
        ),
        "source_imagery": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="TMS URL template for imagery tiles",
            example="https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
        ),
        "status": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Dataset status (-1: DRAFT, 0: ACTIVE, 1: ARCHIVED)",
            enum=[-1, 0, 1],
            example=-1,
        ),
        "offset": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_NUMBER),
            description="Tile offset for imagery alignment",
            example=[0.0, 0.0],
        ),
    },
    required=["name"],
)

MODEL_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "dataset": openapi.Schema(
            type=openapi.TYPE_INTEGER, description="Dataset ID", example=1
        ),
        "name": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Model name",
            example="YOLOv8 Building Model v1",
        ),
        "description": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Model description",
            example="Building detection model trained on Kathmandu imagery",
        ),
        "base_model": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Base model type",
            enum=["RAMP", "YOLO_V8_V1", "YOLO_V8_V2"],
            example="YOLO_V8_V1",
        ),
        "status": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Model status",
            enum=["DRAFT", "PUBLISHED"],
            example="DRAFT",
        ),
    },
    required=["dataset", "name", "base_model"],
)

AOI_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "dataset": openapi.Schema(
            type=openapi.TYPE_INTEGER, description="Dataset ID", example=1
        ),
        "geom": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description="GeoJSON Polygon geometry",
            example={
                "type": "Polygon",
                "coordinates": [
                    [
                        [85.3240, 27.7172],
                        [85.3250, 27.7172],
                        [85.3250, 27.7182],
                        [85.3240, 27.7182],
                        [85.3240, 27.7172],
                    ]
                ],
            },
        ),
    },
    required=["dataset", "geom"],
)

LABEL_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "aoi": openapi.Schema(
            type=openapi.TYPE_INTEGER, description="AOI ID", example=1
        ),
        "geom": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description="GeoJSON geometry (Point or Polygon)",
            example={
                "type": "Polygon",
                "coordinates": [
                    [
                        [85.32405, 27.71725],
                        [85.32410, 27.71725],
                        [85.32410, 27.71730],
                        [85.32405, 27.71730],
                        [85.32405, 27.71725],
                    ]
                ],
            },
        ),
        "osm_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="OSM feature ID (optional)",
            example=123456789,
        ),
        "tags": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description="OSM tags",
            example={"building": "yes", "roof:material": "metal"},
        ),
    },
    required=["aoi", "geom"],
)

TRAINING_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "model": openapi.Schema(
            type=openapi.TYPE_INTEGER, description="Model ID", example=1
        ),
        "description": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Training description",
            example="Training run with 50 epochs",
        ),
        "epochs": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Number of training epochs",
            example=50,
            minimum=5,
            maximum=200,
        ),
        "batch_size": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Batch size",
            example=8,
            enum=[4, 8, 16, 32],
        ),
        "zoom_level": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_INTEGER),
            description="Zoom levels for training tiles",
            example=[19, 20],
        ),
        "freeze_layers": openapi.Schema(
            type=openapi.TYPE_BOOLEAN,
            description="Freeze pretrained layers",
            example=False,
        ),
        "source_imagery": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Override dataset imagery URL (optional)",
            example="https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
        ),
        "multimasks": openapi.Schema(
            type=openapi.TYPE_BOOLEAN,
            description="Enable multi-mask prediction",
            example=False,
        ),
        "input_contact_spacing": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Contact spacing for multi-mask",
            example=8,
            minimum=0,
            maximum=20,
        ),
        "input_boundary_width": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Boundary width for multi-mask",
            example=3,
            minimum=0,
            maximum=10,
        ),
    },
    required=["model", "epochs", "batch_size", "zoom_level"],
)

PREDICTION_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "bbox": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_NUMBER),
            description="Bounding box [minLon, minLat, maxLon, maxLat]",
            example=[85.3240, 27.7172, 85.3250, 27.7182],
        ),
        "model_id": openapi.Schema(
            type=openapi.TYPE_INTEGER, description="Model ID", example=1
        ),
        "zoom_level": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Zoom level for prediction",
            example=20,
            minimum=18,
            maximum=22,
        ),
        "confidence": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Confidence threshold (0-100)",
            example=50,
            minimum=0,
            maximum=100,
        ),
        "source": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Custom imagery URL (optional)",
            example="https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
        ),
    },
    required=["bbox", "model_id", "zoom_level"],
)

FEEDBACK_CREATE_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "geom": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description="GeoJSON geometry of the feedback area",
            example={
                "type": "Polygon",
                "coordinates": [
                    [
                        [85.3240, 27.7172],
                        [85.3250, 27.7172],
                        [85.3250, 27.7182],
                        [85.3240, 27.7182],
                        [85.3240, 27.7172],
                    ]
                ],
            },
        ),
        "training": openapi.Schema(
            type=openapi.TYPE_INTEGER, description="Training ID (optional)", example=1
        ),
        "action": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Feedback action",
            enum=["ACCEPT", "REJECT"],
            example="ACCEPT",
        ),
        "comments": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="User comments",
            example="Good detection",
        ),
        "config": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description="Prediction config used",
            example={"confidence": 50},
        ),
    },
    required=["geom", "action"],
)

OSM_FETCH_EXAMPLE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    description="OSM fetch endpoint takes no parameters - it uses the AOI geometry automatically",
    properties={},
)

TASK_STATUS_RESPONSE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Task ID",
            example="abc123-def456-ghi789",
        ),
        "state": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Task state",
            enum=["PENDING", "STARTED", "SUCCESS", "FAILURE", "RETRY"],
            example="SUCCESS",
        ),
        "result": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description="Task result (if completed)",
            example={
                "accuracy": 0.92,
                "output_path": "/trainings/123/model.pt",
                "preprocess_output": "10000 chips generated",
            },
        ),
        "error": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Error message (if failed)",
            example=None,
        ),
    },
)

WORKSPACE_DOWNLOAD_PARAMS = [
    openapi.Parameter(
        "lookup_dir",
        openapi.IN_QUERY,
        description="Directory name",
        type=openapi.TYPE_STRING,
        example="trainings/123",
    ),
    openapi.Parameter(
        "filename",
        openapi.IN_QUERY,
        description="Filename to download",
        type=openapi.TYPE_STRING,
        example="model.pt",
    ),
]

WORKSPACE_BROWSE_PARAMS = [
    openapi.Parameter(
        "lookup_dir",
        openapi.IN_QUERY,
        description="Directory to browse",
        type=openapi.TYPE_STRING,
        example="trainings/123",
    ),
]

CENTROID_RESPONSE = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "type": openapi.Schema(type=openapi.TYPE_STRING, example="FeatureCollection"),
        "features": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "type": openapi.Schema(type=openapi.TYPE_STRING, example="Feature"),
                    "properties": openapi.Schema(
                        type=openapi.TYPE_OBJECT, example={"mid": 1}
                    ),
                    "geometry": openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        example={"type": "Point", "coordinates": [85.3245, 27.7177]},
                    ),
                },
            ),
        ),
    },
)
