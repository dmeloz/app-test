"""Plan des écritures dans la copie de travail (calculé ici, exécuté par Excel).

Seules des cellules de SAISIE sont écrites. Aucune formule, ligne, onglet ou taux n'est modifié.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .classeur import CHAMPS_COLLAB, Classeur
from .controles import normaliser
from .modeles import Collaborateur

# Cellules lues dans « 4. Fiches de salaire » après calcul par Excel.
CELLULES_LUES = [
    "D8", "B5", "E5", "E13", "E14", "E15", "C17", "C18", "C19", "C21", "I16", "I17",
    "F25", "C26", "D26", "F26", "F27",
    "D29", "F29", "D30", "F30", "D31", "F31", "D32", "F32", "D33", "F33", "D34", "F34",
    "D35", "F35", "D36", "F36", "F37", "F39", "F41", "F42", "C44", "F44",
]


@dataclass
class Ecriture:
    feuille: str
    cellule: str
    valeur: object  # str, float ou date
    motif: str
    a_confirmer: bool = False  # ajout ou mise à jour de données : confirmation explicite requise

    def description(self) -> str:
        v = self.valeur.strftime("%d.%m.%Y") if isinstance(self.valeur, date) else self.valeur
        return f"{self.feuille}!{self.cellule} ← « {v} » ({self.motif})"


class PlanImpossible(Exception):
    pass


def planifier(
    classeur: Classeur,
    collaborateur: Collaborateur,
    existant: Collaborateur | None,
    numero_seance: int,
    date_seance: date,
    fonction: str,
) -> list[Ecriture]:
    f = classeur.feuilles
    ecritures: list[Ecriture] = []

    # 1. Collaborateur : mise à jour des seules valeurs différentes, ou ajout dans la 1re ligne libre.
    if existant is not None and existant.ligne:
        ligne = existant.ligne
        for attribut, colonne in CHAMPS_COLLAB.items():
            nouveau, ancien = getattr(collaborateur, attribut), getattr(existant, attribut)
            if _different(nouveau, ancien):
                ecritures.append(Ecriture(f.collaborateurs, f"{colonne}{ligne}", _valeur(nouveau), "mise à jour du collaborateur", True))
    else:
        ligne = classeur.premiere_ligne_collab_libre()
        if ligne is None:
            raise PlanImpossible("Plus de ligne libre dans Collaborateurs (lignes 6 à 40) : ajout impossible sans modifier la structure.")
        for attribut, colonne in CHAMPS_COLLAB.items():
            valeur = getattr(collaborateur, attribut)
            if valeur not in (None, ""):
                ecritures.append(Ecriture(f.collaborateurs, f"{colonne}{ligne}", _valeur(valeur), "ajout du collaborateur", True))

    # 2. Date de la séance dans Configuration.
    ligne_conf = Classeur.ligne_configuration(numero_seance)
    actuelle = classeur.seances.get(ligne_conf)
    if actuelle is None:
        ecritures.append(Ecriture(f.configuration, f"B{ligne_conf}", date_seance, f"date de la séance {numero_seance}", True))
    elif actuelle != date_seance:
        raise PlanImpossible(
            f"Configuration!B{ligne_conf} contient déjà le {actuelle:%d.%m.%Y} pour la séance {numero_seance} "
            f"(attendu : {date_seance:%d.%m.%Y}). Vérifier le classeur ou le planning."
        )

    # 3. Prestation : ligne existante pour ce collaborateur, sinon première place libre du bloc.
    lignes = classeur.prestations.get(ligne_conf, [])
    deja = [p for p in lignes if normaliser(p.collaborateur) == normaliser(collaborateur.cle)]
    if deja:
        if normaliser(deja[0].fonction) != normaliser(fonction):
            ecritures.append(Ecriture(f.prestations, f"E{deja[0].ligne}", fonction, "mise à jour de la fonction", True))
    else:
        occupees = {p.ligne for p in lignes}
        libres = [l for l in Classeur.lignes_bloc(ligne_conf) if l not in occupees]
        if not libres:
            raise PlanImpossible(f"Le bloc Prestations de la séance {numero_seance} est complet (8 places).")
        ecritures.append(Ecriture(f.prestations, f"D{libres[0]}", collaborateur.cle, "ajout de la prestation", True))
        ecritures.append(Ecriture(f.prestations, f"E{libres[0]}", fonction, "fonction de la prestation", True))

    # 4. Sélection dans la fiche de salaire (cellules de saisie B5 et E5).
    ecritures.append(Ecriture(f.fiche, "B5", collaborateur.cle, "collaborateur de la fiche"))
    ecritures.append(Ecriture(f.fiche, "E5", date_seance, "séance de la fiche"))
    return ecritures


def _different(nouveau: object, ancien: object) -> bool:
    if nouveau in (None, ""):
        return False  # on n'efface jamais une valeur existante
    if isinstance(nouveau, float) or isinstance(ancien, float):
        try:
            return abs(float(nouveau) - float(ancien)) > 1e-9
        except (TypeError, ValueError):
            return True
    if isinstance(nouveau, date) or isinstance(ancien, date):
        return nouveau != ancien
    return normaliser(str(nouveau)) != normaliser(str(ancien or ""))


def _valeur(v: object) -> object:
    return v
