#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/yh-monitor.log"
READY_URL="${READY_URL:-http://localhost:3000/api/readyz}"
APP_URL="${APP_URL:-https://app.yalla-hack.ae/api/yalla-admin/me}"
SSL_HOSTS="${SSL_HOSTS:-yalla-hack.ae app.yalla-hack.ae}"
SSL_WARN_DAYS="${SSL_WARN_DAYS:-21}"
DISK_WARN_PERCENT="${DISK_WARN_PERCENT:-85}"

mkdir -p "$(dirname "$LOG_FILE")"

get_ssl_days_left() {
  local host="$1"
  local expire_raw expiry_epoch now_epoch

  if ! command -v openssl >/dev/null 2>&1; then
    echo "unknown"
    return 0
  fi

  expire_raw="$(echo | timeout 10 openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2- || true)"
  if [ -z "$expire_raw" ]; then
    echo "unknown"
    return 0
  fi

  expiry_epoch="$(date -d "$expire_raw" +%s 2>/dev/null || true)"
  now_epoch="$(date +%s)"
  if [ -z "$expiry_epoch" ]; then
    echo "unknown"
    return 0
  fi

  echo $(((expiry_epoch - now_epoch) / 86400))
}

now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
ready_status="ok"
app_status="ok"
severity="info"
ssl_summary=""

if ! curl -fsS --max-time 10 "$READY_URL" >/dev/null; then
  ready_status="failed"
  severity="critical"
fi

app_http_code="$(curl -ksS -o /dev/null -w '%{http_code}' --max-time 10 "$APP_URL" || true)"
if [ "$app_http_code" != "200" ] && [ "$app_http_code" != "401" ]; then
  app_status="failed:${app_http_code:-000}"
  severity="critical"
fi

cpu_load="$(cut -d ' ' -f1-3 /proc/loadavg)"
disk_use="$(df -h / | awk 'NR==2 {print $5}')"
disk_pct="$(df -P / | awk 'NR==2 {gsub(/%/, "", $5); print $5}')"
mem_use="$(free -m | awk '/Mem:/ {printf "%sMB/%sMB", $3, $2}')"

if [ "${disk_pct:-0}" -ge "$DISK_WARN_PERCENT" ] 2>/dev/null; then
  severity="warn"
fi

for host in $SSL_HOSTS; do
  days_left="$(get_ssl_days_left "$host")"
  ssl_summary+="${host}:${days_left}d "
  if [ "$days_left" = "unknown" ]; then
    severity="warn"
  elif [ "$days_left" -le "$SSL_WARN_DAYS" ] 2>/dev/null; then
    severity="warn"
  fi
done

message="${now} severity=${severity} ready=${ready_status} app=${app_status} load=${cpu_load} disk=${disk_use} mem=${mem_use} ssl=\"${ssl_summary% }\""
printf '%s\n' "$message" >> "$LOG_FILE"
logger -t yh-monitor "$message" 2>/dev/null || true
