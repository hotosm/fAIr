---
icon: lucide/brain-circuit
description: How registration, training, and prediction run across ZenML, STAC, MinIO, and MLflow.
---

# ML pipeline

The backend never trains or runs inference inline. It submits pipelines to ZenML and polls their state. The choice of ZenML as the orchestrator is recorded in the [MLOps decision record](decisions/infra/0001-mlops.md).

## Roles

| Service                          | Role                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| **STAC** (pgSTAC + stac-fastapi) | Source of truth for dataset, base-model, and local-model metadata and asset URLs.   |
| **MinIO** (S3)                   | Stores chips, `labels.geojson`, `weights.pt`, `model.onnx`, and prediction outputs. |
| **MLflow**                       | Tracks training experiments.                                                        |
| **ZenML**                        | Orchestrates pipeline steps and records run status and artifacts.                   |

## Contribute and register a model

A model developer contributes through the [fAIr-models catalog](https://hotosm.github.io/fAIr-models/): they open a pull request, and after review and merge, the model's image is built, its weights are uploaded to object storage, and a STAC item is registered in the `base-models` collection. The backend then serves the approved model.

```mermaid
flowchart TD
    A[Model developer] -->|Prepares PR| B[fAIr-models GitHub]
    B -->|CI: build, validate, test| C{Review}
    C -->|Merge| D[Post-merge CI]
    D --> E[Build and push Docker image]
    D --> F[Upload weights to S3]
    D --> G[Register STAC item in base-models]
    G --> H[STAC: base-models/model v1]
```

Inside fAIr, registration is admin-only and asynchronous: the backend hands the STAC item to fair-py-ops, which mirrors the model weights into the artifact store, deploys the inference service on the Knative and Kubernetes setup, stamps the category into `fair:category`, and marks the model active. The step-by-step API flow is in [Register a base model](../guides/register-a-base-model.md).

!!! note "Local compose has no Knative"

    The inference-service deployment applies to the production Kubernetes setup. A local `docker compose` stack has no Knative, so that step is skipped.

The contribution diagram is adapted from the [fAIr-models architecture docs](https://hotosm.github.io/fAIr-models/architecture/).

## Training

`POST /trainings/submit/` returns `202` with a row whose `zenml_run_id` is null. A worker submits a ZenML pipeline that runs `split`, `train`, `eval`, and `onnx`, and polls status into the database. The run produces `weights.pt` and `model.onnx` in MinIO.

`POST /trainings/{id}/publish/` is the only step that writes a versioned `local-models/` STAC item. It validates the logged `mlm:hyperparameters` against the base model's `fair:hyperparameters_spec`.

```mermaid
flowchart LR
    A[submit] --> B[worker submits<br/>ZenML pipeline]
    B --> C[split -> train -> eval -> onnx]
    C --> D[weights.pt + model.onnx<br/>in MinIO]
    D --> E[publish -> versioned<br/>local-model STAC item]
```

## Prediction

`POST /predictions/submit/` enqueues inference. A worker downloads chips for the requested bbox, submits an inference pipeline, and a post-run step turns the GeoJSON into `.fgb` and `.pmtiles`. Only then is `results_ready` set, and `GET /predictions/{id}/result/` returns three presigned URLs.

```mermaid
flowchart LR
    A[submit] --> B[worker downloads chips,<br/>runs inference]
    B --> C[post-run:<br/>geojson -> fgb + pmtiles]
    C --> D[results_ready = true]
    D --> E[GET result/<br/>geojson, fgb, pmtiles]
```
