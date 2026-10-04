"""Orchestration : analyser, générer, préparer l'e-mail."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Callable

from pypdf import PdfReader

from . import agi, agi_formulaire, courriel, excel_mac, integrite
from .classeur import Classeur, lire_classeur
from .controles import (
    formater_chf, formater_nombre, formater_nombre_fr, formater_pourcentage, formater_pourcentage_fr, normaliser,
)
from .dates_fr import MOIS, jj_mm_aaaa, nom_dossier_mois
from .fichiers import (
    DOSSIER_AGI, DOSSIER_FICHES, copier_sans_ecraser, dossier_mensuel, nom_agi, nom_fiche,
    suffixe_periode, sauvegarder, version_disponible,
)
from .journal import Rapport, journaliser
from .modeles import Champ, Collaborateur, FichePresence, Intervenant, PlanningClub, ResultatExcel, Statut
from .plan_excel import Ecriture, PlanImpossible, planifier
from .planning import lire_planning
from .presence import lire_presence
from .reglages import Reglages
from .validation import (
    bloquants, champs_agi, champs_collaborateur, champs_seance, collaborateur_depuis, correspondances, date_seance,
)


class TraitementInterrompu(Exception):
    pass


@dataclass
class Analyse:
    racine: Path
    fiche: FichePresence
    intervenant: Intervenant
    planning: PlanningClub | None
    classeur: Classeur | None
    collaborateur: Collaborateur | None
    champs: list[Champ]
    documents: list[str]

    @property
    def numero_seance(self) -> int | None:
        v = next((c.valeur for c in self.champs if c.cle == "numero_seance"), "")
        return int(v) if v.isdigit() else None


@dataclass
class Resultat:
    rapport: Rapport
    chemin_rapport: Path | None = None
    excel: Path | None = None
    pdf_fiche: Path | None = None
    pdf_agi: Path | None = None
    destinataire: str = ""
    prenom: str = ""
    date_seance: date | None = None
    controles: list[Champ] = field(default_factory=list)


def numero_dans_nom(fichier: Path) -> int | None:
    """« Chexbres_1 Fiche de présence.xlsx » -> 1."""
    m = re.search(r"_(\d)\b", fichier.stem)
    return int(m.group(1)) if m else None


def analyser(
    reglages: Reglages,
    fichier_presence: Path,
    index_intervenant: int = 0,
    ligne_choisie: int | None = None,
    fiche: FichePresence | None = None,
) -> Analyse:
    racine = Path(reglages.dossier_principal)
    fiche = fiche or lire_presence(fichier_presence)
    if not fiche.intervenants:
        raise TraitementInterrompu("Aucun intervenant trouvé dans la fiche de présence.")
    intervenant = fiche.intervenants[index_intervenant]
    documents = [str(fichier_presence)]

    planning = None
    if reglages.planning:
        documents.append(reglages.planning)
        clubs = lire_planning(Path(reglages.planning))
        planning = clubs.get(normaliser(fiche.club))

    classeur, nb = None, 0
    if fiche.date_seance:
        chemin = reglages.classeurs.get(str(fiche.date_seance.year))
        nb = 1 if chemin else 0
        if chemin:
            documents.append(chemin)
            classeur = lire_classeur(Path(chemin))
            if classeur.annee != fiche.date_seance.year:
                classeur.anomalies.append(
                    f"Configuration!B5 indique {classeur.annee}, la séance est en {fiche.date_seance.year}."
                )

    champs = champs_seance(fiche, planning, numero_dans_nom(fichier_presence), classeur, nb, intervenant)
    exactes, proches = correspondances(classeur, intervenant)
    choisi = None
    if ligne_choisie is not None and classeur:
        choisi = next((c for c in classeur.collaborateurs if c.ligne == ligne_choisie), None)
    elif len(exactes) == 1:
        choisi = exactes[0]
    champs += champs_collaborateur(intervenant, exactes, proches, choisi)
    champs += champs_agi(reglages.agi_activite)
    return Analyse(racine, fiche, intervenant, planning, classeur, choisi, champs, documents)


def _plusieurs_seances(analyse: Analyse, jour: date) -> bool:
    if not analyse.planning:
        return False
    return sum(1 for d in analyse.planning.dates if (d.year, d.month) == (jour.year, jour.month)) > 1


def generer(
    analyse: Analyse,
    reglages: Reglages,
    confirmer: Callable[[str, list[str]], bool],
    choisir_version: Callable[[Path], bool],
    executer_excel: Callable[[Path, list[Ecriture], str, Path | None], ResultatExcel] = excel_mac.traiter,
) -> Resultat:
    """Génère la copie Excel, le PDF de la fiche de salaire et l'AGI.

    confirmer(titre, lignes) : demande une confirmation explicite avant d'écrire des données.
    choisir_version(chemin) : un fichier existe déjà ; True = créer une version alternative.
    """
    erreurs = bloquants(analyse.champs)
    if erreurs:
        raise TraitementInterrompu(
            "Génération bloquée : " + ", ".join(c.libelle for c in erreurs) + " (statut Erreur)."
        )
    if analyse.classeur is None:
        raise TraitementInterrompu("Aucun classeur Excel sélectionné pour l'année de la séance.")
    jour = date_seance(analyse.champs)
    numero = analyse.numero_seance
    if jour is None or numero is None:
        raise TraitementInterrompu("Date ou numéro de séance manquant.")
    racine = analyse.racine
    # Relecture juste avant d'écrire : le classeur annuel a pu recevoir des prestations depuis l'analyse.
    analyse.classeur = lire_classeur(analyse.classeur.chemin)
    champ = {c.cle: c for c in analyse.champs}
    ligne = analyse.collaborateur.ligne if analyse.collaborateur else None
    if champ["correspondance"].valeur_corrigee.strip().isdigit():
        ligne = int(champ["correspondance"].valeur_corrigee)
    existant = next((c for c in analyse.classeur.collaborateurs if c.ligne == ligne), None)
    collab = collaborateur_depuis(analyse.champs, existant.ligne if existant else None)
    fonction = champ["fonction"].valeur

    # Plan d'écriture établi sur l'original (identique à la future copie), avant toute copie.
    try:
        ecritures = planifier(analyse.classeur, collab, existant, numero, jour, fonction)
    except PlanImpossible as exc:
        raise TraitementInterrompu(str(exc)) from exc
    a_confirmer = [e.description() for e in ecritures if e.a_confirmer]
    ecritures_annuel = [e for e in ecritures if e.feuille != analyse.classeur.feuilles.fiche]
    if reglages.maj_classeur_annuel and ecritures_annuel:
        a_confirmer.append(
            f"→ Ces données seront aussi ajoutées au classeur annuel « {analyse.classeur.chemin.name} » "
            "(sauvegardé avant toute modification)."
        )
    if a_confirmer and not confirmer("Modifications des fichiers Excel", a_confirmer):
        raise TraitementInterrompu("Génération annulée : modifications non confirmées.")

    periode = suffixe_periode(jour, _plusieurs_seances(analyse, jour))
    dossier_fiches = dossier_mensuel(racine, DOSSIER_FICHES, jour)
    dossier_agi = dossier_mensuel(racine, DOSSIER_AGI, jour)
    cibles = {
        "excel": dossier_fiches / nom_fiche(collab.nom, collab.prenom, periode, "xlsx"),
        "pdf": dossier_fiches / nom_fiche(collab.nom, collab.prenom, periode, "pdf"),
        "agi": dossier_agi / nom_agi(collab.nom, collab.prenom, periode),
    }
    if any(p.exists() for p in cibles.values()):
        existe = next(p for p in cibles.values() if p.exists())
        if not choisir_version(existe):
            raise TraitementInterrompu(f"Génération annulée : {existe.name} existe déjà.")
        cibles = {k: version_disponible(p) for k, p in cibles.items()}

    moment = datetime.now()
    modele_agi = Path(reglages.modele_agi) if reglages.modele_agi else None
    sauvegarde = sauvegarder(racine, [analyse.classeur.chemin, modele_agi, analyse.fiche.source], moment)
    rapport = Rapport(mois=nom_dossier_mois(jour), collaborateur=collab.cle, documents_analyses=analyse.documents,
                      sauvegarde=str(sauvegarde))
    _remplir_rapport_champs(rapport, analyse.champs)
    resultat = Resultat(rapport=rapport, destinataire=collab.email, prenom=collab.prenom, date_seance=jour)
    journaliser(racine, f"Début du traitement {collab.cle} – séance du {jj_mm_aaaa(jour)} – sauvegarde {sauvegarde}")

    try:
        copier_sans_ecraser(analyse.classeur.chemin, cibles["excel"])
        resultat.excel = cibles["excel"]
        rapport.fichier_excel = str(cibles["excel"])
        rapport.modifications_excel = [e.description() for e in ecritures]
        lu = executer_excel(cibles["excel"], ecritures, analyse.classeur.feuilles.fiche, cibles["pdf"])
        rapport.resultats_excel = {k: _affichage(k, v) for k, v in lu.valeurs.items()}
        resultat.controles = controler_fiche(lu, collab, jour, cibles["pdf"])
        resultat.controles += integrite.verifier(analyse.classeur.chemin, cibles["excel"], ecritures)
        for c in resultat.controles:
            (rapport.erreurs if c.statut is Statut.ERREUR else rapport.donnees_a_verifier
             if c.statut is Statut.A_VERIFIER else rapport.donnees_extraites).append(_ligne(c))
        if cibles["pdf"].exists():
            resultat.pdf_fiche = cibles["pdf"]
            rapport.pdf_fiche_salaire = str(cibles["pdf"])
        if any(c.statut is Statut.ERREUR for c in resultat.controles):
            raise TraitementInterrompu(
                "La fiche de salaire ou le contrôle d'intégrité présente une erreur : AGI non généré (voir le rapport)."
            )

        if reglages.maj_classeur_annuel and ecritures_annuel:
            resultat.controles += mettre_a_jour_classeur_annuel(
                analyse.classeur.chemin, sauvegarde / analyse.classeur.chemin.name, ecritures_annuel,
                analyse.classeur.feuilles.fiche, executer_excel, rapport,
            )

        if modele_agi and modele_agi.exists():
            signature = _signature(reglages)
            if agi_formulaire.est_formulaire(modele_agi):
                donnees = donnees_formulaire_agi(lu, collab, jour, reglages, analyse)
                champs_agi = agi_formulaire.remplir_formulaire(modele_agi, cibles["agi"], donnees, signature)
            else:
                valeurs = valeurs_agi(lu, collab, jour, reglages, analyse.classeur)
                champs_agi = agi.remplir(modele_agi, cibles["agi"], valeurs, signature,
                                         gabarit_valide=reglages.agi_gabarit_valide)
            resultat.pdf_agi = cibles["agi"]
            rapport.pdf_agi = str(cibles["agi"])
            for c in champs_agi:
                (rapport.donnees_a_verifier if c.statut is not Statut.VALIDE else rapport.donnees_extraites).append(_ligne(c))
            resultat.controles += champs_agi
        else:
            rapport.erreurs.append({"Champ": "Modèle AGI", "Valeur": "", "Commentaire": "Modèle AGI non sélectionné."})
        journaliser(racine, f"Fin du traitement {collab.cle} : {cibles['pdf'].name}, {cibles['agi'].name}")
    except Exception as exc:
        journaliser(racine, f"Échec du traitement {collab.cle} : {exc}")
        rapport.erreurs.append({"Champ": "Traitement", "Valeur": "", "Commentaire": str(exc)})
        resultat.chemin_rapport = rapport.enregistrer(racine, f"Rapport_{collab.nom}_{collab.prenom}_{periode}")
        raise
    resultat.chemin_rapport = rapport.enregistrer(racine, f"Rapport_{collab.nom}_{collab.prenom}_{periode}")
    return resultat


def mettre_a_jour_classeur_annuel(
    chemin: Path, sauvegarde: Path, ecritures: list[Ecriture], feuille_fiche: str,
    executer_excel, rapport: Rapport,
) -> list[Champ]:
    """Ajoute collaborateur, date et prestation au classeur annuel, puis contrôle son intégrité."""
    executer_excel(chemin, ecritures, feuille_fiche, None)
    rapport.modifications_classeur_annuel = [e.description() for e in ecritures]
    controles = integrite.verifier(sauvegarde, chemin, ecritures)
    for c in controles:
        c.cle = f"annuel_{c.cle}"
        c.libelle = f"Classeur annuel : {c.libelle.lower()}"
        if c.statut is Statut.ERREUR:
            c.commentaire += f" Restaurer si besoin la sauvegarde : {sauvegarde}"
    if any(c.statut is Statut.ERREUR for c in controles):
        raise TraitementInterrompu(
            f"Le contrôle du classeur annuel a échoué : restaurer la sauvegarde {sauvegarde} (voir le rapport)."
        )
    return controles


def donnees_formulaire_agi(lu: ResultatExcel, collab: Collaborateur, jour: date, reglages: Reglages,
                           analyse: "Analyse") -> dict:
    """Données de l'AGI officiel remplissable, au format des AGI de l'association (aucun calcul)."""
    v = lu.valeurs
    champ = {c.cle: c.valeur for c in analyse.champs}
    taux_lpp = v.get("D33")
    lpp = isinstance(taux_lpp, float) and taux_lpp > 0
    classeur = analyse.classeur
    lieu = reglages.agi_lieu or analyse.fiche.club.title()
    adresse_club = list(classeur.adresse_club[1:]) if classeur.adresse_club else []
    premiere = classeur.raison_sociale
    if adresse_club and adresse_club[0].lower().startswith("c/o"):
        premiere = f"{premiere} {adresse_club.pop(0)}"
    return {
        "nom_prenom": f"{collab.nom} {collab.prenom}",
        "no_avs": collab.no_avs,
        "adresse": ", ".join(x for x in (collab.npa_localite, collab.adresse) if x),
        "date_naissance": jj_mm_aaaa(collab.date_naissance),
        "etat_civil": champ.get("etat_civil", ""),
        "mois": MOIS[jour.month - 1],
        "annee": str(jour.year),
        "activite": champ.get("activite_agi") or reglages.agi_activite,
        "calendrier": jour.day,
        "heures": "8",
        "salaire_contractuel": formater_nombre_fr(v.get("F27")),
        "salaire_base": formater_nombre_fr(v.get("F25")),
        "vacances_taux": formater_pourcentage_fr(v.get("D26")),
        "vacances_montant": formater_nombre_fr(v.get("F26")),
        "lpp": "/0" if lpp else "/1",
        "assureur_lpp": reglages.agi_assureur_lpp if lpp else "",
        "caisse_avs": reglages.agi_caisse_avs,
        "lieu_date": f"{lieu}, le {jj_mm_aaaa(date.today())}" if lieu else "",
        "telephone": reglages.agi_telephone_club,
        "adresse_employeur": [premiere, *adresse_club] if premiere else [],
    }


def controler_fiche(lu: ResultatExcel, collab: Collaborateur, jour: date, pdf: Path) -> list[Champ]:
    """Contrôles après calcul : message D8 vide, nom et date affichés, PDF d'une page."""
    s = "Fiche de salaire (Excel)"
    controles = [
        Champ("controle_d8", "Contrôle du classeur (D8)", lu.controle_d8 or "(vide)", s,
              Statut.VALIDE if not lu.controle_d8 else Statut.ERREUR, lu.controle_d8, True, modifiable=False),
        Champ("nom_fiche", "Nom sur la fiche (E13)", lu.nom_e13, s,
              Statut.VALIDE if normaliser(lu.nom_e13) == normaliser(collab.cle) else Statut.ERREUR, "", True, modifiable=False),
        Champ("titre_fiche", "Séance sur la fiche (C21)", lu.titre_c21, s,
              Statut.VALIDE if jj_mm_aaaa(jour) in lu.titre_c21 else Statut.ERREUR, "", True, modifiable=False),
    ]
    for cle, libelle in (("F27", "Salaire brut (F27)"), ("F39", "Salaire net (F39)"), ("F44", "Total versé (F44)")):
        valeur = lu.valeurs.get(cle)
        ok = isinstance(valeur, float)
        controles.append(Champ(cle, libelle, formater_chf(valeur), s, Statut.VALIDE if ok else Statut.ERREUR,
                               "" if ok else "Montant non numérique.", True, modifiable=False))
    pages = 0
    if pdf.exists():
        try:
            pages = len(PdfReader(str(pdf)).pages)
        except Exception:
            pages = 0
    controles.append(Champ("pdf_fiche", "PDF de la fiche de salaire", pdf.name, s,
                           Statut.VALIDE if pages == 1 else (Statut.A_VERIFIER if pages else Statut.ERREUR),
                           "" if pages == 1 else (f"{pages} pages" if pages else "PDF non créé."), True, modifiable=False))
    return controles


def valeurs_agi(lu: ResultatExcel, collab: Collaborateur, jour: date, reglages: Reglages, classeur: Classeur) -> dict:
    """Valeurs de l'AGI reprises telles quelles de la fiche calculée par Excel (aucun calcul)."""
    v = lu.valeurs
    soumis = str(v.get("I17", "")).strip() == "oui"
    taux_lpp = v.get("D33")
    lpp = isinstance(taux_lpp, float) and taux_lpp > 0
    valeurs: dict[str, object] = {
        "nom_prenom": f"{collab.nom} {collab.prenom}",
        "no_avs": collab.no_avs,
        "adresse": ", ".join(x for x in (collab.adresse, collab.npa_localite) if x),
        "date_naissance": jj_mm_aaaa(collab.date_naissance, "/"),
        "etat_civil": True,
        "mois_annee": f"{jour.month:02d}/{jour.year}",
        "activite": reglages.agi_activite,
        "calendrier_consigne": True,
        "calendrier": jour.day,
        "heures": "8",
        "salaire_contractuel": formater_nombre(v.get("F27")),
        "salaire_brut": formater_nombre(v.get("F27")),
        "note_point_10": True,
        "note_cotisation": True if soumis else False,
        "salaire_base_case": True,
        "salaire_base": formater_nombre(v.get("F25")),
        "vacances_case": True,
        "vacances_taux": formater_pourcentage(v.get("D26")),
        "vacances_montant": formater_nombre(v.get("F26")),
        "lpp_consigne": True,
        "lpp_oui": lpp,
        "lpp_non": not lpp,
        "assureur_lpp": reglages.agi_assureur_lpp if lpp else "",
        "caisse_avs": reglages.agi_caisse_avs,
        "lieu_date": f"{reglages.agi_lieu}, {jj_mm_aaaa(date.today(), '/')}" if reglages.agi_lieu else "",
        "telephone_club": reglages.agi_telephone_club,
        "adresse_club": [classeur.raison_sociale, *classeur.adresse_club[1:]] if classeur.adresse_club else [],
        "signature": True,
    }
    if reglages.agi_contrat_ecrit in ("oui", "non"):
        valeurs["contrat_ecrit_consigne"] = True
        valeurs[f"contrat_ecrit_{reglages.agi_contrat_ecrit}"] = True
    if not lpp:
        # Pas de LPP : la consigne « assureur LPP » est sans objet.
        valeurs["assureur_lpp"] = ""
    return valeurs


def _signature(reglages: Reglages) -> Path | None:
    if reglages.signature_methode in ("image", "dessin") and reglages.signature_image:
        chemin = Path(reglages.signature_image)
        return chemin if chemin.exists() else None
    return None


def preparer_email(resultat: Resultat, reglages: Reglages, joindre_agi: bool = True) -> str:
    """Ouvre un brouillon Outlook dans Chrome (jamais envoyé) et montre les pièces jointes."""
    if not resultat.destinataire:
        raise TraitementInterrompu("Adresse e-mail du collaborateur manquante.")
    pieces = [p for p in (resultat.pdf_fiche, resultat.pdf_agi if joindre_agi else None) if p]
    jour = resultat.date_seance
    objet = reglages.email_objet.format(mois=nom_dossier_mois(jour) if jour else "")
    texte = reglages.email_texte.format(
        prenom=resultat.prenom, date_seance=jj_mm_aaaa(jour),
        agi_phrase=" ainsi que l’attestation de gain intermédiaire" if joindre_agi and resultat.pdf_agi else "",
        mois=nom_dossier_mois(jour) if jour else "",
    )
    url = courriel.url_brouillon(reglages.outlook_adresse, resultat.destinataire, objet, texte)
    courriel.ouvrir_dans_chrome(url)
    courriel.montrer_dans_finder(pieces)
    resultat.rapport.email = (
        f"{courriel.STATUT_PREPARE} Destinataire : {resultat.destinataire}. Objet : {objet}. "
        f"Pièces à joindre : {', '.join(p.name for p in pieces)}"
    )
    if resultat.chemin_rapport:
        racine = resultat.chemin_rapport.parent.parent
        resultat.chemin_rapport = resultat.rapport.enregistrer(racine, resultat.chemin_rapport.stem + "_email")
    journaliser(resultat.chemin_rapport.parent.parent if resultat.chemin_rapport else Path("."),
                f"E-mail préparé pour {resultat.destinataire} (non envoyé)")
    return courriel.STATUT_PREPARE


def _affichage(cle: str, valeur: object) -> str:
    if isinstance(valeur, float):
        return f"{valeur:.4f}".rstrip("0").rstrip(".") if cle.startswith("D") else formater_chf(valeur)
    if isinstance(valeur, date):
        return jj_mm_aaaa(valeur)
    return str(valeur)


def _ligne(c: Champ) -> dict:
    return {"Champ": c.libelle, "Valeur": c.valeur, "Source": c.source, "Statut": c.statut.value, "Commentaire": c.commentaire}


def _remplir_rapport_champs(rapport: Rapport, champs: list[Champ]) -> None:
    for c in champs:
        cible = {Statut.VALIDE: rapport.donnees_extraites, Statut.A_VERIFIER: rapport.donnees_a_verifier,
                 Statut.ERREUR: rapport.erreurs}[c.statut]
        cible.append(_ligne(c))
