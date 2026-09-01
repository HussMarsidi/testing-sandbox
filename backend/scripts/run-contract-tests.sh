#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3099}"
DB_PATH="${DB_PATH:-data/contract-complaints.db}"
BASE_URL="http://127.0.0.1:${PORT}"
VENV_DIR="$ROOT_DIR/.venv-contract"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install -q -r requirements-contract.txt

DB_PATH="$DB_PATH" PORT="$PORT" npm run start >/tmp/feedback-contract-server.log 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 30); do
  if curl -sf "${BASE_URL}/health" >/dev/null; then
    break
  fi
  sleep 1
done

curl -sf "${BASE_URL}/health" >/dev/null

TOKEN="$(
  curl -sf -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password"}' \
  | "$VENV_DIR/bin/python" -c "import sys, json; print(json.load(sys.stdin)['token'])"
)"

"$VENV_DIR/bin/schemathesis" run openapi.json \
  --base-url "${BASE_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --checks all \
  --hypothesis-max-examples 20

echo "Contract tests passed against ${BASE_URL}"
