#!/bin/bash -ex

# Clean build dir
(cd .. && rm -rf dist)

# Install dependencies
(cd .. && yarn install)

# Build project
(cd .. && yarn build)

# Build container
(cd .. && docker build --no-cache -f docker/Dockerfile -t cccs/howler-ui:latest -t cccs/howler-ui:$version .)
