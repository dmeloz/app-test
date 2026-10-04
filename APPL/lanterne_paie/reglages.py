"""Réglages de l'application, enregistrés localement (~/Library/Application Support/LanternePaie)."""

from __future__ import annotations

import json
import os
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path


def dossier_application() -> Path:
    if sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
    dossier = base / "LanternePaie"
    dossier.mkdir(parents=True, exist_ok=True)
    return dossier


@dataclass
class Reglages:
    dossier_principal: str = ""
    classeurs: dict[str, str] = field(default_factory=dict)  # année -> chemin
    modele_agi: str = ""
    planning: str = ""
    # Signature : "aucune", "image", "dessin" ; "certifiee" réservée à une version future.
    signature_methode: str = "aucune"
    signature_image: str = ""
    # Réponses de l'association pour l'AGI (laisser vide si inconnu => « À vérifier »).
    agi_lieu: str = ""  # vide : nom du club de la fiche de présence (ex. « Chexbres »)
    agi_telephone_club: str = ""
    agi_caisse_avs: str = "Caisse Cantonale Vaudoise de Compensation"
    agi_assureur_lpp: str = ""
    agi_contrat_ecrit: str = ""  # "oui", "non" ou ""
    agi_activite: str = "Animateur·trice"
    agi_gabarit_valide: bool = False
    # Les prestations validées sont aussi ajoutées au classeur annuel (après sauvegarde et confirmation).
    maj_classeur_annuel: bool = True
    # Courriel
    outlook_adresse: str = "https://outlook.live.com/mail/0/deeplink/compose"
    email_objet: str = "La Lanterne Magique – fiche de salaire {mois}"
    email_texte: str = (
        "Bonjour {prenom},\n\nVous trouverez ci-joint votre fiche de salaire pour la séance du {date_seance}"
        "{agi_phrase}.\n\nAvec mes meilleures salutations,\nSarah Moumin\nLa Lanterne Magique"
    )

    @classmethod
    def charger(cls, chemin: Path | None = None) -> "Reglages":
        chemin = chemin or dossier_application() / "reglages.json"
        if not chemin.exists():
            return cls()
        donnees = json.loads(chemin.read_text(encoding="utf-8"))
        connus = {k: v for k, v in donnees.items() if k in cls.__dataclass_fields__}
        return cls(**connus)

    def enregistrer(self, chemin: Path | None = None) -> None:
        chemin = chemin or dossier_application() / "reglages.json"
        chemin.write_text(json.dumps(asdict(self), ensure_ascii=False, indent=2), encoding="utf-8")
