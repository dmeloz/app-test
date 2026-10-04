#!/bin/bash
cd "$(dirname "$0")"
if [ ! -x .venv/bin/python ]; then
  echo "Lancez d'abord « Installer.command »."
  read -r -p "Appuyez sur Entrée pour fermer." _
  exit 1
fi
exec .venv/bin/python -m lanterne_paie
