#!/bin/bash
set -e
PROJECT_DIR="/home/ubuntu/.openmausbot/task-workspaces/63086f65-002c-4c3f-864e-fddfb5c609e9/8f3e963e-0d1a-4eab-af18-449043c0b14c/workspaces/fullstack_dev"
TARGET_DIR="/srv/tokencostsai"

echo "=== [1/2] Building static site with Next.js ==="
cd "$PROJECT_DIR"
npm run build

echo "=== [2/2] Syncing build output to $TARGET_DIR ==="
rsync -av --delete "$PROJECT_DIR/out/" "$TARGET_DIR/"

echo "=== Deployment finished successfully at $(date) ==="
