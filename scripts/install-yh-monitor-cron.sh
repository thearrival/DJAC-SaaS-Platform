#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 755 "$SCRIPT_DIR/yh-monitor.sh" /usr/local/bin/yh-monitor.sh
cat > /etc/cron.d/yh-monitor <<'EOF'
*/5 * * * * root /usr/local/bin/yh-monitor.sh
EOF
chmod 644 /etc/cron.d/yh-monitor
systemctl restart cron || service cron restart
/usr/local/bin/yh-monitor.sh
