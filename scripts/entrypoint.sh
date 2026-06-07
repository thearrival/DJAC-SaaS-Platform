#!/bin/sh
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# DJAC Tool â€” Production Docker Entrypoint
#
# Execution order:
#   1. Validate critical environment variables
#   2. Run DB migration runner (migrate-production.mjs)
#      â€” waits for DB readiness internally, applies pending SQL migrations
#   3. Hand off to the Node.js server process via exec
#
# Using `exec` ensures the Node process becomes PID 1 so it receives
# SIGTERM directly (clean graceful shutdown, no zombie processes).
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

set -eu

echo "==================================================================="
echo " DJAC Tool â€” Production Entrypoint"
echo " $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "==================================================================="

# â”€â”€ Guard: critical vars must be present â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MISSING=""

if [ -z "${DATABASE_URL:-}" ]; then
  MISSING="${MISSING} DATABASE_URL"
fi

if [ -z "${JWT_SECRET:-}" ]; then
  MISSING="${MISSING} JWT_SECRET"
fi

if [ -z "${APP_URL:-}" ]; then
  MISSING="${MISSING} APP_URL"
fi

if [ -n "$MISSING" ]; then
  echo "âŒ  FATAL: Missing required environment variables:${MISSING}"
  echo "    Set them in .env.production and restart."
  exit 1
fi

STRIPE_PARTIAL="false"
STRIPE_PRICE_MISSING=""
STRIPE_PRICE_KEYS="STRIPE_PRICE_STARTER_MONTHLY STRIPE_PRICE_STARTER_QUARTERLY STRIPE_PRICE_STARTER_BIANNUAL STRIPE_PRICE_STARTER_ANNUAL STRIPE_PRICE_PRO_MONTHLY STRIPE_PRICE_PRO_QUARTERLY STRIPE_PRICE_PRO_BIANNUAL STRIPE_PRICE_PRO_ANNUAL STRIPE_PRICE_ENTERPRISE_MONTHLY STRIPE_PRICE_ENTERPRISE_ANNUAL"

if [ -n "${STRIPE_SECRET_KEY:-}" ] || [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  STRIPE_PARTIAL="true"
fi

for key in $STRIPE_PRICE_KEYS; do
  eval "value=\${$key:-}"
  if [ -n "$value" ]; then
    STRIPE_PARTIAL="true"
  else
    STRIPE_PRICE_MISSING="$STRIPE_PRICE_MISSING $key"
  fi
done

if [ "$STRIPE_PARTIAL" = "true" ]; then
  STRIPE_MISSING=""
  if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
    STRIPE_MISSING="$STRIPE_MISSING STRIPE_SECRET_KEY"
  fi
  if [ -z "${STRIPE_WEBHOOK_SECRET:-}" ]; then
    STRIPE_MISSING="$STRIPE_MISSING STRIPE_WEBHOOK_SECRET"
  fi
  if [ -n "$STRIPE_PRICE_MISSING" ]; then
    STRIPE_MISSING="$STRIPE_MISSING$STRIPE_PRICE_MISSING"
  fi

  if [ -n "$STRIPE_MISSING" ]; then
    echo "âŒ  FATAL: Stripe billing is partially configured. Missing:$STRIPE_MISSING"
    echo "    Configure the full Stripe billing stack or remove the partial STRIPE_* values."
    exit 1
  fi
fi

# â”€â”€ Guard: reject dev-only JWT secret in production â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
case "${JWT_SECRET}" in
  *djac-dev-local-only*)
    echo "âŒ  FATAL: JWT_SECRET contains the development placeholder."
    echo "    Generate a proper secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    exit 1
    ;;
esac

# â”€â”€ Guard: ALLOW_IN_MEMORY_PERSISTENCE must be false in production â”€â”€â”€â”€â”€â”€â”€â”€â”€
if [ "${ALLOW_IN_MEMORY_PERSISTENCE:-false}" = "true" ]; then
  echo "âŒ  FATAL: ALLOW_IN_MEMORY_PERSISTENCE=true is not permitted in production."
  echo "    Set it to false or remove the variable."
  exit 1
fi

echo ""
echo "[1/2] Running database migrationsâ€¦"
node scripts/migrate-production.mjs

echo ""
echo "[2/2] Starting DJAC Tool server (NODE_ENV=${NODE_ENV:-production})â€¦"
echo ""

# exec replaces the shell process â€” Node.js becomes PID 1
exec node dist/index.js
