"""Construction du tableau de validation (Validé / À vérifier / Erreur)."""

from __future__ import annotations

import difflib
import re
from datetime import date

from .classeur import Classeur
from .controles import avs_valide, email_valide, formater_avs, iban_valide, normaliser
from .dates_fr import jj_mm_aaaa, lire_date
from .modeles import Champ, Collaborateur, FichePresence, Intervenant, PlanningClub, Statut

S_PRESENCE = "Fiche de présence"
S_PLANNING = "Planning PDF"
S_CLASSEUR = "Classeur Excel"
S_SAISIE = "Saisie manuelle"


def statut_ok(condition: bool, sinon: Statut = Statut.ERREUR) -> Statut:
    return Statut.VALIDE if condition else sinon


def champs_seance(
    fiche: FichePresence,
    planning: PlanningClub | None,
    numero_fichier: int | None,
    classeur: Classeur | None,
    nb_classeurs: int,
    intervenant: Intervenant,
) -> list[Champ]:
    c: list[Champ] = []
    c.append(Champ("club", "Club", fiche.club, S_PRESENCE,
                   statut_ok(planning is not None), "" if planning else "Club absent du planning.", True, modifiable=False))
    jour = fiche.date_seance
    dans_planning = bool(planning and jour in planning.dates)
    c.append(Champ("date_seance", "Date de la séance", jj_mm_aaaa(jour), S_PRESENCE,
                   statut_ok(jour is not None and dans_planning),
                   "" if dans_planning else "Date absente du planning du club.", True))
    numero = planning.numero_seance(jour) if planning and jour else None
    if numero and numero_fichier and numero != numero_fichier:
        st, com = Statut.A_VERIFIER, f"Le nom du fichier indique la séance {numero_fichier}."
    else:
        st, com = statut_ok(numero is not None), ""
    if planning and len(planning.dates) != 9:
        st, com = Statut.A_VERIFIER, f"Le planning du club compte {len(planning.dates)} dates au lieu de 9."
    c.append(Champ("numero_seance", "N° de séance (saison)", str(numero or ""), S_PLANNING, st, com, True))
    c.append(Champ("programme", "Programme", fiche.programme, S_PRESENCE, Statut.VALIDE, modifiable=False))

    if classeur is None:
        c.append(Champ("classeur", "Classeur Excel (année civile)", "", S_CLASSEUR, Statut.ERREUR,
                       f"Aucun classeur pour l'année {jour.year if jour else '?'} : sélectionner le fichier.", True, modifiable=False))
    else:
        st = Statut.A_VERIFIER if nb_classeurs > 1 else Statut.VALIDE
        com = "Plusieurs classeurs pour cette année : vérifier la sélection." if nb_classeurs > 1 else ""
        if classeur.anomalies:
            st, com = Statut.A_VERIFIER, " ".join(classeur.anomalies)
        c.append(Champ("classeur", "Classeur Excel (année civile)", classeur.chemin.name, S_CLASSEUR, st, com, True, modifiable=False))
        if numero and jour:
            ligne = Classeur.ligne_configuration(numero)
            actuelle = classeur.seances.get(ligne)
            libelle = classeur.libelles_seances.get(ligne, "")
            if actuelle is None:
                st, com = Statut.A_VERIFIER, "Date absente : elle sera inscrite dans la copie de travail (confirmation demandée)."
            elif actuelle == jour:
                st, com = Statut.VALIDE, ""
            else:
                st, com = Statut.ERREUR, f"La cellule contient déjà le {jj_mm_aaaa(actuelle)}."
            if f"seance {numero}," not in normaliser(libelle) + ",":
                st = Statut.ERREUR if st is Statut.ERREUR else Statut.A_VERIFIER
                com = (com + f" Libellé de la ligne : « {libelle} ».").strip()
            c.append(Champ("ligne_configuration", "Emplacement de la séance", f"Configuration!B{ligne} — {libelle}",
                           S_CLASSEUR, st, com, True, modifiable=False))

    tarifs = classeur.tarifs if classeur else {}
    fonction_ok = intervenant.fonction in tarifs or not classeur
    c.append(Champ("fonction", "Fonction", intervenant.fonction, S_PRESENCE, statut_ok(fonction_ok),
                   "" if fonction_ok else "Fonction absente de Configuration (A13:A21).", True))
    if fiche.cachet_artiste and intervenant.fonction == "Artiste" and classeur:
        tarif = tarifs.get("Artiste", (None, None))[1]
        egal = tarif is not None and abs(float(tarif) - float(fiche.cachet_artiste.replace("'", ""))) < 0.005
        c.append(Champ("cachet", "Cachet annoncé (artiste)", f"CHF {fiche.cachet_artiste}", S_PRESENCE,
                       statut_ok(egal, Statut.A_VERIFIER), "" if egal else f"Tarif indépendant du classeur : {tarif}", modifiable=False))
    return c


def correspondances(classeur: Classeur | None, intervenant: Intervenant) -> tuple[list[Collaborateur], list[Collaborateur]]:
    """(correspondances exactes, correspondances approchées)."""
    if classeur is None:
        return [], []
    exactes = classeur.rechercher(nom_complet=intervenant.nom_complet)
    if exactes:
        return exactes, []
    cible = normaliser(intervenant.nom_complet)
    proches = [
        c for c in classeur.collaborateurs
        if difflib.SequenceMatcher(None, cible, normaliser(c.cle)).ratio() >= 0.8
    ]
    return [], proches


def champs_collaborateur(
    intervenant: Intervenant,
    exactes: list[Collaborateur],
    proches: list[Collaborateur],
    choisi: Collaborateur | None,
) -> list[Champ]:
    c: list[Champ] = []
    if choisi is not None:
        st, com = Statut.VALIDE, f"Ligne {choisi.ligne} du classeur."
        if len(exactes) > 1:
            com += " Choix manuel parmi plusieurs correspondances."
    elif len(exactes) > 1:
        lignes = ", ".join(str(x.ligne) for x in exactes)
        st, com = Statut.ERREUR, f"Plusieurs correspondances (lignes {lignes}) : indiquer la ligne à utiliser."
    elif proches:
        lignes = ", ".join(f"{x.ligne}" for x in proches)
        st, com = Statut.A_VERIFIER, f"Aucune correspondance exacte ; correspondance approchée ligne(s) {lignes}. Indiquer la ligne ou laisser vide pour un nouveau collaborateur."
    else:
        st, com = Statut.A_VERIFIER, "Nouveau collaborateur : il sera ajouté dans la copie de travail (confirmation demandée)."
    c.append(Champ("correspondance", "Correspondance dans Collaborateurs", str(choisi.ligne) if choisi else "",
                   S_CLASSEUR, st, com, True))

    if choisi is not None:
        prenom, nom, source_nom, st_nom = choisi.prenom, choisi.nom, S_CLASSEUR, Statut.VALIDE
        com_nom = ""
    else:
        morceaux = intervenant.nom_complet.split()
        prenom, nom = (morceaux[0], " ".join(morceaux[1:])) if len(morceaux) > 1 else ("", intervenant.nom_complet)
        source_nom, st_nom, com_nom = S_PRESENCE, Statut.A_VERIFIER, "Découpage prénom / nom à confirmer."
    c.append(Champ("prenom", "Prénom", prenom, source_nom, st_nom if prenom else Statut.ERREUR, com_nom, True))
    c.append(Champ("nom", "Nom", nom, source_nom, st_nom if nom else Statut.ERREUR, com_nom, True))

    def comparer(cle: str, libelle: str, presence: str, classeur_v: str, obligatoire: bool = False, controle=None) -> None:
        if choisi is None:
            valeur, source = presence, S_PRESENCE
            st = Statut.A_VERIFIER if valeur else (Statut.ERREUR if obligatoire else Statut.A_VERIFIER)
            com = "" if valeur else "Absent de la fiche de présence."
        elif not presence or normaliser(presence) == normaliser(classeur_v):
            valeur, source, st, com = classeur_v, S_CLASSEUR, Statut.VALIDE, ""
            if presence and classeur_v:
                source = f"{S_CLASSEUR} + {S_PRESENCE}"
            if not classeur_v:
                st = Statut.ERREUR if obligatoire else Statut.A_VERIFIER
                com = "Absent du classeur."
        else:
            valeur, source, st = presence, S_PRESENCE, Statut.A_VERIFIER
            com = f"Différent du classeur (« {classeur_v} ») : la valeur retenue mettra à jour la copie de travail."
        if controle and valeur and not controle(valeur):
            st, com = Statut.ERREUR, "Format invalide."
        c.append(Champ(cle, libelle, valeur, source, st, com, obligatoire))

    comparer("adresse", "Adresse", intervenant.adresse, choisi.adresse if choisi else "")
    comparer("npa_localite", "NPA, localité", intervenant.npa_localite, choisi.npa_localite if choisi else "")
    tel_classeur = choisi.telephone if choisi else ""
    tel_presence = intervenant.telephones[0] if intervenant.telephones else ""
    if choisi and any(_chiffres(t) == _chiffres(tel_classeur) for t in intervenant.telephones):
        tel_presence = tel_classeur
    comparer("telephone", "Téléphone", tel_presence, tel_classeur)
    comparer("email", "E-mail", intervenant.email, choisi.email if choisi else "", controle=email_valide)

    def du_classeur(cle: str, libelle: str, valeur: str, controle=None, obligatoire: bool = True,
                    modifiable: bool = True, commentaire_vide: str = "Absent du classeur : à saisir.") -> None:
        if valeur and (controle is None or controle(valeur)):
            st, com = Statut.VALIDE, ""
        elif valeur:
            st, com = Statut.ERREUR, "Format invalide."
        else:
            st, com = (Statut.ERREUR if obligatoire else Statut.A_VERIFIER), commentaire_vide
        c.append(Champ(cle, libelle, valeur, S_CLASSEUR if choisi else S_SAISIE, st, com, obligatoire, modifiable=modifiable))

    statut = choisi.statut if choisi else ""
    du_classeur("statut", "Statut (Salarié / Indépendant)", statut, controle=lambda v: v in ("Salarié", "Indépendant"))
    if statut == "Indépendant":
        c[-1].statut = Statut.ERREUR
        c[-1].commentaire = "Indépendant·e : le classeur ne produit pas de fiche de salaire (contrôle D8)."
    du_classeur("declaration_avs", "Déclaration AVS (oui / non)", choisi.declaration_avs if choisi else "",
                controle=lambda v: v in ("oui", "non"))
    lpp = "" if not choisi or choisi.taux_lpp is None else f"{choisi.taux_lpp:.2%}"
    du_classeur("taux_lpp", "Taux LPP (lu dans Excel)", lpp, obligatoire=False, modifiable=choisi is None,
                commentaire_vide="Taux non renseigné dans le classeur.")
    du_classeur("date_naissance", "Date de naissance", jj_mm_aaaa(choisi.date_naissance) if choisi else "",
                controle=lambda v: lire_date(v) is not None)
    du_classeur("no_avs", "N° AVS", choisi.no_avs if choisi else "", controle=avs_valide)
    du_classeur("iban", "IBAN", choisi.iban if choisi else "", controle=iban_valide)
    return c


def _chiffres(texte: str) -> str:
    """9 derniers chiffres : « 021 946 … », « +41 21 946 … » et « 21 946 … » (0 perdu par Excel) sont égaux."""
    return re.sub(r"\D", "", texte or "")[-9:]


# Contrôles appliqués lorsqu'une valeur est corrigée à la main.
CONTROLES = {
    "date_seance": lambda v: lire_date(v) is not None,
    "numero_seance": lambda v: v.isdigit() and 1 <= int(v) <= 9,
    "correspondance": lambda v: v == "" or v.isdigit(),
    "prenom": bool,
    "nom": bool,
    "email": email_valide,
    "statut": lambda v: v == "Salarié",
    "declaration_avs": lambda v: v in ("oui", "non"),
    "date_naissance": lambda v: lire_date(v) is not None,
    "no_avs": avs_valide,
    "iban": iban_valide,
    "taux_lpp": lambda v: re.fullmatch(r"\d+(?:[.,]\d+)?\s*%?", v) is not None,
}


def revalider(champ: Champ) -> None:
    """Après une correction manuelle : contrôle du format, puis statut Validé ou Erreur."""
    if not champ.valeur_corrigee.strip():
        return
    if champ.cle == "no_avs":
        champ.valeur_corrigee = formater_avs(champ.valeur_corrigee)
    if champ.cle == "iban":
        champ.valeur_corrigee = re.sub(r"\s+", " ", champ.valeur_corrigee.strip().upper())
    controle = CONTROLES.get(champ.cle)
    if controle is None or controle(champ.valeur_corrigee.strip()):
        champ.statut = Statut.VALIDE
        champ.commentaire = "Corrigé manuellement."
    else:
        champ.statut = Statut.ERREUR
        champ.commentaire = "Correction invalide (format)."


def bloquants(champs: list[Champ]) -> list[Champ]:
    return [c for c in champs if c.bloquant]


def collaborateur_depuis(champs: list[Champ], ligne: int | None) -> Collaborateur:
    v = {c.cle: c.valeur for c in champs}
    taux = v.get("taux_lpp", "").replace("%", "").replace(",", ".").strip()
    return Collaborateur(
        ligne=ligne,
        prenom=v.get("prenom", ""), nom=v.get("nom", ""),
        adresse=v.get("adresse", ""), npa_localite=v.get("npa_localite", ""),
        email=v.get("email", ""), telephone=v.get("telephone", ""),
        statut=v.get("statut", ""),
        # Le taux n'est transmis que pour un nouveau collaborateur (jamais modifié s'il existe déjà).
        taux_lpp=(float(taux) / 100 if taux else None) if ligne is None else None,
        declaration_avs=v.get("declaration_avs", ""),
        date_naissance=lire_date(v.get("date_naissance", "")),
        no_avs=v.get("no_avs", ""), iban=v.get("iban", ""),
    )


def date_seance(champs: list[Champ]) -> date | None:
    return lire_date(next((c.valeur for c in champs if c.cle == "date_seance"), ""))
