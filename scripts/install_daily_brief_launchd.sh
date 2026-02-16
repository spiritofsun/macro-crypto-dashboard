#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3)}"
PLIST_NAME="com.projectmark.daily.macrobrief"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
SCRIPT_PATH="$ROOT_DIR/scripts/daily_macro_brief.py"
LOG_DIR="$ROOT_DIR/runtime"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "python3 not found" >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_NAME}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PYTHON_BIN}</string>
    <string>${SCRIPT_PATH}</string>
    <string>--output-dir</string>
    <string>${ROOT_DIR}/reports</string>
    <string>--timezone</string>
    <string>Asia/Seoul</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>9</integer>
    <key>Minute</key>
    <integer>27</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/daily_brief_stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/daily_brief_stderr.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed launchd job: ${PLIST_NAME}"
echo "Plist: ${PLIST_PATH}"
echo "Schedule: Every day at 09:27 (Asia/Seoul)"
