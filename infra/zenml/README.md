# ZenML + Postgres

- The OSS version of ZenML uses MySQL or SQLite, while
  the paid version offers Postgres.
- As ZenML uses SQLAlchemy, it seems simple enough to
  enable Postgres support.
- We install `psycopg` and then replace use of MySQL
  dialect e.g. `MEDIUMTEXT`.

## Verify The Changes

```bash
docker compose build zenml
docker compose run zenml
```

## Using Via Helm

- Ensure the `zenml.database.backupStrategy=disabled`.
- The backup process relies on MySQL specific tools.
- Instead we manage Postgres backups in an external
  system, such as CloudNativePG.

## Building Via CI

- It's possible to build using compose, as above.
- It may be easier to use the bundled image build workflow,
  which has the advantage of building multi-arch (+ARM).
- Simply go to Github Actions, trigger the workflow,
  and enter the ZenML version to build.
