---
icon: lucide/brain-circuit
description: How registration, training, and prediction run across ZenML, STAC, MinIO, and MLflow.
---

# ML pipeline

The backend never trains or runs inference inline. It submits pipelines to ZenML and polls their state. The choice of ZenML as the orchestrator is recorded in the [MLOps decision record](decisions/infra/0001-mlops.md). The services behind the pipeline (STAC, MinIO, MLflow, and ZenML) and their roles are listed in the [Architecture overview](index.md#components).

## Deployment architecture

These services run together on Kubernetes. The fAIr backend submits pipelines
to ZenML and manages ONNX serving through Knative. STAC is the source of truth
for dataset and model metadata, S3 stores artifacts, MLflow tracks experiments,
and Postgres stores service state. How HOT runs this on open source over AWS is
described in [How HOT uses open source on AWS to power humanitarian AI](https://aws.amazon.com/blogs/publicsector/how-hot-uses-open-source-on-aws-to-power-humanitarian-ai/).

![fAIr deployment architecture: developers push to fAIr-models on GitHub, CI/CD builds the model image to the registry and registers base models in the STAC model registry; the fAIr backend submits jobs to ZenML, which orchestrates training on autoscaling GPU nodes and ONNX inference through Knative on CPU nodes, with S3 as the artifact store, MLflow as the experiment tracker, and Postgres for state.](../assets/flyer/aws-architecture.jpg)

```mermaid
flowchart LR
    M[fAIr-models] -->|CI builds images| R[GHCR]
    A[Admin] -->|register pinned item| B[fAIr backend]
    R --> Z
    R --> K
    B --> S[(STAC)]
    B --> O[(S3 artifacts)]
    B --> P[(Postgres)]
    B --> K[Knative serving]
    B --> Z[ZenML]
    Z --> G[Autoscaling GPU jobs]
    Z --> O
    Z --> F[MLflow]
    K --> C[CPU inference]
```

## Contribute and register a model

A model developer contributes through the [fAIr-models catalog](https://hotosm.github.io/fAIr-models/). CI validates the pull request and, after merge, publishes its training and inference images. An admin pins both image references to digests once and registers the same item in staging and production. Registration mirrors the weights into object storage and publishes the item to the environment's `base-models` collection.

```mermaid
flowchart TD
    A[Model developer] -->|Prepares PR| B[fAIr-models GitHub]
    B -->|CI: build, validate, test| C{Review}
    C -->|Merge| D[Publish training + inference images]
    D --> E[Admin pins image digests once]
    E -->|same item| F[Register and test in staging]
    F -->|approve| G[Register in production]
    G --> H[Production STAC + live Knative route]
```

Inside fAIr, registration is admin-only and asynchronous: the backend checks
that the pipeline module is bundled, then hands the STAC item to fair-py-ops.
It mirrors weights into a versioned artifact path, deploys a digest-pinned
inference revision, stamps the category into `fair:category`, publishes the
next integer STAC version, and marks the model active. Staging uses a tagged
Knative route without moving live traffic; production promotes the Ready
revision. The step-by-step API flow is in
[Register a base model](../guides/register-a-base-model.md).

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
