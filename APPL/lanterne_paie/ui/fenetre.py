"""Fenêtre principale."""

from __future__ import annotations

import re
import traceback
from datetime import date
from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtGui import QColor
from PySide6.QtWidgets import (
    QAbstractItemView, QComboBox, QFileDialog, QFormLayout, QGroupBox, QHBoxLayout, QHeaderView, QLabel,
    QLineEdit, QMainWindow, QMessageBox, QPlainTextEdit, QPushButton, QSplitter, QTableWidget,
    QTableWidgetItem, QVBoxLayout, QWidget,
)

from .. import courriel
from ..dates_fr import MOIS, mois_saison, nom_dossier_mois
from ..fichiers import (
    DOSSIER_AGI, DOSSIER_FICHES, detecter_classeurs, detecter_fiches_presence, detecter_modele_agi,
    detecter_planning,
)
from ..classeur import annee_du_classeur
from ..modeles import Statut
from ..reglages import Reglages
from ..traitement import Analyse, Resultat, TraitementInterrompu, analyser, generer, preparer_email
from ..validation import CONTROLES, bloquants, revalider
from .reglages_dialogue import DialogueReglages

COULEURS = {
    Statut.VALIDE: QColor(214, 240, 214),
    Statut.A_VERIFIER: QColor(255, 236, 200),
    Statut.ERREUR: QColor(250, 210, 210),
}
COLONNES = ["Champ", "Valeur détectée", "Source", "Statut", "Valeur corrigée", "Commentaire"]


class Fenetre(QMainWindow):
    def __init__(self, reglages: Reglages | None = None) -> None:
        super().__init__()
        self.setWindowTitle("La Lanterne Magique — Fiches de salaire et AGI")
        self.resize(1200, 820)
        self.r = reglages or Reglages.charger()
        self.analyse: Analyse | None = None
        self.resultat: Resultat | None = None
        self._remplissage = False

        centre = QWidget()
        self.setCentralWidget(centre)
        mise = QVBoxLayout(centre)

        # --- Sélections --------------------------------------------------------------------
        boite = QGroupBox("Sélection")
        form = QFormLayout(boite)
        self.ch_dossier = self._ligne_fichier(form, "Dossier principal", self.choisir_dossier)
        self.ch_classeurs = QLabel("—")
        self.ch_classeurs.setWordWrap(True)
        b_classeur = QPushButton("Choisir un fichier Excel…")
        b_classeur.clicked.connect(self.choisir_classeur)
        ligne = QHBoxLayout()
        ligne.addWidget(self.ch_classeurs, 1)
        ligne.addWidget(b_classeur)
        form.addRow("Fichiers Excel (par année civile)", ligne)
        self.ch_planning = self._ligne_fichier(form, "Planning annuel (PDF)", self.choisir_planning)
        self.ch_agi = self._ligne_fichier(form, "Modèle AGI (PDF)", self.choisir_agi)
        self.cb_mois = QComboBox()
        self.cb_mois.currentIndexChanged.connect(self.mois_change)
        form.addRow("Mois", self.cb_mois)
        ligne = QHBoxLayout()
        self.cb_presence = QComboBox()
        self.cb_presence.currentIndexChanged.connect(self.presence_change)
        b_presence = QPushButton("Autre fichier…")
        b_presence.clicked.connect(self.choisir_presence)
        ligne.addWidget(self.cb_presence, 1)
        ligne.addWidget(b_presence)
        form.addRow("Fiche de présence", ligne)
        self.cb_collab = QComboBox()
        form.addRow("Collaborateur·trice", self.cb_collab)
        mise.addWidget(boite)

        # --- Boutons ------------------------------------------------------------------------
        barre = QHBoxLayout()
        self.b_analyser = QPushButton("Analyser")
        self.b_generer = QPushButton("Générer")
        self.b_email = QPushButton("Préparer l’e-mail")
        self.b_dossier = QPushButton("Ouvrir le dossier")
        self.b_rapport = QPushButton("Afficher le rapport")
        self.b_reglages = QPushButton("Réglages…")
        for b, f in ((self.b_analyser, self.lancer_analyse), (self.b_generer, self.lancer_generation),
                     (self.b_email, self.lancer_email), (self.b_dossier, self.ouvrir_dossier),
                     (self.b_rapport, self.afficher_rapport), (self.b_reglages, self.ouvrir_reglages)):
            b.clicked.connect(f)
            barre.addWidget(b)
        barre.addStretch(1)
        self.etat = QLabel("")
        barre.addWidget(self.etat)
        mise.addLayout(barre)

        # --- Tableau de validation et journal ---------------------------------------------
        separateur = QSplitter(Qt.Vertical)
        self.table = QTableWidget(0, len(COLONNES))
        self.table.setHorizontalHeaderLabels(COLONNES)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        entete = self.table.horizontalHeader()
        entete.setSectionResizeMode(QHeaderView.Interactive)
        entete.setStretchLastSection(True)
        for i, largeur in enumerate((230, 250, 150, 110, 200)):
            self.table.setColumnWidth(i, largeur)
        self.table.itemChanged.connect(self.cellule_modifiee)
        separateur.addWidget(self.table)
        self.journal = QPlainTextEdit()
        self.journal.setReadOnly(True)
        separateur.addWidget(self.journal)
        separateur.setSizes([560, 120])
        mise.addWidget(separateur, 1)

        self._restaurer()
        self._maj_boutons()

    # --- Utilitaires ------------------------------------------------------------------------
    def _ligne_fichier(self, form: QFormLayout, libelle: str, action) -> QLineEdit:
        champ = QLineEdit()
        champ.setReadOnly(True)
        bouton = QPushButton("Choisir…")
        bouton.clicked.connect(action)
        ligne = QHBoxLayout()
        ligne.addWidget(champ, 1)
        ligne.addWidget(bouton)
        form.addRow(libelle, ligne)
        return champ

    def log(self, message: str) -> None:
        self.journal.appendPlainText(message)

    def erreur(self, titre: str, exc: Exception) -> None:
        self.log(f"✖ {titre} : {exc}")
        if not isinstance(exc, (TraitementInterrompu, FileNotFoundError, ValueError)):
            self.log(traceback.format_exc())
        QMessageBox.critical(self, titre, str(exc))

    def _racine(self) -> Path | None:
        return Path(self.r.dossier_principal) if self.r.dossier_principal else None

    def _restaurer(self) -> None:
        self.ch_dossier.setText(self.r.dossier_principal)
        self.ch_planning.setText(self.r.planning)
        self.ch_agi.setText(self.r.modele_agi)
        self._afficher_classeurs()
        self._remplir_mois()

    def _afficher_classeurs(self) -> None:
        if not self.r.classeurs:
            self.ch_classeurs.setText("Aucun fichier détecté")
            return
        self.ch_classeurs.setText(" · ".join(f"{a} : {Path(c).name}" for a, c in sorted(self.r.classeurs.items())))

    def _maj_boutons(self) -> None:
        analyse = self.analyse is not None
        self.b_generer.setEnabled(analyse and not bloquants(self.analyse.champs) if analyse else False)
        self.b_email.setEnabled(self.resultat is not None and self.resultat.pdf_fiche is not None)
        self.b_rapport.setEnabled(self.resultat is not None and self.resultat.chemin_rapport is not None)
        self.b_dossier.setEnabled(self._racine() is not None)

    # --- Sélections -------------------------------------------------------------------------
    def choisir_dossier(self) -> None:
        chemin = QFileDialog.getExistingDirectory(self, "Dossier principal (ex. 09.26 - 06.27)", self.r.dossier_principal)
        if not chemin:
            return
        self.r.dossier_principal = chemin
        racine = Path(chemin)
        trouves = detecter_classeurs(racine)
        self.r.classeurs = {str(a): str(fichiers[0]) for a, fichiers in trouves.items()}
        for a, fichiers in trouves.items():
            if len(fichiers) > 1:
                self.log(f"⚠ Plusieurs fichiers Excel pour {a} : {', '.join(f.name for f in fichiers)} — "
                         f"« {fichiers[0].name} » retenu, utiliser « Choisir un fichier Excel… » si besoin.")
        plannings = detecter_planning(racine)
        if plannings:
            self.r.planning = str(plannings[0])
        modeles = detecter_modele_agi(racine)
        if modeles:
            self.r.modele_agi = str(modeles[0])
        for dossier in (DOSSIER_FICHES, DOSSIER_AGI):
            (racine / dossier).mkdir(exist_ok=True)
        self.r.enregistrer()
        self._restaurer()
        self.log(f"Dossier principal : {chemin}")

    def choisir_classeur(self) -> None:
        chemin, _ = QFileDialog.getOpenFileName(self, "Fichier Excel de gestion", self.r.dossier_principal, "Excel (*.xlsx)")
        if not chemin:
            return
        annee = annee_du_classeur(Path(chemin))
        if annee is None:
            QMessageBox.warning(self, "Fichier Excel", "Année civile introuvable (onglet Configuration, cellule B5).")
            return
        self.r.classeurs[str(annee)] = chemin
        self.r.enregistrer()
        self._afficher_classeurs()
        self.log(f"Fichier Excel {annee} : {chemin}")

    def choisir_planning(self) -> None:
        chemin, _ = QFileDialog.getOpenFileName(self, "Planning annuel", self.r.dossier_principal, "PDF (*.pdf)")
        if chemin:
            self.r.planning = chemin
            self.r.enregistrer()
            self.ch_planning.setText(chemin)

    def choisir_agi(self) -> None:
        chemin, _ = QFileDialog.getOpenFileName(self, "Modèle AGI", self.r.dossier_principal, "PDF (*.pdf)")
        if chemin:
            self.r.modele_agi = chemin
            self.r.enregistrer()
            self.ch_agi.setText(chemin)

    def _remplir_mois(self) -> None:
        self.cb_mois.blockSignals(True)
        self.cb_mois.clear()
        racine = self._racine()
        debut = date.today().year if date.today().month >= 6 else date.today().year - 1
        if racine:
            m = re.search(r"(\d{2})\.(\d{2})\s*-\s*(\d{2})\.(\d{2})", racine.name)
            if m:
                debut = 2000 + int(m.group(2))
        for annee, mois in mois_saison(debut):
            self.cb_mois.addItem(f"{MOIS[mois - 1]} {annee}", (annee, mois))
        aujourd_hui = (date.today().year, date.today().month)
        index = self.cb_mois.findData(aujourd_hui)
        self.cb_mois.setCurrentIndex(index if index >= 0 else 0)
        self.cb_mois.blockSignals(False)
        self.mois_change()

    def mois_change(self) -> None:
        self.cb_presence.blockSignals(True)
        self.cb_presence.clear()
        racine, donnees = self._racine(), self.cb_mois.currentData()
        if racine and donnees:
            dossier = racine / DOSSIER_FICHES / nom_dossier_mois(date(donnees[0], donnees[1], 1))
            if not dossier.exists():
                self.log(f"Dossier « {dossier.name} » absent : il sera créé lors de la génération.")
            for f in detecter_fiches_presence(dossier):
                self.cb_presence.addItem(f.name, str(f))
        self.cb_presence.blockSignals(False)
        self.presence_change()

    def choisir_presence(self) -> None:
        chemin, _ = QFileDialog.getOpenFileName(self, "Fiche de présence", self.r.dossier_principal,
                                                "Fiche de présence (*.pdf *.xlsx)")
        if chemin:
            self.cb_presence.addItem(Path(chemin).name, chemin)
            self.cb_presence.setCurrentIndex(self.cb_presence.count() - 1)

    def presence_change(self) -> None:
        self.cb_collab.clear()
        self.fiche = None
        chemin = self.cb_presence.currentData()
        if not chemin:
            return
        from ..presence import lire_presence
        try:
            self.fiche = lire_presence(Path(chemin))
        except Exception as exc:  # PDF scanné, fichier illisible…
            self.log(f"✖ {Path(chemin).name} : {exc}")
            return
        for i, p in enumerate(self.fiche.intervenants):
            self.cb_collab.addItem(f"{p.nom_complet} — {p.fonction}", i)

    # --- Analyse ----------------------------------------------------------------------------
    def lancer_analyse(self, ligne_choisie: int | None = None) -> None:
        chemin = self.cb_presence.currentData()
        if not chemin or self.cb_collab.currentData() is None:
            QMessageBox.information(self, "Analyser", "Sélectionnez une fiche de présence et un collaborateur.")
            return
        try:
            self.analyse = analyser(self.r, Path(chemin), self.cb_collab.currentData(),
                                    ligne_choisie if isinstance(ligne_choisie, int) else None, self.fiche)
        except Exception as exc:
            self.erreur("Analyse impossible", exc)
            return
        self.resultat = None
        self._afficher_champs()
        corresp = next(c for c in self.analyse.champs if c.cle == "correspondance")
        if corresp.statut is Statut.ERREUR:
            QMessageBox.warning(self, "Plusieurs correspondances",
                                corresp.commentaire + "\nSaisissez le numéro de ligne dans « Valeur corrigée ».")
        self.log(f"Analyse : {self.analyse.intervenant.nom_complet} — {len(self.analyse.champs)} champs.")

    def _afficher_champs(self) -> None:
        self._remplissage = True
        champs = self.analyse.champs if self.analyse else []
        self.table.setRowCount(len(champs))
        for i, c in enumerate(champs):
            valeurs = [c.libelle + (" *" if c.obligatoire else ""), c.valeur_detectee, c.source, c.statut.value,
                       c.valeur_corrigee, c.commentaire]
            for j, texte in enumerate(valeurs):
                item = QTableWidgetItem(texte)
                editable = (j == 4 and c.modifiable) or j == 5
                item.setFlags(item.flags() | Qt.ItemIsEditable if editable else item.flags() & ~Qt.ItemIsEditable)
                item.setBackground(COULEURS[c.statut])
                self.table.setItem(i, j, item)
            statut = QComboBox()
            statut.addItems([s.value for s in Statut])
            statut.setCurrentText(c.statut.value)
            statut.currentTextChanged.connect(lambda texte, ligne=i: self.statut_modifie(ligne, texte))
            self.table.setCellWidget(i, 3, statut)
        self._remplissage = False
        nb = {s: sum(1 for c in champs if c.statut is s) for s in Statut}
        self.etat.setText(f"Validé : {nb[Statut.VALIDE]} · À vérifier : {nb[Statut.A_VERIFIER]} · Erreur : {nb[Statut.ERREUR]}")
        self._maj_boutons()

    def cellule_modifiee(self, item: QTableWidgetItem) -> None:
        if self._remplissage or not self.analyse:
            return
        champ = self.analyse.champs[item.row()]
        if item.column() == 5:
            champ.commentaire = item.text()
            return
        if item.column() != 4:
            return
        champ.valeur_corrigee = item.text()
        if champ.cle == "correspondance":
            texte = item.text().strip()
            self.lancer_analyse(int(texte) if texte.isdigit() else None)
            return
        revalider(champ)
        self._afficher_champs()

    def statut_modifie(self, ligne: int, texte: str) -> None:
        if self._remplissage or not self.analyse:
            return
        champ = self.analyse.champs[ligne]
        nouveau = Statut(texte)
        controle = CONTROLES.get(champ.cle)
        if nouveau is Statut.VALIDE and (not champ.valeur or (controle and not controle(champ.valeur))):
            QMessageBox.warning(self, "Statut", f"« {champ.libelle} » ne peut pas être validé : valeur absente ou invalide.")
        else:
            champ.statut = nouveau
            champ.commentaire = (champ.commentaire + " Statut modifié manuellement.").strip()
        self._afficher_champs()

    # --- Génération -------------------------------------------------------------------------
    def confirmer(self, titre: str, lignes: list[str]) -> bool:
        boite = QMessageBox(self)
        boite.setWindowTitle(titre)
        boite.setIcon(QMessageBox.Question)
        boite.setText("Les modifications suivantes seront faites dans la COPIE de travail "
                      "(le fichier Excel original n'est jamais modifié). Confirmer ?")
        boite.setDetailedText("\n".join(lignes))
        boite.setStandardButtons(QMessageBox.Yes | QMessageBox.No)
        boite.button(QMessageBox.Yes).setText("Confirmer")
        boite.button(QMessageBox.No).setText("Annuler")
        return boite.exec() == QMessageBox.Yes

    def choisir_version(self, chemin: Path) -> bool:
        r = QMessageBox.question(self, "Fichier existant",
                                 f"« {chemin.name} » existe déjà.\nAucun fichier n'est jamais remplacé.\n\n"
                                 "Créer une version alternative (_v2, _v3…) ?")
        return r == QMessageBox.Yes

    def lancer_generation(self) -> None:
        if not self.analyse:
            return
        self.log("Génération en cours (Microsoft Excel va s'ouvrir)…")
        try:
            self.resultat = generer(self.analyse, self.r, self.confirmer, self.choisir_version)
        except Exception as exc:
            self.erreur("Génération interrompue", exc)
            self._maj_boutons()
            return
        for c in self.resultat.controles:
            if c.statut is not Statut.VALIDE:
                self.log(f"  {c.statut.value} — {c.libelle} : {c.commentaire}")
        self.log(f"✔ Fiche Excel : {self.resultat.excel}")
        self.log(f"✔ PDF fiche de salaire : {self.resultat.pdf_fiche}")
        self.log(f"✔ AGI : {self.resultat.pdf_agi}")
        self.log(f"✔ Rapport : {self.resultat.chemin_rapport}")
        self._maj_boutons()

    def lancer_email(self) -> None:
        if not self.resultat:
            return
        joindre = True
        if self.resultat.pdf_agi:
            joindre = QMessageBox.question(self, "E-mail", "Joindre aussi l'AGI ?") == QMessageBox.Yes
        try:
            statut = preparer_email(self.resultat, self.r, joindre)
        except Exception as exc:
            self.erreur("E-mail", exc)
            return
        self.etat.setText(statut)
        self.log(f"✉ {statut} Glissez les pièces jointes affichées dans le Finder dans le brouillon.")

    def ouvrir_dossier(self) -> None:
        racine = self._racine()
        if not racine:
            return
        cible = racine
        if self.resultat and self.resultat.pdf_fiche:
            cible = self.resultat.pdf_fiche.parent
        courriel.ouvrir(cible)

    def afficher_rapport(self) -> None:
        if self.resultat and self.resultat.chemin_rapport:
            courriel.ouvrir(self.resultat.chemin_rapport)

    def ouvrir_reglages(self) -> None:
        DialogueReglages(self.r, self).exec()
