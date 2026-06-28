#!/bin/sh
set -eu

docker-entrypoint.sh postgres &
postgres_pid="$!"

until pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 1
done

python /app/app-server.py &
app_pid="$!"

trap 'kill "$app_pid" "$postgres_pid" 2>/dev/null || true' INT TERM

while kill -0 "$app_pid" 2>/dev/null && kill -0 "$postgres_pid" 2>/dev/null; do
  sleep 1
done

kill "$app_pid" "$postgres_pid" 2>/dev/null || true
