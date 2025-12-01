#!/bin/sh
set -e

CACHE_FILE="/app/.package-checksum"

# Calculate checksum of package.json and pnpm-lock.yaml
current_checksum=$(cat /app/package.json /app/pnpm-lock.yaml 2>/dev/null | md5sum | cut -d' ' -f1)

# Check if we need to reinstall
if [ -f "$CACHE_FILE" ]; then
  cached_checksum=$(cat "$CACHE_FILE")
  if [ "$current_checksum" != "$cached_checksum" ]; then
    echo "📦 package.json or pnpm-lock.yaml changed, reinstalling dependencies..."
    pnpm install --force
    echo "$current_checksum" > "$CACHE_FILE"
    echo "✅ Dependencies updated"
  fi
else
  # First run, save checksum
  echo "$current_checksum" > "$CACHE_FILE"
fi

exec "$@"
