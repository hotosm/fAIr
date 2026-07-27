# Infrastructure & Deployment Flow

Our standard deployment process for other apps is
[here](https://docs.hotosm.org/devops/deployment-process)

fAIr differs slightly, because we have:
- Versioning of both software, as well as AI models.
- A dedicated dev instance EC2 for easier development with all components.

Currently model development happens in the `fAIr-models` repo, but this
might eventually move to the `fAIr` monorepo.

## Step 1: Development

> [!NOTE]
> The Environment
> - Single EC2, lightweight k3s cluster.
> - Manually updated / synced with dev.
> - Model registration in STAC etc is all manual.

1. Users work on models in development, versioned as `-dev`
   with a specific SHA tag too.
2. Development model image (deps + code) is pushed to GHCR.
3. On the dev EC2 they run a script to update the **dev** STAC
   and knative records.
4. Any changes to the frontend / API are manually synced to
   the dev EC2 instance.
5. The dev model can be tested on the dev instance, using the
   dev STAC, ZenML, knative services.

## Step 2: Staging

> [!NOTE]
> The Environment
> - Runs all the same components as production, but
>   start up via PR from `staging` --> `main`.
> - The components run inside the `fair-staging`
>   namespace of the Kubernetes cluster, under
>   domain `https://stage.ai.hotosm.org`.
> - Does not run it's own `knative` controller,
>   instead using the cluster-wide instance.

1. A point when we want to *stabilise* and either push out a **new model**
   or **updates to the API / website**, then we have the same staging setup.
2. First a PR must be raised on the fAIr repo from `staging` --> `main`.
   This will set up `https://stage.ai.hotosm.org` with ZenML / STAC /
   Knative registration.
3. A model is merged into the fAIr-models `staging` branch, building
   the `-staging` tagged image.
4. The new `-staging` tag is picked up by ArgoCD, deploying a helm
   chart that simply contains a Job manifest. This job grabs all
   the latest staging model records, and updates the newly started
   **staging** STAC via pgstac database inserts.
5. When we are happy with the staging changes, we merge the PR to
   `main`, which triggered a shut down of the staging env.

## Step 3: Production

> [!NOTE]
> The Environment
> - Runs through tagged releases on Github, where ArgoCD
>   picks up the latest helm chart tag and deploys.

1. A new tagged version is made from the latest `main` code.
2. This triggers a redeploy of the fAIr website / API.
3. We also ensure that `staging` is merged to `main` on the
   **fAIr-models** repo. This ensures the Job runs to sync
   latest versioned models to the **production** STAC.
