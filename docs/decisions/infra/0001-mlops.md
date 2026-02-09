# Use ZenML as the primary ML workflow orchestrator

## Context and Problem Statement

We're building a platform to make it easier for ML engineers to train, deploy, and use AI models in a Kubernetes environment.

We're a small NGO with limited operational capacity, running primarily on a single Kubernetes cluster. We already use Argo Workflows in other projects.

The platform needs to support:

- A few model training runs per day (scaling to more over time)
- Programmatic triggering from fAIr API
- Integration with:
  - **pgSTAC** for storing geospatial metadata about final models
  - **S3-compatible storage** for all model artifacts
  - **Seldon or KServe** for optional server-side inference

Primary constraints: **simplicity of deployment, maintenance, and day-to-day use by data/ML engineers**.

## Considered Options

- **Metaflow (on Argo)**
- **Flyte (OSS)**
- **ZenML (OSS)**

## Decision Outcome

We'll use **ZenML** as our primary ML workflow engine.

The stack:

- **ZenML** --> pipeline orchestration, metadata tracking, artifact management, reproducibility
- **Kubernetes orchestrator** --> ZenML's native Kubernetes executor
- **S3-compatible storage** --> artifact store
- **pgSTAC** --> geospatial metadata catalog (via ZenML post-run hooks)
- **Seldon or KServe** --> optional model serving (first-class ZenML integration)

### Why ZenML

**Good fit for a small team**
- Works out-of-the-box on Kubernetes without needing Kubeflow or a heavy control plane.
- Provides a ready-made ML workflow layer so we don’t have to build one ourselves.

**Lower maintenance than DIY**
- Gives us pipeline orchestration, artifact storage, and run metadata in one system.
- Reduces the amount of custom glue code we would otherwise need to maintain.

**Reproducibility by default**
- Tracks code, environments, artifacts, and pipeline versions automatically.
- Builds lineage between inputs, runs, and outputs without manual effort.

**Easy integration with fAIr**
- Can be triggered programmatically via the ZenML Python client, keeping a clean boundary:
  - fAIr = user workflows  
  - ZenML = ML infrastructure

**Works with our stack**
- Native integrations with S3, MLflow, WandB, and model serving tools (Seldon/KServe).
- Runs directly on Kubernetes using ZenML’s built-in executor.

**STAC integration should be simple**
- ZenML will be our source of truth for ML run metadata and artifacts.
- We will publish selected outputs to pgSTAC via a simple post-run hook or final pipeline step.

### Why not the others

**Metaflow:**
- No automatic environment capture (depends on team discipline)
- Reproducibility is manual, not enforced
- We'd be building what ZenML already provides

**Flyte:**
- Heavier control plane (FlyteAdmin, FlyteConsole, separate database)
- More complex to operate than ZenML
- Built for larger scale than we currently need
- Steeper learning curve
- As of writing, the OSS version is in the process of migrating to v2, with no clear deployment strategy

Flyte is excellent but overkill for our current needs.

### When we'd reconsider

We'd move to **Flyte** if:
- We scale to 100+ runs per day
- We need multi-cluster execution across regions
- We add separate teams needing strict isolation
- ZenML's abstractions become limiting
- The ZenML community migrates or the OSS is discontinued

## Architecture

**Training & data processing:**
- Runs as ZenML pipelines
- Executes on Kubernetes (via ZenML's native orchestrator)
- Reads input data from S3/STAC
- Trains models, writes artifacts to S3
- All metadata tracked automatically

**Metadata registration:**
- ZenML tracks all pipeline/artifact metadata internally
- Post-run hook publishes summary to pgSTAC for geospatial discovery
- Optional: track experiments in MLflow/WandB via ZenML integrations

**Inference:**
- Deploy to Seldon/KServe via ZenML model deployer
- Or export to ONNX for client-side execution

## Trade-offs

- ✅ Automatic reproducibility without team discipline required  
- ✅ Minimal custom code to maintain  
- ✅ Built for small teams without platform engineers  
- ✅ First-class integrations with our stack (S3, Seldon, MLflow)  
- ✅ Easy programmatic triggering from fAIr  
- ✅ Full lineage tracking and metadata management built-in  
- ✅ Clean separation: fAIr handles user workflows, ZenML handles ML infrastructure  
- ✅ Can migrate to Flyte later if needed (similar abstractions)  
- ❌ Adds MySQL database to maintain
- ❌ Learning curve for ZenML concepts (stacks, materializers)  
- ❌ Slightly more opinionated than raw Metaflow
- ❌ ZenML's Kubernetes orchestrator is less mature than Argo Workflows
