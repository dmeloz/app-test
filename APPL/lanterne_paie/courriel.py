"""Préparation du brouillon Outlook (jamais envoyé).

Outlook sur le Web ouvre un brouillon pré-rempli (destinataire, objet, texte). Un lien ne peut pas
joindre de fichier : le dossier des pièces jointes est affiché dans le Finder pour les glisser.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

STATUT_PREPARE = "E-mail préparé – en attente d’envoi."


def url_brouillon(base: str, destinataire: str, objet: str, texte: str) -> str:
    return (
        f"{base}?to={quote(destinataire)}&subject={quote(objet)}&body={quote(texte)}"
    )


def ouvrir_dans_chrome(url: str) -> None:
    if sys.platform != "darwin":
        raise RuntimeError("L'ouverture dans Google Chrome n'est disponible que sur macOS.")
    subprocess.run(["open", "-a", "Google Chrome", url], check=True)


def montrer_dans_finder(fichiers: list[Path]) -> None:
    if sys.platform != "darwin":
        return
    existants = [str(f) for f in fichiers if f.exists()]
    if existants:
        subprocess.run(["open", "-R", *existants], check=False)


def ouvrir(chemin: Path) -> None:
    if sys.platform == "darwin":
        subprocess.run(["open", str(chemin)], check=False)
