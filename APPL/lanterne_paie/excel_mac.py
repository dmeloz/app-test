"""Pilotage de Microsoft Excel pour Mac par AppleScript.

Excel écrit les cellules de saisie, recalcule, enregistre et exporte « Fiches de salaire » en PDF.
Ainsi formules, listes déroulantes et mises en forme sont conservées telles quelles.
"""

from __future__ import annotations

import re
import subprocess
import sys
from datetime import date
from pathlib import Path

from .modeles import ResultatExcel
from .plan_excel import CELLULES_LUES, Ecriture


class ErreurExcel(Exception):
    pass


def chaine_applescript(texte: str) -> str:
    return '"' + str(texte).replace("\\", "\\\\").replace('"', '\\"') + '"'


def _texte_force(texte: str) -> str:
    """Empêche Excel de convertir un texte « numérique » (téléphone, N° AVS) en nombre ou en date."""
    if re.fullmatch(r"[\d\s.+/\-]+", texte):
        return "'" + texte
    return texte


def generer_script(classeur: Path, ecritures: list[Ecriture], feuille_fiche: str, pdf: Path | None) -> str:
    lignes = [
        "on ecrireDate(ws, adresse, a, m, j)",
        "\tset d to current date",
        "\tset day of d to 1",
        "\tset year of d to a",
        "\tset month of d to m",
        "\tset day of d to j",
        "\tset time of d to 0",
        "\ttell application \"Microsoft Excel\" to set value of range adresse of ws to d",
        "end ecrireDate",
        "",
        "on lire(ws, adresse)",
        "\ttell application \"Microsoft Excel\"",
        "\t\tset v to value of range adresse of ws",
        "\tend tell",
        "\tif class of v is date then",
        "\t\treturn \"DATE:\" & (year of v as integer) & \"-\" & (month of v as integer) & \"-\" & (day of v as integer)",
        "\tend if",
        "\tif class of v is real or class of v is integer then return \"NUM:\" & (v as text)",
        "\treturn \"TXT:\" & (v as text)",
        "end lire",
        "",
        "tell application \"Microsoft Excel\"",
        "\tset display alerts to false",
        f"\tset wb to open workbook workbook file name {chaine_applescript(str(classeur))} update links do not update links",
    ]
    for e in ecritures:
        ws = f"worksheet {chaine_applescript(e.feuille)} of wb"
        if isinstance(e.valeur, date):
            v: date = e.valeur
            lignes.append(f"\tmy ecrireDate({ws}, {chaine_applescript(e.cellule)}, {v.year}, {v.month}, {v.day})")
        elif isinstance(e.valeur, (int, float)):
            lignes.append(f"\tset value of range {chaine_applescript(e.cellule)} of {ws} to {repr(float(e.valeur))}")
        else:
            texte = _texte_force(str(e.valeur))
            lignes.append(f"\tset value of range {chaine_applescript(e.cellule)} of {ws} to {chaine_applescript(texte)}")
    fiche = f"worksheet {chaine_applescript(feuille_fiche)} of wb"
    lignes += [
        "\tcalculate full",
        "\tset sortie to \"\"",
    ]
    for cellule in CELLULES_LUES:
        lignes.append(
            f"\tset sortie to sortie & {chaine_applescript(cellule)} & tab & (my lire({fiche}, {chaine_applescript(cellule)})) & linefeed"
        )
    lignes.append("\tsave wb")
    if pdf is not None:
        lignes += [
            f"\tactivate object {fiche}",
            f"\tset cheminPdf to (POSIX file {chaine_applescript(str(pdf))}) as string",
            "\tsave as active sheet filename cheminPdf file format PDF file format",
        ]
    lignes += ["\tclose wb saving no", "end tell", "return sortie"]
    return "\n".join(lignes) + "\n"


def lire_sortie(sortie: str) -> ResultatExcel:
    valeurs: dict[str, object] = {}
    for ligne in sortie.splitlines():
        if "\t" not in ligne:
            continue
        cellule, brut = ligne.split("\t", 1)
        valeurs[cellule.strip()] = _convertir(brut)
    return ResultatExcel(
        controle_d8=str(valeurs.get("D8") or ""),
        nom_e13=str(valeurs.get("E13") or ""),
        titre_c21=str(valeurs.get("C21") or ""),
        valeurs=valeurs,
    )


def _convertir(brut: str) -> object:
    if brut.startswith("NUM:"):
        texte = brut[4:].strip().replace(" ", "").replace("'", "")
        # AppleScript écrit les réels selon la langue du système (virgule ou point décimal).
        texte = texte.replace(",", ".")
        try:
            return float(texte)
        except ValueError:
            return texte
    if brut.startswith("DATE:"):
        a, m, j = (int(x) for x in brut[5:].split("-"))
        return date(a, m, j)
    if brut.startswith("TXT:"):
        texte = brut[4:]
        return "" if texte == "missing value" else texte
    return brut


def executer(script: str, delai: int = 180) -> str:
    if sys.platform != "darwin":
        raise ErreurExcel("Le pilotage d'Excel n'est possible que sur macOS avec Microsoft Excel installé.")
    try:
        resultat = subprocess.run(
            ["osascript", "-"], input=script, capture_output=True, text=True, timeout=delai, check=False
        )
    except subprocess.TimeoutExpired as exc:
        raise ErreurExcel("Excel n'a pas répondu à temps (une boîte de dialogue est peut-être ouverte).") from exc
    if resultat.returncode != 0:
        raise ErreurExcel(f"Erreur Excel/AppleScript : {resultat.stderr.strip()}")
    return resultat.stdout


def traiter(classeur: Path, ecritures: list[Ecriture], feuille_fiche: str, pdf: Path | None) -> ResultatExcel:
    sortie = executer(generer_script(classeur, ecritures, feuille_fiche, pdf))
    return lire_sortie(sortie)


def classeur_ouvert(classeur: Path) -> bool:
    """Le classeur est-il ouvert dans Excel ? (Ne lance pas Excel s'il n'est pas déjà ouvert.)"""
    if sys.platform != "darwin":
        return False
    script = (
        'if application "Microsoft Excel" is running then\n'
        '\ttell application "Microsoft Excel" to return (name of every workbook) as text\n'
        "end if\n"
        'return ""\n'
    )
    try:
        sortie = executer(script, delai=20)
    except ErreurExcel:
        return False
    return classeur.name in sortie
