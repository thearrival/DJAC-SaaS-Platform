#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 755 "$SCRIPT_DIR/yh-backup-check.sh" /usr/local/bin/yh-backup-check.sh
cat > /etc/cron.d/yh-backup-check <<'EOF'
17 */6 * * * root /usr/local/bin/yh-backup-check.sh
EOF
chmod 644 /etc/cron.d/yh-backup-check
systemctl restart cron || service cron restart
/usr/local/bin/yh-backup-check.sh
