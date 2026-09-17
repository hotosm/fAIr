<!-- markdownlint-disable MD013 MD025 -->

# AGENTS.md

Guidance for AI coding agents in **fAIr**.
Human maintainers are accountable for all merged changes.

---

## Project

fAIr is HOT's AI-assisted mapping service. Users draw an AOI, build a training
dataset from OAM imagery plus OSM labels, train a model, promote it, and run
predictions that come back as mapping-ready vectors.

The backend is a **thin coordinator**: it persists ownership and lifecycle in
Postgres, validates input, and delegates the heavy work to async workers
(`django-tasks`) and a ZenML server.

**Stack:** Python 3.12+ / Django 6 + Django REST Framework / PostgreSQL +
PostGIS / django-tasks workers / ZenML / S3-compatible object storage /
STAC / React + Vite / uv / Ruff / pre-commit

---

## Required Reading Order

1. `backend/ARCHITECTURE.md` - the end-to-end flow, the database schema, and
   the **key invariants**. Read this before changing any backend behaviour.
2. `docs/decisions/` - architectural decision records.
3. `CONTRIBUTING.md` - contribution rules, including AI tool usage.
4. The app you are touching (`datasets/`, `trainings/`, `predictions/`,
   `modelregistry/`).

---

## Structure

```text
backend/                  # Django project
backend/config/           # settings, urls, ASGI/WSGI
backend/datasets/         # AOIs and dataset building
backend/trainings/        # training submission and run tracking
backend/predictions/      # inference submission and post-processing
backend/modelregistry/    # base models and promoted local models
backend/accounts/         # auth (hotosm-auth)
backend/shared/           # shared helpers
backend/tests/            # backend tests
frontend/src/             # React + Vite SPA
chart/                    # Helm chart
docs/                     # Documentation site (Zensical) and decision records
infra/                    # infrastructure config
```

---

## Commands

Backend, from `backend/` (recipes live in `backend/justfile`):

```bash
just setup      # uv sync + install pre-commit hooks
just run        # dev server on 0.0.0.0:8000
just migrate    # apply migrations
just worker     # run the django-tasks worker (needed for any async flow)
just test       # uv run pytest
just lint       # pre-commit run --all-files (ruff, ty, uv-lock, commitizen)
```

Frontend, from `frontend/`:

```bash
pnpm dev            # vite dev server
pnpm build          # tsc -b && vite build
pnpm test           # vitest
pnpm lint           # eslint .
pnpm format         # prettier --write
```

Chart: `just chart <args>` from the repo root.

---

## Decisions Already Made

These are invariants, not preferences. Do not "simplify" them away - see
`backend/ARCHITECTURE.md` for the full statement of each.

- **Datasets, base models and local models are STAC items.** The Postgres
  tables are thin pointers holding ownership and lifecycle state. Per-version
  metadata lives only in STAC. Do not migrate STAC fields into Django models.
- **Training and prediction are asynchronous.** `POST /…/submit/` returns 202
  with a row whose `zenml_run_id` is null until a worker submits the pipeline.
  Nothing in a request handler may wait on a pipeline.
- **`results_ready` is separate from `status=completed`.** Post-processing
  (`.fgb` and `.pmtiles` via tippecanoe) happens after ZenML reports
  completion; `/predictions/{id}/result/` returns 409 until then.
- **Publish is the only step that writes a versioned local-model STAC item**,
  and it validates logged `mlm:hyperparameters` against the base model's
  `fair:hyperparameters_spec`.
- **The backend does not train models.** Training and inference run in ZenML
  pipelines on the ML pool, not in the Django process.

If you believe an invariant needs to change, say so and stop - do not
implement around it.

---

## Where AI Help Is Welcome

- Test scaffolding and fixtures
- Serializers, filters, and DRF boilerplate
- Frontend components and styling
- Documentation and docstrings
- Tightly scoped refactors covered by existing tests

## Where AI Must Not Act Unsupervised

- Authentication and permissions (`backend/accounts/`, `hotosm-auth` usage)
- Database migrations
- Object storage access and presigned URL generation
- ZenML pipeline submission and status handling
- `chart/` values and templates that affect deployed environments
- CI workflows and release steps

---

## Coding Standards

- Type hints on public functions; Ruff-clean; `ty` type checks must pass.
- Use the DRF layer as it exists - no raw SQL where an ORM query works, and no
  new query patterns that bypass permissions.
- Async work belongs in `tasks.py` under the relevant app, never inline in a
  view.
- Geospatial correctness matters: be explicit about CRS and do not assume
  polygons are well-behaved.
- TypeScript: no `any` to silence the compiler.

---

## Testing Standards

- New behaviour needs a `pytest` test under `backend/tests/`.
- Async flows are tested by asserting the queued task and its state
  transitions, not by sleeping.
- Never weaken or skip a failing test to make a change pass.

---

## Anti-Patterns

- Editing `frontend/dist/` or other build output
- Adding a dependency without updating `uv.lock` (`uv-lock-check` will fail)
- Blocking calls inside request handlers
- Committing secrets or real credentials; use `env_example` as the reference
- Broad reformat-the-world diffs mixed into a behavioural change

---

## Workflow

1. Read `backend/ARCHITECTURE.md` and the relevant app before changing code.
2. Keep the diff scoped to the task; raise anything else separately.
3. Run `just test` and `just lint` from `backend/` (plus `pnpm test` for
   frontend changes).
4. Report what you changed, what you ran, and what you did not verify.

When uncertain, ask instead of assuming.

---

## Responsible AI Contribution Policy

- Org guidance for AI-assisted contributions: <https://responsibleai.guide>
- Declare the AI assistance level (0-5) in the PR template honestly. Never
  lower the declared level to get a PR reviewed.
- If nobody has read the result, that is level 5: open the PR as a draft.
- Do not work on issues labelled `good first issue` - they exist for humans.
- A human is accountable for every merged change.
