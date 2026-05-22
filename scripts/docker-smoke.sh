#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-platform-io:node24}"
CONTAINER_NAME="${CONTAINER_NAME:-platform-io-docker-smoke}"
HOST_PORT="${HOST_PORT:-8080}"
BASE_URL="http://127.0.0.1:${HOST_PORT}"

cleanup() {
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
}

trap cleanup EXIT
cleanup

docker run --rm -d --name "${CONTAINER_NAME}" -p "${HOST_PORT}:80" "${IMAGE_TAG}" >/dev/null

for _ in $(seq 1 30); do
  if curl -fsS "${BASE_URL}/" >/tmp/platform-io-docker-home.html 2>/dev/null; then
    break
  fi
  sleep 1
done

curl -fsS "${BASE_URL}/" >/tmp/platform-io-docker-home.html
curl -fsS "${BASE_URL}/contact/" >/tmp/platform-io-docker-contact.html

grep -q "<title>" /tmp/platform-io-docker-home.html
grep -q "<title>Contact | Bjorn Melin" /tmp/platform-io-docker-contact.html

echo "Docker smoke passed for ${IMAGE_TAG} at ${BASE_URL}"
