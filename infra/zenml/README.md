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

## Using zenml-cli

The `fair-cli` image tag should match the ZenML version you are working
with. Set that explicitly in your shell config before creating the alias,
for example:

```sh
export ZENML_VERSION=0.94.1
```

Then create a shell alias in your bashrc or fish config:

```sh
# Default - override in your session if needed,
# or update in your config file
ZENML_VERSION=0.94.1

alias fair-cli='sh -c '"'"'
if [ -z "${ZENML_VERSION:-}" ]; then
  echo "Set ZENML_VERSION to the matching ZenML version, e.g. ZENML_VERSION=0.94.1" >&2
  exit 1
fi

if docker ps --format "{{.Names}}" | grep -qx "fair-cli"; then
  exec docker exec -it fair-cli fish
fi

exec docker run --rm -it --name fair-cli \
  -v "$PWD:$PWD" \
  -v "$HOME/.aws:/root/.aws" \
  -v "$HOME/.kube:/root/.kube" \
  -v "$HOME/.local/share/fish/fish_history:/root/.local/share/fish/fish_history" \
  -v "$HOME/.config/fish/config.fish:/opt/fish/user-config.fish" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --workdir "$PWD" \
  --network host \
  ghcr.io/hotosm/fair/cli:${ZENML_VERSION}
'"'"''
```

Source the file, then run via the alias:

```sh
fair-cli
```
