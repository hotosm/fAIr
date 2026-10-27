#!/usr/bin/env bash
# Fast-forward the checkout to develop, pull the moving ghcr tags, and recreate the stack whenever
# the commit or an image differs from the last successful deploy, so a failed deploy is retried.
set -euo pipefail
cd /opt/fAIr-app

STATE_FILE=/var/lib/fair-autodeploy/deployed
SERVICES="api frontend-assets"
IMAGES="ghcr.io/hotosm/fair/api:develop ghcr.io/hotosm/fair/frontend:develop"

CHECKOUT_OWNER=$(stat -c %U .)
as_owner() { runuser -u "$CHECKOUT_OWNER" -- "$@"; }

as_owner git fetch --quiet origin develop
as_owner git merge --ff-only --quiet origin/develop
docker compose pull --quiet $SERVICES

current="$(as_owner git rev-parse HEAD) $(docker image inspect --format '{{.Id}}' $IMAGES | tr '\n' ' ')"
if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$current" ]; then
  echo "$(date -Is) no change"
  exit 0
fi

echo "$(date -Is) change detected, redeploying"
docker compose up -d
mkdir -p "$(dirname "$STATE_FILE")"
echo "$current" > "$STATE_FILE"
echo "$(date -Is) redeploy complete"
