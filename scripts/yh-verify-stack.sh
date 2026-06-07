#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-https://app.yalla-hack.ae/yalla-hack-owners-console/enter}"
READY_URL="${READY_URL:-http://localhost:3000/api/readyz}"
STATUS_URL="${STATUS_URL:-https://app.yalla-hack.ae/ops-status/}"

echo "=== Yalla production verification ==="

echo "[1/4] Local readiness"
curl -fsS --max-time 10 "$READY_URL"
echo

echo "[2/4] Owner entry route"
curl -kfsS -I --max-time 10 "$APP_URL" | sed -n '1,10p'

echo "[3/4] Backup freshness"
/usr/local/bin/yh-backup-check.sh

echo "[4/4] Monitoring route"
curl -kfsS -I --max-time 10 "$STATUS_URL" | sed -n '1,10p'

echo "VERIFICATION_OK"
