#!/usr/bin/env bash

REPO_VCS="GIT";
REPO_DIR="$(git rev-parse --show-toplevel)";
VS_VFILE="${REPO_DIR}/package.json";

# . is for the meta char of regular expression, here is for "
VS_SEMVER=' .version.: .';
