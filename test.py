#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx>=0.27"]
# ///
"""End-to-end verification of the fAIr API, by default against the local compose stack.

uv run test.py --api http://localhost:8100 --stac http://localhost:8182

Every option also reads a FAIR_* env var, so `just test e2e` can target staging.
Steps that need a service the target lacks (MLflow, Knative) report as skipped.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Any, Callable

import httpx

AOI_POLYGON = [
    [85.51678, 27.63133],
    [85.52323, 27.63133],
    [85.52323, 27.63743],
    [85.51678, 27.63743],
    [85.51678, 27.63133],
]
IMAGERY = (
    "https://api.imagery.hotosm.org/raster/collections/openaerialmap/items"
    "/62d86c65d8499800053796c4/tiles/WebMercatorQuad/{z}/{x}/{y}?assets=visual"
)
BASE_MODEL_ITEM_URL = (
    "https://raw.githubusercontent.com/hotosm/fAIr-models/refs/heads/develop"
    "/models/sklearn_rgb_segmentation/stac-item.json"
)
WORKER_LOGS = (
    "see `docker compose logs worker`, or on staging"
    " `kubectl -n fair-staging logs deploy/fair-backend -c django-q`"
)


class StepFailed(Exception):
    """A check did not hold. Carries the human-readable reason."""


def require(condition: object, message: str) -> None:
    if not condition:
        raise StepFailed(message)


def poll(
    describe: Callable[[Any], str],
    fetch: Callable[[], Any],
    is_done: Callable[[Any], bool],
    timeout_s: int,
    interval_s: int = 5,
) -> Any:
    """Call `fetch` until `is_done`, or raise once `timeout_s` elapses."""
    deadline = time.monotonic() + timeout_s
    while True:
        value = fetch()
        if is_done(value):
            return value
        if time.monotonic() >= deadline:
            raise StepFailed(f"still {describe(value)} after {timeout_s}s")
        time.sleep(interval_s)


class Fair:
    def __init__(self, args: argparse.Namespace) -> None:
        self.api = f"{args.api.rstrip('/')}/api/v1"
        self.stac = args.stac.rstrip("/")
        self.minio = args.minio.rstrip("/")
        self.mlflow = args.mlflow.rstrip("/")
        self.mlflow_auth = (args.mlflow_user, args.mlflow_password)
        self.knative_tag = args.knative_tag
        self.http = httpx.Client(
            headers={"Authorization": f"Bearer {args.token}"}, timeout=60.0
        )

    def get(self, path: str, **kwargs: Any) -> Any:
        return self._json(self.http.get(f"{self.api}{path}", **kwargs))

    def post(self, path: str, payload: dict) -> Any:
        return self._json(self.http.post(f"{self.api}{path}", json=payload))

    @staticmethod
    def _json(response: httpx.Response) -> Any:
        if response.is_error:
            raise StepFailed(
                f"HTTP {response.status_code} {response.url}: {response.text[:200]}"
            )
        return response.json()


def await_api(fair: Fair, ctx: dict) -> str:
    """The api container accepts connections only once Django finishes booting."""

    def probe() -> int | None:
        try:
            return fair.http.get(f"{fair.api}/health/").status_code
        except httpx.TransportError:
            return None

    poll(
        describe=lambda code: "unreachable" if code is None else f"HTTP {code}",
        fetch=probe,
        is_done=lambda code: code is not None,
        timeout_s=300,
        interval_s=3,
    )
    return f"{fair.api} accepting connections"


def check_health(fair: Fair, ctx: dict) -> str:
    health = fair.get("/health/")
    down = [
        name
        for name in ("postgresql", "s3", "stac_api", "zenml")
        if not health.get(name)
    ]
    require(not down, f"dependencies unreachable: {down}")
    missing = [name for name, ok in health["stac_collections"].items() if not ok]
    require(not missing, f"STAC collections missing: {missing}")
    return "postgres, s3, stac, zenml and all 3 collections up"


def register_base_model(fair: Fair, ctx: dict) -> str:
    """Register a base model through the API (mirror weights, deploy the predict
    service, publish the STAC item). Requires admin; the dev-token user is staff."""
    model = fair.post(
        "/base-models/",
        {"stac_item_url": BASE_MODEL_ITEM_URL, "category": "buildings"},
    )
    ctx["base_model_id"] = model["id"]
    return f"id={model['id']} name={model['name']} status={model['status']}"


def await_base_model(fair: Fair, ctx: dict) -> str:
    model = poll(
        describe=lambda m: m["status"],
        fetch=lambda: fair.get(f"/base-models/{ctx['base_model_id']}/"),
        is_done=lambda m: m["status"] in {"active", "failed"},
        timeout_s=900,
        interval_s=10,
    )
    require(
        model["status"] == "active",
        f"registration ended as {model['status']}: {model.get('error') or WORKER_LOGS}",
    )
    ctx["base_model_stac_id"] = model["stac_item_id"]
    return f"status=active stac_item_id={model['stac_item_id']}"


def check_auth(fair: Fair, ctx: dict) -> str:
    user = fair.get("/auth/me/")
    require(user.get("osm_id"), f"no osm_id in {user}")
    return f"osm_id={user['osm_id']} username={user['username']}"


def create_aoi(fair: Fair, ctx: dict) -> str:
    aoi = fair.post(
        "/aois/",
        {
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [AOI_POLYGON]},
            "properties": {"dataset": None},
        },
    )
    ctx["aoi_id"] = aoi["properties"]["id"]
    return f"aoi id={ctx['aoi_id']}"


def build_dataset(fair: Fair, ctx: dict) -> str:
    dataset = fair.post(
        "/datasets/build/",
        {
            "title": f"e2e-banepa-{int(time.time())}",
            "description": "end-to-end verification",
            "source_imagery": IMAGERY,
            "category": "buildings",
            "zoom": 19,
            "aoi_ids": [ctx["aoi_id"]],
            "label_tasks": ["semantic-segmentation"],
            "label_classes": [{"name": "building", "classes": ["*"]}],
            "keywords": ["building", "polygon"],
            "label_type": "vector",
            "geometry_type": "polygon",
        },
    )
    ctx["dataset_id"] = dataset["id"]
    ctx["dataset_stac_id"] = dataset["stac_id"]
    return f"id={dataset['id']} stac_id={dataset['stac_id']} status={dataset['status']}"


def await_dataset(fair: Fair, ctx: dict) -> str:
    dataset = poll(
        describe=lambda d: d["status"],
        fetch=lambda: fair.get(f"/datasets/{ctx['dataset_id']}/"),
        is_done=lambda d: d["status"] in {"built", "failed"},
        timeout_s=600,
    )
    require(
        dataset["status"] == "built",
        f"dataset build failed, {WORKER_LOGS}",
    )
    return "status=built, chips and labels uploaded"


def submit_training(fair: Fair, ctx: dict) -> str:
    ctx["model_name"] = f"e2e-unet-{int(time.time())}"
    run = fair.post(
        "/trainings/submit/",
        {
            "base_model_stac_id": ctx["base_model_stac_id"],
            "dataset_stac_id": ctx["dataset_stac_id"],
            "model_name": ctx["model_name"],
        },
    )
    ctx["training_id"] = run["id"]
    return f"id={run['id']} status={run['status']}"


def await_training(fair: Fair, ctx: dict) -> str:
    run = poll(
        describe=lambda r: r["status"],
        fetch=lambda: fair.get(f"/trainings/{ctx['training_id']}/"),
        is_done=lambda r: (
            r["status"] in {"completed", "failed", "stopped", "cached", "retried"}
        ),
        timeout_s=1800,
        interval_s=15,
    )
    require(
        run["status"] == "completed",
        f"training ended as {run['status']}, {WORKER_LOGS}",
    )
    ctx["zenml_run_id"] = run["zenml_run_id"]
    return f"status=completed zenml_run_id={run['zenml_run_id']}"


def check_mlflow_run(fair: Fair, ctx: dict) -> str:
    """fair-py-ops names the MLflow experiment after the model."""
    if not fair.mlflow:
        return "skipped, no --mlflow URL"
    auth = fair.mlflow_auth if fair.mlflow_auth[0] else None
    with httpx.Client(base_url=f"{fair.mlflow}/api/2.0/mlflow", auth=auth) as mlflow:
        experiment = Fair._json(
            mlflow.get(
                "/experiments/get-by-name",
                params={"experiment_name": ctx["model_name"]},
            )
        )["experiment"]
        runs = Fair._json(
            mlflow.post(
                "/runs/search",
                json={"experiment_ids": [experiment["experiment_id"]]},
            )
        ).get("runs", [])
    finished = [run for run in runs if run["info"]["status"] == "FINISHED"]
    require(finished, f"no FINISHED run in experiment {ctx['model_name']}")
    metrics = sorted(m["key"] for m in finished[0]["data"].get("metrics", []))
    require(metrics, "finished MLflow run recorded no metrics")
    return f"{len(finished)} finished run(s), metrics: {', '.join(metrics)}"


def check_run_endpoints(fair: Fair, ctx: dict) -> str:
    run_id = ctx["zenml_run_id"]
    status = fair.get(f"/trainings/runs/{run_id}/status/")
    require(status["status"] == "completed", f"run status endpoint says {status}")
    require(status["is_terminal"], "completed run not reported terminal")
    logs = fair.get(f"/trainings/runs/{run_id}/logs/")
    require(logs, "no log entries returned")
    return f"status endpoint terminal, {len(logs)} log entries streamed"


def promote(fair: Fair, ctx: dict) -> str:
    published = fair.post(
        f"/trainings/{ctx['training_id']}/publish/",
        {"description": "end-to-end verification", "title": "e2e promoted model"},
    )
    ctx["local_model_stac_id"] = published["local_model_stac_id"]
    return f"local_model_stac_id={ctx['local_model_stac_id']}"


def check_promoted_item(fair: Fair, ctx: dict) -> str:
    item_id = ctx["local_model_stac_id"]
    response = fair.http.get(f"{fair.stac}/collections/local-models/items/{item_id}")
    item = Fair._json(response)
    assets = item["assets"]
    for key in ("model", "checkpoint"):
        require(key in assets, f"promoted item missing '{key}' asset: {sorted(assets)}")
    metrics = "with training-metrics" if "training-metrics" in assets else "no training-metrics"
    hyperparameters = item["properties"].get("mlm:hyperparameters") or {}
    require(hyperparameters, "no mlm:hyperparameters recorded on the promoted item")
    return f"v{item['properties']['version']}, {len(assets)} assets ({metrics}), {len(hyperparameters)} hyperparameters"


def submit_prediction(fair: Fair, ctx: dict) -> str:
    prediction = fair.post(
        "/predictions/submit/",
        {
            "model_stac_id": ctx["local_model_stac_id"],
            "image_uri": IMAGERY,
            "bbox": [85.51678, 27.63133, 85.52323, 27.63743],
            "zoom": 19,
            "params": {"confidence_threshold": 0.25},
        },
    )
    ctx["prediction_id"] = prediction["id"]
    return f"id={prediction['id']} status={prediction['status']}"


def await_prediction(fair: Fair, ctx: dict) -> str:
    prediction = poll(
        describe=lambda p: f"{p['status']}/results_ready={p['results_ready']}",
        fetch=lambda: fair.get(f"/predictions/{ctx['prediction_id']}/"),
        is_done=lambda p: p["results_ready"] or p["status"] in {"failed", "stopped"},
        timeout_s=1200,
        interval_s=10,
    )
    require(prediction["results_ready"], f"prediction ended as {prediction['status']}")
    return "status=completed results_ready=true"


def check_prediction_results(fair: Fair, ctx: dict) -> str:
    results = fair.get(f"/predictions/{ctx['prediction_id']}/result/")
    for key in ("geojson", "fgb", "pmtiles"):
        require(key in results, f"missing '{key}' in {sorted(results)}")

    # Locally, presigned URLs are signed for the in-network `minio` host. The fair-data
    # bucket allows anonymous download, so read the object directly instead.
    # Elsewhere the presigned URLs are public, and sending our token breaks the signature.
    if fair.minio:
        path = results["geojson"].split("?", 1)[0].split("/", 3)[3]
        geojson = Fair._json(fair.http.get(f"{fair.minio}/{path}"))
    else:
        geojson = Fair._json(httpx.get(results["geojson"], timeout=60.0))
    features = geojson.get("features", [])
    require(features, "prediction geojson has no features")
    require(
        geojson["features"][0]["geometry"]["type"] == "Polygon",
        f"unexpected geometry {geojson['features'][0]['geometry']['type']}",
    )
    return f"3 output formats, {len(features)} polygons in the geojson"


def predict_live(fair: Fair, ctx: dict) -> str:
    """Call the base model's Knative service directly, twice, to time a cold
    then a warm start. Runs only with --knative-tag, as local stacks have no Knative."""
    if not fair.knative_tag:
        return "skipped, no --knative-tag"
    local_item = Fair._json(
        fair.http.get(
            f"{fair.stac}/collections/local-models/items/{ctx['local_model_stac_id']}"
        )
    )
    base_model_id = local_item["properties"]["fair:base_model_id"]
    base_item = Fair._json(
        fair.http.get(f"{fair.stac}/collections/base-models/items/{base_model_id}")
    )
    endpoint = base_item["assets"].get("mlm:inference-endpoint", {}).get("href")
    # Production shares these Knative services, so never call its live route by mistake.
    require(
        endpoint and httpx.URL(endpoint).host.startswith(f"{fair.knative_tag}-"),
        f"inference endpoint {endpoint} is not under the '{fair.knative_tag}' tag",
    )

    hyperparameters = local_item["properties"].get("mlm:hyperparameters") or {}
    request = {
        "model_uri": local_item["assets"]["model"]["href"],
        "image_uri": IMAGERY,
        "bbox": [85.5185, 27.6325, 85.5205, 27.6345],
        "zoom": 19,
        "params": {
            key.removeprefix("inference."): value
            for key, value in hyperparameters.items()
            if key.startswith("inference.")
        },
    }
    timings = []
    for _ in ("cold", "warm"):
        started = time.monotonic()
        geojson = Fair._json(httpx.post(endpoint, json=request, timeout=600.0))
        timings.append(time.monotonic() - started)
        require(geojson.get("features"), f"{endpoint} returned no features")
    cold, warm = timings
    return f"{len(geojson['features'])} features from {endpoint}, {cold:.0f}s then {warm:.0f}s"


def check_list_endpoints(fair: Fair, ctx: dict) -> str:
    counts = []
    for name in ("datasets", "local-models", "trainings", "predictions"):
        payload = fair.get(f"/{name}/")
        counts.append(f"{name}={payload.get('count', '?')}")
    return ", ".join(counts)


STEPS: list[tuple[str, Callable[[Fair, dict], str]]] = [
    ("wait for API", await_api),
    ("health", check_health),
    ("authentication", check_auth),
    ("register base model", register_base_model),
    ("await registration", await_base_model),
    ("create AOI", create_aoi),
    ("build dataset", build_dataset),
    ("await dataset build", await_dataset),
    ("submit training", submit_training),
    ("await training", await_training),
    ("MLflow run", check_mlflow_run),
    ("run status and logs", check_run_endpoints),
    ("promote to local model", promote),
    ("promoted STAC item", check_promoted_item),
    ("submit prediction", submit_prediction),
    ("await prediction", await_prediction),
    ("prediction results", check_prediction_results),
    ("live Knative prediction", predict_live),
    ("list endpoints", check_list_endpoints),
]


def main() -> int:
    env = os.environ.get
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--api", default=env("FAIR_API", "http://localhost:8000"))
    parser.add_argument("--stac", default=env("FAIR_STAC", "http://localhost:8082"))
    parser.add_argument(
        "--minio",
        default=env("FAIR_MINIO", "http://localhost:9000"),
        help="read results anonymously from this MinIO; empty uses the presigned URLs",
    )
    parser.add_argument("--token", default=env("FAIR_TOKEN", "dev-token"))
    parser.add_argument(
        "--mlflow",
        default=env("FAIR_MLFLOW", "http://localhost:5000"),
        help="empty skips the MLflow check",
    )
    parser.add_argument("--mlflow-user", default=env("FAIR_MLFLOW_USER", ""))
    parser.add_argument("--mlflow-password", default=env("FAIR_MLFLOW_PASSWORD", ""))
    parser.add_argument(
        "--knative-tag",
        default=env("FAIR_KNATIVE_TAG", ""),
        help="require the live endpoint to be under this Knative tag",
    )
    args = parser.parse_args()

    fair = Fair(args)
    ctx: dict = {}
    started = time.monotonic()

    for number, (name, run_step) in enumerate(STEPS, start=1):
        label = f"[{number:2}/{len(STEPS)}] {name}"
        print(f"{label} ...", flush=True)
        step_started = time.monotonic()
        try:
            detail = run_step(fair, ctx)
        except (StepFailed, httpx.TransportError) as failure:
            print(
                f"{label} FAILED after {time.monotonic() - step_started:.0f}s\n    {failure}"
            )
            return 1
        print(
            f"{label} ok ({time.monotonic() - step_started:.0f}s)\n    {detail}",
            flush=True,
        )

    print(f"\nall {len(STEPS)} steps passed in {time.monotonic() - started:.0f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
