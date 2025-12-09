#!/bin/sh

set -e

# Copy frontend to attached volume
echo "Syncing files from /app --> /frontend_html"
rclone sync /app /frontend_html
echo "Updating directory permissions 101:101 (nginx)."
chown -R 101:101 /frontend_html
echo "Sync done."

# Successful exit (stop container)
exit 0
