<p align="center">
  <img src="https://raw.githubusercontent.com/hotosm/fair/develop/docs/assets/hot_logo.png" alt="HOT logo" width="25%" />
</p>

<h1 align="center">fAIr</h1>

<p align="center">
  <a href="https://github.com/hotosm/fAIr/actions/workflows/test_backend_build.yml"><img src="https://github.com/hotosm/fAIr/actions/workflows/test_backend_build.yml/badge.svg?branch=develop" alt="Backend tests" /></a>
  <a href="https://github.com/hotosm/fAIr/actions/workflows/frontend_build_check.yml"><img src="https://github.com/hotosm/fAIr/actions/workflows/frontend_build_check.yml/badge.svg?branch=develop" alt="Frontend build" /></a>
  <a href="https://github.com/hotosm/fair/releases"><img src="https://img.shields.io/github/v/release/hotosm/fair?logo=github" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/hotosm/fair.svg" alt="License" /></a>
</p>

fAIr connects mappers with geo-AI models they can run and adapt in their own area. It is a shared collection of models: a mapper chooses a model, runs it over an area of interest, validates what it finds, and can fine-tune it on local examples to produce a local model. fAIr is developed by the [Humanitarian OpenStreetMap Team (HOT)](https://www.hotosm.org/) and the people who contribute to it.

fAIr offers its outputs as open data layers on the [Humanitarian Data Exchange](https://data.humdata.org/) and [Hugging Face](https://huggingface.co/hotosm). Bringing AI-generated features into OpenStreetMap is outside fAIr's aim; see [fAIr and OpenStreetMap](https://hotosm.github.io/fAIr/overview/what-is-fair/#fair-and-openstreetmap).

## Documentation

The documentation is at [hotosm.github.io/fAIr](https://hotosm.github.io/fAIr/). Useful starting points:

- [What is fAIr](https://hotosm.github.io/fAIr/overview/what-is-fair/) and [How it works](https://hotosm.github.io/fAIr/overview/how-it-works/)
- [Models](https://hotosm.github.io/fAIr/overview/models/) available today and planned
- [Using fAIr](https://hotosm.github.io/fAIr/guides/using-fair/)
- [Developer setup](https://hotosm.github.io/fAIr/guides/developer-setup/) and [Architecture](https://hotosm.github.io/fAIr/architecture/)
- [Roadmap](https://hotosm.github.io/fAIr/roadmap/)

## Run locally

The full stack needs Docker with Compose 2.23.1 or newer, Git, and at least 8 GB of RAM.

```bash
git clone https://github.com/hotosm/fAIr.git
cd fAIr
cp env_example .env
docker compose up --build
```

The app and API are at http://localhost:8000, with Swagger UI at http://localhost:8000/api/docs/. The local stack signs in with `AUTH_PROVIDER=dev`: authorize API calls with `Bearer dev-token`.

The stack also runs the STAC catalog on port 8082, MinIO on 9000 and 9001, MLflow on 5000, ZenML on 8080, and Postgres on 5434. A fresh stack starts without base models; [Register a base model](https://hotosm.github.io/fAIr/guides/register-a-base-model/) describes how to add one. [Run locally](docs/guides/run-locally.md) covers the services in detail, and [Developer setup](docs/guides/developer-setup.md) covers running the backend on the host.

## Repository layout

`backend/` holds the Django REST API. Its apps cover accounts, datasets, the model registry (base models and local models), trainings, predictions, feedback labels, banners, stars and saved user state. The backend orchestrates ZenML pipelines and the STAC catalog through the `fair-py-ops` package, stores artifacts in MinIO or S3, and runs background jobs with `django_tasks`. See [backend/README.md](backend/README.md).

`frontend/` holds the React single-page app, built with pnpm and Vite. See [frontend/README.md](frontend/README.md).

`docs/` holds the source of the documentation site. `chart/` holds the Helm chart used for production deployments. `docker-compose.yml` defines the full local stack, and `test.py` runs an end-to-end check against a running stack through the public API.

## Contributing models

Base models live in the [fAIr-models](https://github.com/hotosm/fAIr-models) repository. A model that follows its [contribution guide](https://hotosm.github.io/fAIr-models/contributing/model/) can be registered in fAIr as a base model; see [Contributing a model](https://hotosm.github.io/fAIr/overview/models/#contributing-a-model).

## Contributing

Read the [code of conduct](docs/community/code-of-conduct.md) and the [contribution guide](CONTRIBUTING.md). Questions and discussion take place on the [HOT Slack](https://slack.hotosm.org).

## License

fAIr is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE). The terms for the imagery and labels you submit are on [Imagery and label licensing](https://hotosm.github.io/fAIr/overview/data-licensing/).
