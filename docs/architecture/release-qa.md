---
icon: lucide/list-checks
description: The checks to run on dev, staging and production before and after each deploy.
---

# Release QA

Run these checks in order, as a signed-in end user, through the UI, the public API and, where the API lacks an endpoint, the Django admin. A check passes when it shows the expected result with no error toast, no console error, no broken layout and no endless spinner. Record each one as pass or fail, with a screenshot or the response status.

## Environments

| Environment | Site | Deploys from |
|---|---|---|
| Dev | <https://dev.ai.hotosm.org> | `develop`, see [Dev environment](dev-environment.md) |
| Staging | <https://stage.ai.hotosm.org> | A `stage` to `main` PR, up only while it is open, see [Infrastructure](infrastructure.md#step-2-staging) |
| Production | <https://ai.hotosm.org> | A GitHub release and chart, see [Releases](../community/contributing.md#releases) |

Each site's `config.js` names its API in `VITE_BASE_API_URL`.

## Before you start

1. `GET /api/` returns the released `app_version`.
2. On dev, an operator confirms the API image date and migrations (`python manage.py showmigrations`), and checks free memory with `free -m`. Run one training or prediction at a time.
3. Sign in with a test account that has no admin rights. Use an admin account only to register a base model and for the Django admin cleanup steps. Run one QA session per account, because the default API limit is 1000 requests per user per hour.

## Automated API run

Run `test.py` before the manual checks: `uv run test.py` on a local stack, `just test e2e` on staging. It registers `sklearn-rgb-segmentation`, builds a dataset, trains, promotes and predicts, and on staging also calls the live Knative service. It stops at the first failure. Dev has no recipe for it, so dev starts at the base model registration. See [Test the whole flow](../guides/run-locally.md#test-the-whole-flow).

## Base model registration

For each base model whose fAIr-models item or image changed in this release, an admin registers it, or re-registers it from the Django admin ([Register a base model](../guides/register-a-base-model.md#register)).

| Check | Expected |
|---|---|
| `GET /base-models/{id}/` | `status` is `active`, `error` is empty |
| `GET /base-models/{id}/?expand=stac` | `fair:category` matches the `category` |
| `GET /health` on the host of the item's `mlm:inference-endpoint` | 200 |

## UI checks

Open each page from the menu, at 1440 px and at 390 px width.

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

Run this for each model in the [model matrix](#model-matrix) that supports training. Steps 1 to 6 use the API, because the UI can't fine-tune yet; Swagger at `/api/docs/` has a request body for each. [Architecture](index.md) shows the same flow as a diagram.

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
- Another user gets 404 on your private dataset and local model, and sees your feedback only when they own the model.
- `GET /feedback/` filters by `stac_id`, `action`, `user` and `in_bbox`.

## Model matrix

| Category | Base model | Try-now | Map an area | Training |
|---|---|---|---|---|
| `trees` | `unet-tree-segmentation` | Yes | Yes | No, prediction only |
| `trees` | `deepforest-tree` | Yes | Yes | Yes |
| `solid-waste` | `yolo_swag_waste_grid_segmentation` | Yes | Yes | Yes |
| `building-damage` | `dinov3-damage` | Yes | Yes, with `post` and `pre` imagery | Not on dev, where the 8 GiB step limit stops it |
| `building-damage` | `nepal-flood-damage` (dev only) | Yes | No, it has no batch runtime | No |
| `buildings` | `dinov3s-buildings` | Yes | Yes | Yes |
| `buildings` | `sklearn-rgb-segmentation`, the test model `test.py` registers | Yes | Yes | Yes |

The standard training run uses `deepforest-tree` in Freetown (around -13.298, 8.494, zoom 20), labels from OSM `natural=tree`, and `model_name` `qa-freetown-trees-test`, which belongs to the QA test account. On dev, run damage models one at a time.

## After the checks

An operator runs `python manage.py check_stac_drift` in the API container and gets no drift.

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

Then run `check_stac_drift` again.
