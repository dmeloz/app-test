"""Modèles de données partagés."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from pathlib import Path


class Statut(str, Enum):
    VALIDE = "Validé"
    A_VERIFIER = "À vérifier"
    ERREUR = "Erreur"


@dataclass
class Champ:
    """Une ligne du tableau de validation."""

    cle: str
    libelle: str
    valeur_detectee: str
    source: str
    statut: Statut
    commentaire: str = ""
    obligatoire: bool = False
    valeur_corrigee: str = ""
    modifiable: bool = True

    @property
    def valeur(self) -> str:
        """Valeur retenue : la correction manuelle prime sur la détection."""
        return self.valeur_corrigee.strip() if self.valeur_corrigee.strip() else self.valeur_detectee

    @property
    def bloquant(self) -> bool:
        return self.obligatoire and self.statut is Statut.ERREUR


@dataclass
class Collaborateur:
    """Une ligne de l'onglet « 2. Collaborateurs·trices » (lignes 6 à 40)."""

    ligne: int | None
    prenom: str = ""
    nom: str = ""
    adresse: str = ""
    npa_localite: str = ""
    email: str = ""
    telephone: str = ""
    statut: str = ""
    taux_lpp: float | None = None
    declaration_avs: str = ""
    date_naissance: date | None = None
    no_avs: str = ""
    iban: str = ""

    @property
    def cle(self) -> str:
        """Clé utilisée par le classeur (colonne C : Prénom & " " & Nom)."""
        return f"{self.prenom} {self.nom}".strip()


@dataclass
class Intervenant:
    """Une personne listée dans la fiche de présence (rubrique Animation)."""

    fonction: str
    nom_complet: str
    adresse: str = ""
    npa_localite: str = ""
    telephones: list[str] = field(default_factory=list)
    email: str = ""


@dataclass
class FichePresence:
    source: Path
    club: str = ""
    date_seance: date | None = None
    heure: str = ""
    programme: str = ""
    cinema: str = ""
    intervenants: list[Intervenant] = field(default_factory=list)
    organisation: dict[str, Intervenant] = field(default_factory=dict)  # « Responsable », « Comptabilité »
    cachet_artiste: str = ""


@dataclass
class PlanningClub:
    club: str
    cinema: str
    dates: list[date]

    def numero_seance(self, jour: date) -> int | None:
        """Numéro de séance dans la saison (1 à 9), selon l'ordre du planning."""
        try:
            return self.dates.index(jour) + 1
        except ValueError:
            return None


@dataclass
class ResultatExcel:
    """Valeurs lues dans « 4. Fiches de salaire » après calcul par Excel."""

    controle_d8: str = ""
    nom_e13: str = ""
    titre_c21: str = ""
    valeurs: dict[str, object] = field(default_factory=dict)
