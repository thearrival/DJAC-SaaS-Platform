#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DJAC VPS Security Hardening Script
# Target: Ubuntu 24.04 / 25.10 — Hostinger VPS
#
# What this script does (in order):
#   1.  System update & essential tools install
#   2.  Create non-root deploy user (djac-deploy) with sudo + docker access
#   3.  SSH hardening (disable root login, key-only auth, change default port)
#   4.  UFW firewall (allow 22/SSH, 80, 443 only)
#   5.  fail2ban for brute-force protection
#   6.  Unattended-upgrades (automatic security patches)
#   7.  Sysctl network hardening (SYN flood, IP spoofing protection)
#   8.  Remove unused packages / disable unnecessary services
#   9.  Docker socket group security
#  10.  Deploy-key authorisation for GitHub CI/CD
#
# Usage (run as root on fresh VPS):
#   chmod +x vps-harden.sh
#   bash vps-harden.sh
#
# After the script completes:
#   - SSH into the VPS as djac-deploy on port 2222 using your deploy key
#   - Root login over SSH will be DISABLED
#   - Firewall will be ACTIVE
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config — edit before running ──────────────────────────────────────────────
DEPLOY_USER="djac-deploy"
SSH_PORT="2222"
GITHUB_DEPLOY_PUBKEY=""   # Paste your deploy public key here OR leave empty to skip

# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "This script must be run as root."

info "=== DJAC VPS Hardening Started ==="

# ── 1. System update ──────────────────────────────────────────────────────────
info "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git unzip \
    ufw fail2ban \
    unattended-upgrades apt-listchanges \
    auditd audispd-plugins \
    logwatch \
    htop net-tools \
    ca-certificates gnupg lsb-release

# ── 2. Create non-root deploy user ────────────────────────────────────────────
info "Setting up deploy user: ${DEPLOY_USER}..."
if id "${DEPLOY_USER}" &>/dev/null; then
    warn "User ${DEPLOY_USER} already exists — skipping creation."
else
    useradd -m -s /bin/bash -G sudo,docker "${DEPLOY_USER}"
    # Lock password login — only SSH key auth allowed
    passwd -l "${DEPLOY_USER}"
    info "Created user ${DEPLOY_USER} (password login disabled — SSH key only)."
fi

# Set up .ssh directory
DEPLOY_HOME="/home/${DEPLOY_USER}"
mkdir -p "${DEPLOY_HOME}/.ssh"
chmod 700 "${DEPLOY_HOME}/.ssh"
touch "${DEPLOY_HOME}/.ssh/authorized_keys"
chmod 600 "${DEPLOY_HOME}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_HOME}/.ssh"

# Add GitHub deploy key if provided
if [[ -n "${GITHUB_DEPLOY_PUBKEY}" ]]; then
    if ! grep -qF "${GITHUB_DEPLOY_PUBKEY}" "${DEPLOY_HOME}/.ssh/authorized_keys"; then
        echo "${GITHUB_DEPLOY_PUBKEY}" >> "${DEPLOY_HOME}/.ssh/authorized_keys"
        info "GitHub deploy key added to authorized_keys."
    else
        warn "Deploy key already present — skipping."
    fi
else
    warn "GITHUB_DEPLOY_PUBKEY not set. Add your public key manually to:"
    warn "  ${DEPLOY_HOME}/.ssh/authorized_keys"
fi

# Passwordless sudo for specific docker commands only
SUDOERS_FILE="/etc/sudoers.d/djac-deploy"
cat > "${SUDOERS_FILE}" <<EOF
# Allow djac-deploy to manage Docker and run deployment commands without password
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker compose, /usr/local/bin/docker-compose
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /bin/systemctl restart djac, /bin/systemctl status djac
EOF
chmod 440 "${SUDOERS_FILE}"
visudo -cf "${SUDOERS_FILE}" || { rm -f "${SUDOERS_FILE}"; error "Invalid sudoers entry generated."; }
info "Passwordless sudo configured for docker commands."

# ── 3. SSH Hardening ──────────────────────────────────────────────────────────
info "Hardening SSH configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Backup original config
cp "${SSHD_CONFIG}" "${SSHD_CONFIG}.bak.$(date +%Y%m%d%H%M%S)"

# Apply security settings
cat > /etc/ssh/sshd_config.d/99-djac-hardening.conf <<EOF
# DJAC Security Hardening — applied by vps-harden.sh
Port ${SSH_PORT}
Protocol 2

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Session limits
MaxAuthTries 3
MaxSessions 5
LoginGraceTime 30

# Network
TCPKeepAlive yes
ClientAliveInterval 300
ClientAliveCountMax 2
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
PrintMotd no
Banner /etc/ssh/banner

# Restrict users (add more with AllowUsers)
AllowUsers ${DEPLOY_USER}
EOF

# Create login banner
cat > /etc/ssh/banner <<'BANNER'
╔═══════════════════════════════════════════════════════════════╗
║  DJAC Yalla-Hack Platform — Authorised Access Only            ║
║  All connections are logged and monitored.                    ║
║  Unauthorised access will be prosecuted to the fullest extent ║
║  of applicable law.                                           ║
╚═══════════════════════════════════════════════════════════════╝
BANNER

# Validate and reload
sshd -t || error "SSHD config validation failed — check /etc/ssh/sshd_config.d/99-djac-hardening.conf"
systemctl reload ssh || systemctl reload sshd
info "SSH hardened: root login disabled, port changed to ${SSH_PORT}, password auth off."

# ── 4. UFW Firewall ───────────────────────────────────────────────────────────
info "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow new SSH port BEFORE enabling to avoid lockout
ufw allow "${SSH_PORT}/tcp" comment "SSH deploy"

# Web traffic (Traefik / Nginx handles TLS)
ufw allow 80/tcp comment "HTTP (redirect to HTTPS)"
ufw allow 443/tcp comment "HTTPS"

# Optional: allow monitoring port (only if needed, commented out by default)
# ufw allow from <monitoring-server-ip> to any port 9100 comment "Prometheus node exporter"

ufw --force enable
ufw status verbose
info "UFW enabled. Allowed: ${SSH_PORT}/tcp, 80/tcp, 443/tcp."

# ── 5. fail2ban Configuration ─────────────────────────────────────────────────
info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd
destemail = root@localhost
sendername = Fail2ban DJAC
action = %(action_mwl)s

[sshd]
enabled  = true
port     = ${SSH_PORT}
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 86400

[nginx-http-auth]
enabled = true
filter  = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-req-limit]
enabled = true
filter  = nginx-req-limit
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl restart fail2ban
info "fail2ban configured and running."

# ── 6. Automatic Security Updates ────────────────────────────────────────────
info "Enabling unattended security updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Download-Upgradeable-Packages "1";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::Mail "root";
Unattended-Upgrade::MailReport "on-change";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
info "Automatic security updates enabled."

# ── 7. Sysctl Network Hardening ───────────────────────────────────────────────
info "Applying sysctl network hardening..."
cat > /etc/sysctl.d/99-djac-security.conf <<EOF
# --- IP Spoofing Protection ---
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1

# --- SYN Flood Protection ---
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# --- ICMP redirect ignoring ---
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.secure_redirects = 0

# --- Log suspicious packets ---
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# --- Disable source routing ---
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# --- Prevent ping-of-death ---
net.ipv4.icmp_echo_ignore_broadcasts = 1

# --- IPv6 (disable if not used) ---
# net.ipv6.conf.all.disable_ipv6 = 1

# --- Connection tracking ---
net.netfilter.nf_conntrack_max = 524288

# --- File descriptor limits ---
fs.file-max = 100000
EOF
sysctl --system > /dev/null
info "Sysctl hardening applied."

# ── 8. Disable unnecessary services ──────────────────────────────────────────
info "Disabling unnecessary services..."
SERVICES_TO_DISABLE=("bluetooth" "cups" "avahi-daemon" "snapd" "multipathd")
for svc in "${SERVICES_TO_DISABLE[@]}"; do
    if systemctl is-active --quiet "${svc}" 2>/dev/null; then
        systemctl disable --now "${svc}" 2>/dev/null || true
        info "Disabled: ${svc}"
    fi
done

# ── 9. Docker security ────────────────────────────────────────────────────────
info "Securing Docker daemon..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "5"
    },
    "live-restore": true,
    "userland-proxy": false,
    "no-new-privileges": true
}
EOF

# Ensure only docker group members can access the socket
if getent group docker > /dev/null; then
    chmod 660 /var/run/docker.sock 2>/dev/null || true
    chgrp docker /var/run/docker.sock 2>/dev/null || true
fi

systemctl reload docker 2>/dev/null || true
info "Docker daemon secured."

# ── 10. Audit daemon ─────────────────────────────────────────────────────────
info "Configuring audit daemon..."
cat > /etc/audit/rules.d/djac.rules <<EOF
# Monitor authentication events
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/sudoers -p wa -k sudoers

# Monitor SSH config changes
-w /etc/ssh/sshd_config -p wa -k ssh_config

# Monitor Docker
-w /usr/bin/docker -p x -k docker
-w /var/lib/docker -p wa -k docker_files

# Monitor cron
-w /etc/cron.d -p wa -k cron
-w /etc/crontab -p wa -k cron

# Privilege escalation
-a exit,always -F arch=b64 -S setuid -k priv_esc
-a exit,always -F arch=b64 -S setgid -k priv_esc
EOF
systemctl enable auditd
systemctl restart auditd
info "Audit daemon configured."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           DJAC VPS Hardening — COMPLETED                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Deploy user:   ${YELLOW}${DEPLOY_USER}${NC}"
echo -e "  SSH port:      ${YELLOW}${SSH_PORT}${NC}"
echo -e "  Root SSH:      ${RED}DISABLED${NC}"
echo -e "  Password auth: ${RED}DISABLED${NC}"
echo -e "  Firewall:      ${GREEN}ACTIVE${NC} (ports: ${SSH_PORT}, 80, 443)"
echo -e "  fail2ban:      ${GREEN}ACTIVE${NC}"
echo -e "  Auto-updates:  ${GREEN}ENABLED${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT — NEXT STEPS:${NC}"
echo "  1. Add your SSH public key to: ${DEPLOY_HOME}/.ssh/authorized_keys"
echo "  2. Open a NEW terminal and test: ssh -p ${SSH_PORT} ${DEPLOY_USER}@<VPS_IP>"
echo "  3. Only THEN close this session."
echo "  4. Add GitHub Actions secret DJAC_VPS_PORT=${SSH_PORT}"
echo ""
