#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DJAC Tool — VPS First-Boot Bootstrap
#
# Run ONCE on a fresh VPS before the first GitHub Actions deploy.
# Idempotent: safe to re-run if something failed partway through.
#
# Prerequisites on the VPS:
#   - Docker + Docker Compose v2 installed
#   - User executing this script is in the 'docker' group
#   - Port 80 and 443 are open in the firewall
#
# Usage:
#   chmod +x vps-first-boot.sh && bash vps-first-boot.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DJAC_DIR="${DJAC_DIR:-/docker/djac}"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"

log() { printf '\n\033[1;32m[%s]\033[0m %s\n' "$(date -u +"%H:%M:%S")" "$*"; }
err() { printf '\n\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; }

# ── 1. Create working directories ────────────────────────────────────────────
log "Creating directory structure"
mkdir -p "$DJAC_DIR"
mkdir -p "$TRAEFIK_DIR/certs"
mkdir -p "$TRAEFIK_DIR/logs"

# ── 2. Prepare Traefik ACME storage ──────────────────────────────────────────
log "Setting up Traefik ACME certificate storage"
if [ ! -f "$TRAEFIK_DIR/certs/acme.json" ]; then
  touch "$TRAEFIK_DIR/certs/acme.json"
fi
chmod 600 "$TRAEFIK_DIR/certs/acme.json"
echo "  acme.json ready (chmod 600)"

# ── 3. Create traefik_public Docker network ──────────────────────────────────
log "Ensuring traefik_public Docker network exists"
if docker network inspect traefik_public >/dev/null 2>&1; then
  echo "  traefik_public already exists — skipping"
else
  docker network create traefik_public
  echo "  traefik_public created"
fi

# ── 4. Copy compose file and start Traefik ───────────────────────────────────
log "Starting Traefik"
# The deploy pipeline copies docker-compose.traefik.yml to $DJAC_DIR.
# On first boot we copy it into $TRAEFIK_DIR for its own compose project scope.
if [ -f "$DJAC_DIR/docker-compose.traefik.yml" ]; then
  cp -f "$DJAC_DIR/docker-compose.traefik.yml" "$TRAEFIK_DIR/docker-compose.yml"
else
  err "docker-compose.traefik.yml not found in $DJAC_DIR"
  err "Run the GitHub Actions deploy pipeline first so the file is uploaded, then re-run this script."
  exit 1
fi

docker compose -f "$TRAEFIK_DIR/docker-compose.yml" up -d
echo "  Traefik started"

# ── 5. Verify Traefik is healthy ─────────────────────────────────────────────
log "Waiting for Traefik to become healthy (max 30s)"
for i in $(seq 1 6); do
  STATUS=$(docker inspect traefik --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  echo "  attempt $i/6 — $STATUS"
  if [ "$STATUS" = "healthy" ]; then
    break
  fi
  sleep 5
done

# ── 6. Summary ───────────────────────────────────────────────────────────────
log "Bootstrap complete"
echo ""
echo "  Traefik:         $(docker inspect --format='{{.State.Status}}' traefik 2>/dev/null || echo 'not running')"
echo "  traefik_public:  $(docker network inspect traefik_public --format='{{.Name}}' 2>/dev/null)"
echo "  ACME storage:    $TRAEFIK_DIR/certs/acme.json"
echo ""
echo "Next steps:"
echo "  1. Set all required GitHub Secrets (see .env.production.example)"
echo "  2. Trigger the DJAC Live — Build & Deploy workflow from GitHub Actions"
echo "     (push to djac-live/ or use workflow_dispatch)"
