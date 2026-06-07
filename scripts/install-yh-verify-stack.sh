#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 755 "$SCRIPT_DIR/yh-verify-stack.sh" /usr/local/bin/yh-verify-stack.sh
/usr/local/bin/yh-verify-stack.sh
