#!/usr/bin/env bash
set -e

echo "Starting voicetowebsite development environment"

cd /workspace

npm install

if [ -f requirements.txt ]; then
pip install -r requirements.txt
fi

npm run dev
