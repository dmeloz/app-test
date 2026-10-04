"""Exécute les écritures prévues avec LibreOffice au lieu d'Excel (tests sous Linux uniquement)."""

from __future__ import annotations

import json
import shutil
import subprocess
from datetime import date
from pathlib import Path

from lanterne_paie.excel_mac import lire_sortie
from lanterne_paie.modeles import ResultatExcel
from lanterne_paie.plan_excel import CELLULES_LUES, Ecriture

SCRIPT = Path(__file__).with_name("libreoffice_uno.py")
PYTHON_SYSTEME = "/usr/bin/python3"


def disponible() -> bool:
    if not shutil.which("soffice") or not Path(PYTHON_SYSTEME).exists():
        return False
    r = subprocess.run([PYTHON_SYSTEME, "-c", "import uno"], capture_output=True)
    return r.returncode == 0


def executer(classeur: Path, ecritures: list[Ecriture], feuille_fiche: str, pdf: Path) -> ResultatExcel:
    def typer(v):
        if isinstance(v, date):
            return "date", v.isoformat()
        if isinstance(v, (int, float)):
            return "nombre", str(v)
        return "texte", str(v)

    demande = {
        "classeur": str(classeur), "feuille_fiche": feuille_fiche, "pdf": str(pdf), "lire": CELLULES_LUES,
        "ecritures": [[e.feuille, e.cellule, *typer(e.valeur)] for e in ecritures],
    }
    r = subprocess.run([PYTHON_SYSTEME, str(SCRIPT)], input=json.dumps(demande), capture_output=True,
                       text=True, timeout=300)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    return lire_sortie(r.stdout)
