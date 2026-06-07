#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/docker/djac}"
READY_URL="${READY_URL:-http://localhost:3000/api/readyz}"
APP_URL="${APP_URL:-https://app.yalla-hack.ae/api/readyz}"

log() {
  printf '\n[%s] %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*"
}

log "System snapshot"
( uptime || true )
( free -m || true )
( df -h || true )

log "Restarting core services"
systemctl stop nginx || true
systemctl disable nginx || true
systemctl restart docker || true
systemctl restart ssh || systemctl restart sshd || true

if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"

  if [ -f docker-compose.production.yml ]; then
    log "Rebuilding production stack from docker-compose.production.yml"
    docker network inspect traefik_public >/dev/null 2>&1 || docker network create traefik_public || true
    docker compose --env-file .env.production -f docker-compose.production.yml up -d --force-recreate
  else
    log "No compose file found in $APP_DIR — has the deploy pipeline run yet?"
    exit 1
  fi
else
  log "Application directory $APP_DIR not found"
  exit 1
fi

log "Waiting for readiness"
for i in $(seq 1 18); do
  if curl -fsS --max-time 5 "$READY_URL" >/dev/null; then
    log "Application is ready"
    break
  fi
  sleep 10
  if [ "$i" -eq 18 ]; then
    log "Application did not become ready in time"
    docker ps || true
    docker logs --tail=200 djac-app || true
    exit 1
  fi
done

log "Public verification"
curl -k -I --max-time 15 "$APP_URL" | sed -n '1,12p'

log "Recovery complete"
