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
