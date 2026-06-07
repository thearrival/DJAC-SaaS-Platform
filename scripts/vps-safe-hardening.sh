#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
STAMP="$(date +%Y%m%d%H%M%S)"

backup_file() {
  local file="$1"
  if [ -f "$file" ]; then
    cp "$file" "$file.bak.$STAMP"
  fi
}

echo "[1/5] Installing security packages..."
if grep -Rqi 'repository.monarx.com' /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null; then
  find /etc/apt/sources.list.d -maxdepth 1 \( -name '*monarx*.list' -o -name '*imunify*.list' \) -exec mv {} {}.disabled \; 2>/dev/null || true
fi
apt-get update -qq
apt-get install -y -qq ufw fail2ban unattended-upgrades apt-listchanges >/dev/null

echo "[2/5] Hardening SSH without breaking key-based access..."
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-yalla-safe-hardening.conf <<'EOF'
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin prohibit-password
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
sshd -t
systemctl reload ssh || systemctl reload sshd

echo "[3/5] Enabling firewall for web + SSH only..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable >/dev/null

echo "[4/5] Configuring fail2ban..."
backup_file /etc/fail2ban/jail.local
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = 22
maxretry = 4
EOF
systemctl enable fail2ban >/dev/null
systemctl restart fail2ban

echo "[5/5] Enabling unattended security upgrades..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
        "${distro_id}:${distro_codename}";
        "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
EOF

echo "Security hardening applied successfully."
ufw status verbose
systemctl is-active fail2ban
