#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
PID_FILE="/tmp/bodyritual-ngrok.pid"
LOG_FILE="/tmp/bodyritual-ngrok.log"
PORT="${1:-3000}"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed."
  exit 1
fi

if ! ngrok config check >/dev/null 2>&1; then
  echo "ngrok is not configured. Run:"
  echo "  ngrok config add-authtoken <YOUR_TOKEN>"
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if kill -0 "$OLD_PID" >/dev/null 2>&1; then
    kill "$OLD_PID" >/dev/null 2>&1 || true
    sleep 1
  fi
fi

rm -f "$LOG_FILE"
ngrok http "$PORT" --log=stdout >"$LOG_FILE" 2>&1 &
NGROK_PID=$!
echo "$NGROK_PID" >"$PID_FILE"

PUBLIC_URL=""

for _ in {1..25}; do
  sleep 1
  if curl -fsS http://127.0.0.1:4040/api/tunnels >/tmp/bodyritual-ngrok-api.json 2>/dev/null; then
    PUBLIC_URL="$(jq -r '.tunnels[] | select(.proto=="https") | .public_url' /tmp/bodyritual-ngrok-api.json | head -n 1)"
    if [[ -n "$PUBLIC_URL" && "$PUBLIC_URL" != "null" ]]; then
      break
    fi
  fi
done

if [[ -z "$PUBLIC_URL" || "$PUBLIC_URL" == "null" ]]; then
  echo "Failed to get public ngrok URL."
  echo "ngrok log:"
  cat "$LOG_FILE"
  exit 1
fi

export PUBLIC_URL
export ENV_FILE

node <<'NODE'
const fs = require("fs");

const envFile = process.env.ENV_FILE;
const publicUrl = process.env.PUBLIC_URL;

let text = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
if (!text.endsWith("\n") && text.length > 0) text += "\n";

if (/^NEXTAUTH_URL=.*/m.test(text)) {
  text = text.replace(/^NEXTAUTH_URL=.*/m, `NEXTAUTH_URL=${publicUrl}`);
} else {
  text += `NEXTAUTH_URL=${publicUrl}\n`;
}

fs.writeFileSync(envFile, text);
NODE

echo "ngrok URL: $PUBLIC_URL"
echo "NEXTAUTH_URL updated in .env"
echo "VK callback URL:"
echo "$PUBLIC_URL/api/auth/callback/vk"
echo
echo "ngrok PID: $NGROK_PID"
