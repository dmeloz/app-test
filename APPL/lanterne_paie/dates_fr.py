"""Dates et mois en français."""

from __future__ import annotations

import re
from datetime import date

MOIS = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def nom_dossier_mois(jour: date) -> str:
    """« octobre 2026 » : nom des sous-dossiers mensuels."""
    return f"{MOIS[jour.month - 1]} {jour.year}"


def lire_dossier_mois(nom: str) -> tuple[int, int] | None:
    """« octobre 2026 » -> (2026, 10). Tolère majuscules et accents manquants."""
    m = re.fullmatch(r"\s*([a-zA-Zéèêûôàçâîëü]+)\s+(\d{4})\s*", nom)
    if not m:
        return None
    mot = m.group(1).lower()
    sans_accent = {"fevrier": "février", "aout": "août", "decembre": "décembre"}
    mot = sans_accent.get(mot, mot)
    if mot not in MOIS:
        return None
    return int(m.group(2)), MOIS.index(mot) + 1


def mois_saison(debut_annee: int) -> list[tuple[int, int]]:
    """Mois d'une saison, de juin à juin : (2026, 6) ... (2027, 6)."""
    resultat, annee, mois = [], debut_annee, 6
    for _ in range(13):
        resultat.append((annee, mois))
        mois += 1
        if mois > 12:
            annee, mois = annee + 1, 1
    return resultat


def jj_mm_aaaa(jour: date | None, sep: str = ".") -> str:
    return "" if jour is None else f"{jour.day:02d}{sep}{jour.month:02d}{sep}{jour.year}"


def lire_date(texte: str) -> date | None:
    """Accepte JJ.MM.AAAA, JJ.MM.AA, JJ/MM/AAAA et AAAA-MM-JJ."""
    texte = texte.strip()
    m = re.fullmatch(r"(\d{4})-(\d{1,2})-(\d{1,2})", texte)
    if m:
        a, mo, j = (int(x) for x in m.groups())
    else:
        m = re.fullmatch(r"(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})", texte)
        if not m:
            return None
        j, mo, a = (int(x) for x in m.groups())
        if a < 100:
            a += 2000
    try:
        return date(a, mo, j)
    except ValueError:
        return None
