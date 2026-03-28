#!/bin/zsh

set -euo pipefail

PID_FILE="/tmp/bodyritual-ngrok.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No ngrok pid file found."
  exit 0
fi

PID="$(cat "$PID_FILE")"

if kill -0 "$PID" >/dev/null 2>&1; then
  kill "$PID"
  echo "Stopped ngrok process $PID"
else
  echo "ngrok process $PID is not running."
fi

rm -f "$PID_FILE"
