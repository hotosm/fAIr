---
icon: lucide/list-checks
description: The checks to run on dev, staging and production before and after each deploy.
---

# Release QA

The checks run in order, as a signed-in user, through the UI, the public API and, where the API lacks an endpoint, the Django admin. A check passes when it shows the expected result, the browser console stays free of errors, the layout holds and loading finishes. Each check is recorded as pass or fail, with a screenshot or the response status.

## Environments

| Environment | Site | Deploys from |
|---|---|---|
| Dev | <https://dev.ai.hotosm.org> | `develop`, see [Dev environment](dev-environment.md) |
| Staging | <https://stage.ai.hotosm.org> | A `stage` to `main` PR, up only while it is open, see [Infrastructure](infrastructure.md#step-2-staging) |
| Production | <https://ai.hotosm.org> | A GitHub release and chart, see [Releases](../community/contributing.md#releases) |

Each site's `config.js` names its API in `VITE_BASE_API_URL`.

## Before you start

1. `GET /api/` returns the released `app_version`.
2. On dev, an operator confirms the API image date and migrations (`python manage.py showmigrations`), and checks free memory with `free -m`. Trainings and predictions run one at a time.
3. A test account without admin rights runs the checks. An admin account registers base models and runs the Django admin cleanup. Each account runs one QA session at a time, because the default API limit is 1000 requests per user per hour.

## Automated API run

`test.py` runs before the manual checks: `uv run test.py` on a local stack, `just test e2e` on staging. It registers `sklearn-rgb-segmentation`, builds a dataset, trains, promotes and predicts, and on staging also calls the live Knative service. It stops at the first failure. Dev lacks a recipe for it, so dev QA starts at the base model registration. See [Test the whole flow](../guides/run-locally.md#test-the-whole-flow).

## Base model registration

For each base model whose fAIr-models item or image changed in this release, an admin registers it, or re-registers it from the Django admin ([Register a base model](../guides/register-a-base-model.md#register)).

| Check | Expected |
|---|---|
| `GET /base-models/{id}/` | `status` is `active`, `error` is empty |
| `GET /base-models/{id}/?expand=stac` | `fair:category` matches the `category` |
| `GET /health` on the host of the item's `mlm:inference-endpoint` | 200 |

When a release changes a base model's prediction outputs, an operator re-registers the base model first, then runs `python manage.py sync_local_model_outputs --base-model <mlm:name> --dry-run`, then again without `--dry-run`. The local models fine-tuned from it take the base model's current outputs and runtime images. Then run Map an area with one of them to confirm.

## UI checks

Each page is opened from the menu, at 1440 px and at 390 px width.

| Page | Check |
|---|---|
| Home, Learn, About | Pages load, the home figures and any active banner show, menu and footer links open |
| Sign in and out | Hanko sign-in returns to the page, a reload keeps the session, sign-out hides private pages |
| Start Mapping, Basic mode | Each sample model runs on its sample area and draws results |
| Start Mapping, Advanced mode | Each base model and each own local model runs. The hover card lists the STAC fields. Saved projects reopen. |
| Feedback | Clicking a feature opens one popup. Thumbs up turns green and thumbs down turns red, Results counts follow, marks return after leaving and coming back, tapping the active thumb removes the mark. |
| Map an area | Upload a GeoJSON and draw an area. The request appears under Map Requests and moves to ready. |
| Map request result | Legend (hidden at phone width), hover card and download work |
| Profile | The overview shows recent activity, mapping history and map requests. AI Models and Datasets show "Coming soon". Settings save. |
| Hidden pages | `/ai-models`, `/datasets`, `/ai-predictions`, `/resources` and their sub-pages open the 404 page |

## End-to-end flow

The flow runs for each model in the [model matrix](#model-matrix) that supports training. Steps 1 to 6 use the API, because the UI can't fine-tune yet; Swagger at `/api/docs/` has a request body for each. [Architecture](index.md) shows the same flow as a diagram.

| Step | Action | Expected |
|---|---|---|
| 1 API | `POST /aois/` | 201 |
| 2 API | `POST /datasets/build/` with `imagery` keyed by the model's input names, then poll `GET /datasets/{id}/` | `built` |
| 3 API | `POST /datasets/{id}/publish/` | Dataset public |
| 4 API | `POST /trainings/submit/` with `base_model_stac_id`, `dataset_stac_id` and `model_name`, then poll | `completed` |
| 5 API | `POST /trainings/{id}/publish/`, then find the id with `GET /local-models/?search=<model_name>&published=all` | Local model with a STAC item that carries the base model's `fair:category` and output geometry keyword |
| 6 API | `POST /local-models/{id}/publish/` | Local model public |
| 7 UI | Start Mapping, Advanced, model picker | The local model is listed |
| 8 UI | Run the local model | Results draw, hover card shows |
| 9 UI | Thumbs up and down on a result | Marks save and colour, see [UI checks](#ui-checks) |
| 10 UI | Map an area with the local model | The request reaches ready and its result page opens |
| 11 API | `GET /predictions/{id}/`, then `GET /predictions/{id}/result/` | `results_ready` true, the `geojson`, `fgb` and `pmtiles` URLs download |

### Permission checks

- Signed-out calls to private endpoints return 401.
- Another user gets 404 on a private dataset and local model they don't own, and sees feedback on a model only when they own it.
- `GET /feedback/` filters by `stac_id`, `action`, `user` and `in_bbox`.

## Model matrix

| Category | Base model | Try-now | Map an area | Training |
|---|---|---|---|---|
| `trees` | `unet-tree-segmentation` | Yes | Yes | No, prediction only |
| `trees` | `deepforest-tree` | Yes | Yes | Yes |
| `solid-waste` | `yolo_swag_waste_grid_segmentation` | Yes | Yes | Yes |
| `building-damage` | `dinov3-damage` | Yes | Yes, with `post` and `pre` imagery | Not on dev, where the 8 GiB step limit stops it |
| `building-damage` | `nepal-flood-damage` (dev only) | Yes | No, it lacks a batch runtime | No |
| `buildings` | `dinov3s-buildings` | Yes | Yes | Yes |
| `buildings` | `sklearn-rgb-segmentation`, the test model `test.py` registers | Yes | Yes | Yes |

The standard training run uses `deepforest-tree` in Freetown (around -13.298, 8.494, zoom 20), labels from OSM `natural=tree`, and `model_name` `qa-freetown-trees-test`, which belongs to the QA test account.

## After the checks

An operator runs `python manage.py check_stac_drift` in the API container, which reports that the database and STAC agree.

Dev keeps its test items, so `qa-freetown-trees-test` gains a version per run. On staging and production, clean up in this order:

| Order | Item | How |
|---|---|---|
| 1 | Feedback | Tap the active thumb, or `DELETE /feedback/{id}/` |
| 2 | Saved project | `DELETE /user-state/{pid}/` |
| 3 | Prediction | Django admin delete, which also removes its files, or `POST /predictions/{id}/unpublish/` |
| 4 | Training run | Django admin delete. A dataset with training runs can't be deleted. |
| 5 | Dataset | `DELETE /datasets/{id}/`, which also deletes its AOIs |
| 6 | AOI without a dataset | `DELETE /aois/{id}/` |
| 7 | Local model | `POST /local-models/{id}/unpublish/`. Local models can't be deleted, because that would orphan their STAC versions. |

`check_stac_drift` then runs again.
