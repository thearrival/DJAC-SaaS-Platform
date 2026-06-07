#!/usr/bin/env bash
set -euo pipefail

cat > /etc/logrotate.d/yh-ops <<'EOF'
/var/log/yh-monitor.log /var/log/yh-backup-check.log {
  daily
  rotate 14
  missingok
  notifempty
  compress
  delaycompress
  copytruncate
  create 0640 root adm
}
EOF
chmod 644 /etc/logrotate.d/yh-ops
logrotate -f /etc/logrotate.d/yh-ops >/dev/null 2>&1 || true
echo "Installed /etc/logrotate.d/yh-ops"
