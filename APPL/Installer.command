#!/bin/bash
# Installation (une seule fois) : crée un environnement Python local dans APPL/.venv.
set -euo pipefail
cd "$(dirname "$0")"
PY=""
for candidat in python3.13 python3.12 python3.11 python3; do
  if command -v "$candidat" >/dev/null 2>&1; then
    if "$candidat" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)'; then PY="$candidat"; break; fi
  fi
done
if [ -z "$PY" ]; then
  echo "Python 3.11 ou plus récent est requis : https://www.python.org/downloads/macos/"
  read -r -p "Appuyez sur Entrée pour fermer." _
  exit 1
fi
"$PY" -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
echo
echo "Installation terminée. Lancez « Lancer Lanterne Paie.command »."
read -r -p "Appuyez sur Entrée pour fermer." _
