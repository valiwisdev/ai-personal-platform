#!/usr/bin/env bash
set -euo pipefail

mise -C backend run db-migrate
mise x -- bun backend/src/index.ts &
backend_pid=$!
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  kill "$backend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT

for attempt in {1..30}; do
  if curl --silent --fail --max-time 2 "$BACKEND_URL/health" > /dev/null; then
    break
  fi
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    echo "::error::Backend exited before becoming ready."
    exit 1
  fi
  sleep 1
done
curl --silent --show-error --fail --max-time 2 "$BACKEND_URL/health"

mise x -- uv run --directory agents --frozen uvicorn app.main:app --host 127.0.0.1 --port 8000 &
server_pid=$!

for attempt in {1..30}; do
  if curl --silent --fail --max-time 2 "$AGENT_API_URL/health" > /dev/null; then
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "::error::Agents service exited before becoming ready."
    exit 1
  fi
  sleep 1
done
curl --silent --show-error --fail --max-time 2 "$AGENT_API_URL/health"
mise -C agents run test-agent
