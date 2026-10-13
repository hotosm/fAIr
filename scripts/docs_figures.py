"""Prints public figures for the docs (model developers and creators, mappers and validators,
activations, downloads) from public APIs and docs_figures.json; `--discover` lists candidates."""

import argparse
import json
import re
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = Path(__file__).with_suffix(".json")
ACTIVATIONS_PAGE = ROOT / "docs" / "progress" / "activations.md"
MAPSWIPE_PROJECTS_URL = (
    "https://backend.mapswipe.org/media/global/asset/projects_centroid.geojson"
)
HUGGINGFACE_DATASET_URL = (
    "https://huggingface.co/api/datasets/{repo}?expand[]=downloadsAllTime"
)
HDX_PACKAGE_URL = "https://data.humdata.org/api/3/action/package_show?id={name}"
FAIR_API = "https://api-prod.fair.hotosm.org/api/v1"
STAC_BASE_MODELS_URL = (
    "https://stac.dev.ai.hotosm.org/collections/base-models/items?limit=100"
)
PUBLISHED_MODEL_STATUS = 0
FAIR_WORD = re.compile(r"\bfair\b", re.IGNORECASE)
NOT_A_PROJECT = re.compile(r"\btest\b|tutorial", re.IGNORECASE)
VALIDATE_FOOTPRINTS_PROJECT_TYPE = "2"


def fetch_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": "fAIr-docs-figures"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.load(response)


def count_activations() -> int:
    return sum(
        line.startswith("## ") for line in ACTIVATIONS_PAGE.read_text().splitlines()
    )


def mapswipe_projects() -> dict[str, dict]:
    features = fetch_json(MAPSWIPE_PROJECTS_URL)["features"]
    return {
        feature["properties"]["firebase_id"]: feature["properties"]
        for feature in features
    }


def is_fair_validation(project: dict) -> bool:
    text = " ".join(
        str(project.get(field) or "") for field in ("name", "description", "look_for")
    )
    return (
        bool(FAIR_WORD.search(text))
        and not NOT_A_PROJECT.search(project["name"])
        and project["project_type"] == VALIDATE_FOOTPRINTS_PROJECT_TYPE
        and int(project["number_of_results"]) > 0
    )


def fetch_all(url: str, extract_items=lambda page: page["results"]) -> list:
    """Every item of a paginated fAIr API list."""
    items: list = []
    while url:
        page = fetch_json(url)
        items += extract_items(page)
        url = page["next"]
    return items


def model_developers() -> list[str]:
    """Organisations listed as `producer` of a base model in the STAC catalog."""
    items: list = []
    url = STAC_BASE_MODELS_URL
    while url:
        page = fetch_json(url)
        items += page["features"]
        url = next(
            (link["href"] for link in page.get("links", []) if link["rel"] == "next"),
            None,
        )
    return sorted(
        {
            provider["name"]
            for item in items
            if not item["properties"].get("deprecated")
            for provider in item["properties"].get("providers", [])
            if "producer" in provider.get("roles", [])
        }
    )


def report(sources: dict) -> None:
    kpis = fetch_json(f"{FAIR_API}/kpi/stats/")
    models = fetch_all(f"{FAIR_API}/model/?limit=500")
    published = [model for model in models if model["status"] == PUBLISHED_MODEL_STATUS]
    if len(published) != kpis["total_models_published"]:
        raise RuntimeError(
            f"{len(published)} models have the published status, but the API reports "
            f"{kpis['total_models_published']} published models"
        )
    feedback = fetch_all(
        f"{FAIR_API}/feedback/?limit=500", lambda page: page["results"]["features"]
    )
    feedback_givers = {label["properties"]["user"] for label in feedback}
    projects = mapswipe_projects()
    validation_projects = [
        projects[project_id] for project_id in sources["mapswipe_validation_projects"]
    ]
    mapswipe_contributors = sum(
        int(project["number_of_contributor_users"]) for project in validation_projects
    )
    huggingface_downloads = {
        repo: fetch_json(HUGGINGFACE_DATASET_URL.format(repo=repo))["downloadsAllTime"]
        for repo in sources["huggingface_training_datasets"]
    }
    hdx_downloads = {
        name: fetch_json(HDX_PACKAGE_URL.format(name=name))["result"][
            "total_res_downloads"
        ]
        for name in sources["hdx_datasets"]
    }
    developers = model_developers()

    print(f"Figures as of {date.today():%d %B %Y}")
    print(f"- Model developers: {len(developers)} ({', '.join(developers)})")
    print(
        f"- Model creators: {len({model['user']['osm_id'] for model in published})} users published "
        f"{len(published)} fine-tuned models; "
        f"{len({model['user']['osm_id'] for model in models})} users created {len(models)} models"
    )
    print(
        f"- Mappers and validators: {len(feedback_givers):,} gave {len(feedback):,} feedback "
        f"labels in fAIr; {mapswipe_contributors:,} MapSwipe contributors (counted once per "
        f"project) in {len(validation_projects)} validation projects with "
        f"{sum(int(project['number_of_results']) for project in validation_projects):,} results; "
        f"{len(feedback_givers) + mapswipe_contributors:,} reviewer engagements (not unique people)"
    )
    print(
        f"- Platform: {kpis['total_registered_users']:,} registered users, "
        f"{kpis['total_accepted_predictions']:,} accepted predictions"
    )
    print(f"- Activations supported: {count_activations()}")
    print(
        f"- Hugging Face training dataset downloads (all time): {sum(huggingface_downloads.values()):,}"
    )
    print(
        f"- HDX downloads of datasets with fAIr outputs: {sum(hdx_downloads.values()):,}"
    )
    print("\nBreakdown")
    for name, downloads in [*huggingface_downloads.items(), *hdx_downloads.items()]:
        print(f"  {downloads:>8,}  {name}")


def discover(sources: dict) -> None:
    listed = set(sources["mapswipe_validation_projects"])
    for project_id, project in sorted(mapswipe_projects().items()):
        if project_id not in listed and is_fair_validation(project):
            print(
                f"{project_id}  {project['number_of_contributor_users']:>5}  {project['name']}"
            )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--discover",
        action="store_true",
        help="list unlisted MapSwipe projects that mention fAIr",
    )
    args = parser.parse_args()
    sources = json.loads(SOURCES.read_text())
    (discover if args.discover else report)(sources)


if __name__ == "__main__":
    main()
