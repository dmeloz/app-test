#!/bin/bash
# Lance les tests. Facultatif : tests sur VOS fichiers (aucune donnée ne quitte le Mac) :
#   LANTERNE_DOSSIER_REEL="/chemin/09.26 - 06.27" ./scripts/tester.command
#   LANTERNE_TEST_EXCEL=1 ajoute une génération réelle avec Microsoft Excel, sur des COPIES temporaires.
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python -m pip install -q -r requirements-dev.txt
.venv/bin/python -m pytest -q -rs
