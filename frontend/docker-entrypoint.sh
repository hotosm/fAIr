#!/bin/sh
set -eu

DIST_DIR="/app/dist"
OUT_DIR="/frontend_html"

echo "Generating runtime ${DIST_DIR}/config.js from environment..."
{
  echo "// Generated at container start by docker-entrypoint.sh. Do not edit."
  echo "window.__RUNTIME_CONFIG__ = {"
  for name in $(env | grep -E '^(VITE_|FAIR_VIDEO_)' | cut -d= -f1 | sort); do
    value=$(printenv "$name")
    # Escape values for JavaScript strings.
    escaped=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '  "%s": "%s",\n' "$name" "$escaped"
  done
  echo "};"
} > "${DIST_DIR}/config.js"

echo "Copying SPA from ${DIST_DIR} --> ${OUT_DIR}"
cp -a "${DIST_DIR}/." "${OUT_DIR}/"

echo "Frontend assets ready."
