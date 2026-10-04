"""Nommage, dossiers mensuels, sauvegardes et versions (aucune suppression, aucun écrasement)."""

from __future__ import annotations

import shutil
from datetime import date, datetime
from pathlib import Path

from .classeur import annee_du_classeur
from .controles import sans_accents_fichier
from .dates_fr import nom_dossier_mois

DOSSIER_FICHES = "Fiches de salaire"
DOSSIER_AGI = "AGI"
DOSSIER_MODELES = "Modèles"
DOSSIER_SAUVEGARDES = "Sauvegardes"
DOSSIER_RAPPORTS = "Rapports"


def partie_nom(nom: str, prenom: str) -> str:
    """NOM_Prenom (sans accents ni espaces) pour les noms de fichiers."""
    nom_f = sans_accents_fichier(nom).upper()
    prenom_f = "-".join(p.capitalize() for p in sans_accents_fichier(prenom).split("-") if p)
    return f"{nom_f}_{prenom_f}"


def suffixe_periode(jour: date, plusieurs_seances_dans_le_mois: bool) -> str:
    """YYYY-MM, ou YYYY-MM-JJ si le mois compte plusieurs séances (une fiche par séance)."""
    return jour.strftime("%Y-%m-%d") if plusieurs_seances_dans_le_mois else jour.strftime("%Y-%m")


def nom_fiche(nom: str, prenom: str, periode: str, extension: str) -> str:
    return f"Fiche_salaire_{partie_nom(nom, prenom)}_{periode}.{extension}"


def nom_agi(nom: str, prenom: str, periode: str) -> str:
    return f"AGI_{partie_nom(nom, prenom)}_{periode}.pdf"


def dossier_mensuel(racine: Path, categorie: str, jour: date, creer: bool = True) -> Path:
    dossier = racine / categorie / nom_dossier_mois(jour)
    if creer:
        dossier.mkdir(parents=True, exist_ok=True)
    return dossier


def version_disponible(chemin: Path) -> Path:
    """Premier nom libre : fichier.pdf, sinon fichier_v2.pdf, fichier_v3.pdf…"""
    if not chemin.exists():
        return chemin
    n = 2
    while True:
        candidat = chemin.with_name(f"{chemin.stem}_v{n}{chemin.suffix}")
        if not candidat.exists():
            return candidat
        n += 1


def horodatage(moment: datetime | None = None) -> str:
    return (moment or datetime.now()).strftime("%Y-%m-%d_%H%M%S")


def sauvegarder(racine: Path, fichiers: list[Path], moment: datetime | None = None) -> Path:
    """Copie horodatée des fichiers avant traitement, dans Sauvegardes/AAAA-MM-JJ_HHMMSS/."""
    cible = version_disponible(racine / DOSSIER_SAUVEGARDES / horodatage(moment))
    cible.mkdir(parents=True)
    for f in fichiers:
        if f and f.exists():
            shutil.copy2(f, version_disponible(cible / f.name))
    return cible


def copier_sans_ecraser(source: Path, destination: Path) -> Path:
    if destination.exists():
        raise FileExistsError(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    return destination


def detecter_classeurs(racine: Path) -> dict[int, list[Path]]:
    """Classeurs de gestion du dossier principal, regroupés par année civile (Configuration!B5)."""
    resultat: dict[int, list[Path]] = {}
    for chemin in sorted(racine.glob("*.xlsx")):
        if chemin.name.startswith("~$"):
            continue
        annee = annee_du_classeur(chemin)
        if annee:
            resultat.setdefault(annee, []).append(chemin)
    return resultat


def detecter_planning(racine: Path) -> list[Path]:
    return [p for p in sorted(racine.glob("*.pdf")) if "plan" in p.name.lower()]


def detecter_modele_agi(racine: Path) -> list[Path]:
    dossiers = [racine / DOSSIER_MODELES, racine / DOSSIER_AGI, racine]
    trouves = []
    for d in dossiers:
        if d.is_dir():
            trouves += [p for p in sorted(d.glob("*.pdf")) if "gain" in p.name.lower() and "mod" in p.name.lower()]
    return trouves


def detecter_fiches_presence(dossier_mois: Path) -> list[Path]:
    if not dossier_mois.is_dir():
        return []
    return [
        p for p in sorted(dossier_mois.iterdir())
        if p.suffix.lower() in {".pdf", ".xlsx"} and "presence" in sans_accents_fichier(p.name).lower()
        and not p.name.startswith("~$")
    ]
