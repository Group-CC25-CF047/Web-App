#!/bin/bash

cd "$(dirname "$0")"

echo "Updating all GiziLens containers..."
docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    containrrr/watchtower \
    --run-once \
    --cleanup \
    --label-enable

echo "Removing unused GiziLens containers..."
UNUSED_CONTAINERS=$(docker ps -a | grep -E "(gizilens|redis|postgres|nginx|frontend|backend)-prod" | grep "Exited" | awk '{print $1}')
if [ ! -z "$UNUSED_CONTAINERS" ]; then
    docker rm $UNUSED_CONTAINERS || true
fi

echo "Removing unused GiziLens images..."
UNUSED_IMAGES=$(docker images -f "dangling=true" | grep "farismnrr/gizilens" | awk '{print $3}')
if [ ! -z "$UNUSED_IMAGES" ]; then
    docker rmi $UNUSED_IMAGES || true
fi

echo "Bringing up containers and removing orphans..."
docker compose -p gizilens -f docker-compose.yml up -d --remove-orphans

echo "Update completed successfully!"
