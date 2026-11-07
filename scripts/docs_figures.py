"""Prints public figures for the docs from public APIs and docs_figures.json;
`--discover` lists candidate MapSwipe projects."""

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
STAC_BASE_MODELS_URL = (
    "https://stac.dev.ai.hotosm.org/collections/base-models/items?limit=100"
)
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


def model_developers(organisation_aliases: dict[str, str]) -> list[str]:
    """Organisations listed as `producer` of a base model in the STAC catalog, one name each."""
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
            organisation_aliases.get(provider["name"], provider["name"])
            for item in items
            if not item["properties"].get("deprecated")
            for provider in item["properties"].get("providers", [])
            if "producer" in provider.get("roles", [])
        }
    )


def report(sources: dict) -> None:
    fair_v2 = sources["fair_v2_figures"]
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
    developers = model_developers(sources["organisation_aliases"])

    print(f"Figures as of {date.today():%d %B %Y}")
    print(f"- Model developers: {len(developers)} ({', '.join(developers)})")
    print(
        f"- Model creators (fAIr v2, {fair_v2['as_of']}): {fair_v2['users_who_published']} users "
        f"published {fair_v2['fine_tuned_models_published']} fine-tuned models; "
        f"{fair_v2['users_who_created']} users created {fair_v2['models_created']} models"
    )
    print(
        f"- Mappers and validators: {fair_v2['feedback_givers']:,} gave "
        f"{fair_v2['feedback_labels']:,} feedback labels in fAIr v2 ({fair_v2['as_of']}); "
        f"{mapswipe_contributors:,} MapSwipe contributors (counted once per "
        f"project) in {len(validation_projects)} validation projects with "
        f"{sum(int(project['number_of_results']) for project in validation_projects):,} results; "
        f"{fair_v2['feedback_givers'] + mapswipe_contributors:,} reviewer engagements (not unique people)"
    )
    print(
        f"- Platform (fAIr v2, {fair_v2['as_of']}): {fair_v2['registered_users']:,} registered "
        f"users, {fair_v2['accepted_predictions']:,} accepted predictions"
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
