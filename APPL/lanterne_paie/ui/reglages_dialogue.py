"""Réglages : signature, réponses de l'association pour l'AGI, modèle d'e-mail."""

from __future__ import annotations

import shutil
import tempfile
from datetime import date
from pathlib import Path

from PySide6.QtWidgets import (
    QButtonGroup, QCheckBox, QComboBox, QDialog, QDialogButtonBox, QFileDialog, QFormLayout, QGroupBox,
    QHBoxLayout, QLabel, QLineEdit, QMessageBox, QPlainTextEdit, QPushButton, QRadioButton, QVBoxLayout,
)

from .. import agi, agi_formulaire, courriel
from ..reglages import Reglages, dossier_application
from .signature import DialogueSignature

OUTLOOK = {
    "Outlook.com (compte personnel)": "https://outlook.live.com/mail/0/deeplink/compose",
    "Microsoft 365 (compte professionnel)": "https://outlook.office.com/mail/deeplink/compose",
}


class DialogueReglages(QDialog):
    def __init__(self, reglages: Reglages, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Réglages")
        self.r = reglages
        mise = QVBoxLayout(self)

        # Signature
        boite = QGroupBox("Signature de l'AGI")
        g = QVBoxLayout(boite)
        self.groupe = QButtonGroup(self)
        self.choix = {}
        for cle, texte in (("aucune", "Aucune signature"),
                           ("agi", "Reprendre ma signature d'un AGI déjà signé (recommandé)"),
                           ("image", "Image de signature (PNG ou JPG)"),
                           ("dessin", "Signature dessinée dans l'application"),
                           ("certifiee", "Signature numérique certifiée (version future)")):
            bouton = QRadioButton(texte)
            self.groupe.addButton(bouton)
            self.choix[cle] = bouton
            g.addWidget(bouton)
        self.choix["certifiee"].setEnabled(False)
        self.choix.get(reglages.signature_methode, self.choix["aucune"]).setChecked(True)
        ligne = QHBoxLayout()
        self.etiquette_sig = QLabel(Path(reglages.signature_image).name if reglages.signature_image else "Aucune image")
        b_image = QPushButton("Choisir une image…")
        b_image.clicked.connect(self.choisir_image)
        b_dessin = QPushButton("Dessiner…")
        b_dessin.clicked.connect(self.dessiner)
        b_agi = QPushButton("Choisir un AGI signé…")
        b_agi.clicked.connect(self.reprendre_signature)
        ligne.addWidget(self.etiquette_sig, 1)
        ligne.addWidget(b_agi)
        ligne.addWidget(b_image)
        ligne.addWidget(b_dessin)
        g.addLayout(ligne)
        mise.addWidget(boite)

        # AGI
        boite = QGroupBox("Attestation de gain intermédiaire — réponses de l'association")
        f = QFormLayout(boite)
        self.lieu = QLineEdit(reglages.agi_lieu)
        self.telephone = QLineEdit(reglages.agi_telephone_club)
        self.telephone.setPlaceholderText("vide = téléphone « Comptabilité » de la fiche de présence")
        self.caisse = QLineEdit(reglages.agi_caisse_avs)
        self.assureur = QLineEdit(reglages.agi_assureur_lpp)
        self.activite = QLineEdit(reglages.agi_activite)
        self.contrat = QComboBox()
        self.contrat.addItems(["(laisser la consigne)", "oui", "non"])
        self.contrat.setCurrentText(reglages.agi_contrat_ecrit or "(laisser la consigne)")
        self.gabarit_valide = QCheckBox("Modèle sans champs uniquement : j'ai contrôlé l'aperçu, les zones sont bien placées")
        self.gabarit_valide.setChecked(reglages.agi_gabarit_valide)
        apercu = QPushButton("Aperçu avec des données fictives…")
        apercu.clicked.connect(self.apercu_agi)
        f.addRow("Lieu (vide = nom du club)", self.lieu)
        f.addRow("Téléphone du club", self.telephone)
        f.addRow("Caisse de compensation AVS", self.caisse)
        f.addRow("Assureur LPP (si LPP)", self.assureur)
        f.addRow("Activité exercée", self.activite)
        f.addRow("Contrat écrit (modèle sans champs)", self.contrat)
        f.addRow(apercu)
        f.addRow(self.gabarit_valide)
        f.addRow(QLabel("Le formulaire officiel vierge est fourni avec l'application : aucun modèle à installer."))
        mise.addWidget(boite)

        boite = QGroupBox("Classeur Excel annuel")
        f = QFormLayout(boite)
        self.maj_annuel = QCheckBox("Ajouter aussi collaborateur, date de séance et prestation au classeur annuel "
                                    "(sauvegarde et confirmation avant chaque modification)")
        self.maj_annuel.setChecked(reglages.maj_classeur_annuel)
        f.addRow(self.maj_annuel)
        mise.addWidget(boite)

        # Courriel
        boite = QGroupBox("E-mail (Outlook dans Google Chrome, jamais envoyé)")
        f = QFormLayout(boite)
        self.outlook = QComboBox()
        self.outlook.addItems(list(OUTLOOK))
        for nom, url in OUTLOOK.items():
            if url == reglages.outlook_adresse:
                self.outlook.setCurrentText(nom)
        self.objet = QLineEdit(reglages.email_objet)
        self.texte = QPlainTextEdit(reglages.email_texte)
        self.texte.setFixedHeight(110)
        f.addRow("Compte Outlook", self.outlook)
        f.addRow("Objet", self.objet)
        f.addRow("Texte", self.texte)
        f.addRow(QLabel("Variables : {prenom}, {date_seance}, {mois}, {agi_phrase}"))
        mise.addWidget(boite)

        boutons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        boutons.button(QDialogButtonBox.Ok).setText("Enregistrer")
        boutons.button(QDialogButtonBox.Cancel).setText("Annuler")
        boutons.accepted.connect(self.valider)
        boutons.rejected.connect(self.reject)
        mise.addWidget(boutons)

    def choisir_image(self) -> None:
        chemin, _ = QFileDialog.getOpenFileName(self, "Image de signature", "", "Images (*.png *.jpg *.jpeg)")
        if chemin:
            cible = dossier_application() / f"signature{Path(chemin).suffix.lower()}"
            shutil.copy2(chemin, cible)
            self.r.signature_image = str(cible)
            self.etiquette_sig.setText(Path(chemin).name)
            self.choix["image"].setChecked(True)

    def reprendre_signature(self) -> None:
        chemin, _ = QFileDialog.getOpenFileName(self, "AGI déjà signé", "", "PDF (*.pdf)")
        if not chemin:
            return
        cible = dossier_application() / "signature_agi.pdf"
        if cible.exists():
            cible.unlink()  # remplacement volontaire de la signature enregistrée par l'application
        if agi_formulaire.extraire_signature(Path(chemin), cible):
            self.r.signature_image = str(cible)
            self.etiquette_sig.setText(f"Signature reprise de « {Path(chemin).name} »")
            self.choix["agi"].setChecked(True)
        else:
            QMessageBox.warning(self, "Signature", "Aucune signature trouvée dans ce PDF.")

    def dessiner(self) -> None:
        d = DialogueSignature(self)
        if d.exec():
            cible = dossier_application() / "signature_dessinee.png"
            if d.enregistrer(cible):
                self.r.signature_image = str(cible)
                self.etiquette_sig.setText("Signature dessinée")
                self.choix["dessin"].setChecked(True)

    def apercu_agi(self) -> None:
        modele = Path(self.r.modele_agi) if self.r.modele_agi and Path(self.r.modele_agi).exists() \
            else agi_formulaire.MODELE_VIERGE
        sortie = Path(tempfile.mkdtemp(prefix="apercu_agi_")) / "Apercu_AGI_fictif.pdf"
        sig = Path(self.r.signature_image) if self.r.signature_image else None
        sig = sig if sig and sig.exists() else None
        lieu = f"{self.lieu.text() or 'Lieu'}, le {date.today():%d.%m.%Y}"
        if agi_formulaire.est_formulaire(modele):
            agi_formulaire.remplir_formulaire(modele, sortie, {
                "nom_prenom": "Exemple Camille", "no_avs": "756.0000.0000.02", "adresse": "1000 Lausanne, Rue Fictive 1",
                "date_naissance": "01.01.1990", "mois": "octobre", "annee": "2026", "activite": self.activite.text(),
                "calendrier": 3, "heures": "8", "salaire_contractuel": "000,00", "salaire_base": "000,00",
                "vacances_taux": "00,00", "vacances_montant": "00,00", "lpp": "/1", "caisse_avs": self.caisse.text(),
                "lieu_date": lieu, "telephone": self.telephone.text(),
                "adresse_employeur": ["Club (adresse lue dans Excel)", "Rue", "NPA Localité"],
            }, sig)
            courriel.ouvrir(sortie)
            return
        valeurs = {
            "nom_prenom": "EXEMPLE Camille", "no_avs": "756.0000.0000.02", "adresse": "Rue Fictive 1, 1000 Lausanne",
            "date_naissance": "01/01/1990", "etat_civil": True, "mois_annee": "10/2026", "activite": self.activite.text(),
            "calendrier_consigne": True, "calendrier": 3, "heures": "8", "salaire_contractuel": "000.00",
            "salaire_brut": "000.00", "note_point_10": True, "note_cotisation": True, "salaire_base_case": True,
            "salaire_base": "000.00", "vacances_case": True, "vacances_taux": "00.00", "vacances_montant": "00.00",
            "lpp_consigne": True, "lpp_non": True, "caisse_avs": self.caisse.text(),
            "lieu_date": lieu, "telephone_club": self.telephone.text(),
            "adresse_club": ["Club (adresse lue dans Excel)", "Rue", "NPA Localité"], "signature": True,
        }
        agi.remplir(modele, sortie, valeurs, sig)
        courriel.ouvrir(sortie)

    def valider(self) -> None:
        for cle, bouton in self.choix.items():
            if bouton.isChecked():
                self.r.signature_methode = cle
        self.r.agi_lieu = self.lieu.text().strip()
        self.r.agi_telephone_club = self.telephone.text().strip()
        self.r.agi_caisse_avs = self.caisse.text().strip()
        self.r.agi_assureur_lpp = self.assureur.text().strip()
        self.r.agi_activite = self.activite.text().strip()
        contrat = self.contrat.currentText()
        self.r.agi_contrat_ecrit = contrat if contrat in ("oui", "non") else ""
        self.r.agi_gabarit_valide = self.gabarit_valide.isChecked()
        self.r.maj_classeur_annuel = self.maj_annuel.isChecked()
        self.r.outlook_adresse = OUTLOOK[self.outlook.currentText()]
        self.r.email_objet = self.objet.text()
        self.r.email_texte = self.texte.toPlainText()
        self.r.enregistrer()
        self.accept()
