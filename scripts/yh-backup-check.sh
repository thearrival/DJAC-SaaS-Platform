#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/yh-backup-check.log"
BACKUP_VOLUME_NAME="${BACKUP_VOLUME_NAME:-djac_db_backups}"
BACKUP_DIR="${BACKUP_DIR:-/var/lib/docker/volumes/${BACKUP_VOLUME_NAME}/_data}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-36}"

mkdir -p "$(dirname "$LOG_FILE")"

if [ ! -d "$BACKUP_DIR" ] && command -v docker >/dev/null 2>&1; then
  detected_dir="$(docker inspect djac-db-backup --format '{{range .Mounts}}{{if eq .Destination "/backup"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || true)"
  if [ -n "$detected_dir" ]; then
    BACKUP_DIR="$detected_dir"
  fi
fi

now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
status="ok"
details=""

if [ ! -d "$BACKUP_DIR" ]; then
  status="failed"
  details="backup_dir_missing path=$BACKUP_DIR"
else
  latest_file="$(find "$BACKUP_DIR" -type f \( -name '*.sql' -o -name '*.sql.gz' -o -name '*.gz' \) -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2- || true)"
  if [ -z "$latest_file" ]; then
    status="failed"
    details="no_backup_files path=$BACKUP_DIR"
  else
    latest_epoch="$(stat -c %Y "$latest_file")"
    current_epoch="$(date +%s)"
    age_hours="$(( (current_epoch - latest_epoch) / 3600 ))"
    details="latest=$(basename "$latest_file") age_hours=$age_hours path=$BACKUP_DIR"
    if [ "$age_hours" -gt "$MAX_AGE_HOURS" ]; then
      status="warn"
    fi
  fi
fi

message="$now status=$status $details"
printf '%s\n' "$message" | tee -a "$LOG_FILE"
logger -t yh-backup-check "$message" 2>/dev/null || true

if [ "$status" = "failed" ]; then
  exit 1
fi
