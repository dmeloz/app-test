#!/bin/bash
# Facultatif : crée « dist/Lanterne Paie.app » (application macOS autonome).
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/pyinstaller --noconfirm --windowed --name "Lanterne Paie" \
  --add-data "ressources:ressources" \
  --osx-bundle-identifier ch.lanterne-magique.paie \
  lancer.py
echo "Application créée : dist/Lanterne Paie.app"
