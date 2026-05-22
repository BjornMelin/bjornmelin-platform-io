#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-platform-io:node24}"
CONTAINER_NAME="${CONTAINER_NAME:-platform-io-docker-smoke}"
HOST_PORT="${HOST_PORT:-8080}"
BASE_URL="http://127.0.0.1:${HOST_PORT}"
HOME_HTML="$(mktemp)"
CONTACT_HTML="$(mktemp)"

cleanup() {
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  rm -f "${HOME_HTML}" "${CONTACT_HTML}"
}

trap cleanup EXIT
cleanup

docker run --rm "${IMAGE_TAG}" nginx -t
docker run -d --name "${CONTAINER_NAME}" -p "${HOST_PORT}:80" "${IMAGE_TAG}" >/dev/null

ready=false
for _ in $(seq 1 30); do
  if curl --max-time 5 -fsS "${BASE_URL}/" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done

if [[ "${ready}" != "true" ]]; then
  echo "ERROR: service did not become ready within 30s at ${BASE_URL}" >&2
  docker logs "${CONTAINER_NAME}" >&2 || true
  exit 1
fi

curl --max-time 10 -fsS "${BASE_URL}/" >"${HOME_HTML}"
curl --max-time 10 -fsS "${BASE_URL}/contact/" >"${CONTACT_HTML}"

grep -q "<title>" "${HOME_HTML}"
grep -Eq "<title>[^<]*Contact[^<]*</title>" "${CONTACT_HTML}"

echo "Docker smoke passed for ${IMAGE_TAG} at ${BASE_URL}"
