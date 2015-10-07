#!/usr/bin/env bash
# Exit on first error
set -e

# Run foundry release with an adjusted PATH
PATH="$PATH:$PWD/node_modules/.bin/"
foundry release $*
