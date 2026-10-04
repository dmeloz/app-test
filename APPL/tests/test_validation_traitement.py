import hashlib
from datetime import date
from pathlib import Path

import pytest

from lanterne_paie.classeur import lire_classeur
from lanterne_paie.modeles import Statut
from lanterne_paie.traitement import TraitementInterrompu, analyser, generer
from lanterne_paie.validation import bloquants, revalider


def presence(dossier: Path) -> Path:
    return dossier / "Fiches de salaire" / "octobre 2026" / "Testville_1 Fiche de présence.pdf"


def statuts(analyse):
    return {c.cle: c.statut for c in analyse.champs}


def test_analyse_collaborateur_connu(reglages, dossier_principal):
    a = analyser(reglages, presence(dossier_principal), 0)
    s = statuts(a)
    assert s["club"] is s["date_seance"] is s["numero_seance"] is Statut.VALIDE
    assert s["ligne_configuration"] is Statut.A_VERIFIER  # B30 vide : sera renseignée avec confirmation
    assert s["correspondance"] is Statut.VALIDE and s["no_avs"] is Statut.VALIDE and s["iban"] is Statut.VALIDE
    assert a.numero_seance == 1
    assert bloquants(a.champs) == []


def test_homonymes_bloquent_puis_choix_manuel(reglages, dossier_principal):
    a = analyser(reglages, presence(dossier_principal), 1)
    assert statuts(a)["correspondance"] is Statut.ERREUR
    assert "correspondance" in [c.cle for c in bloquants(a.champs)]
    a = analyser(reglages, presence(dossier_principal), 1, ligne_choisie=8)
    assert statuts(a)["correspondance"] is Statut.VALIDE
    assert next(c for c in a.champs if c.cle == "declaration_avs").valeur == "non"


def test_nouveau_collaborateur_et_corrections(reglages, dossier_principal):
    a = analyser(reglages, presence(dossier_principal), 2)
    s = statuts(a)
    assert s["correspondance"] is Statut.A_VERIFIER
    assert {c.cle for c in bloquants(a.champs)} == {"statut", "declaration_avs", "date_naissance", "no_avs", "iban"}
    champs = {c.cle: c for c in a.champs}
    champs["no_avs"].valeur_corrigee = "7569217076984"
    revalider(champs["no_avs"])
    assert champs["no_avs"].statut is Statut.ERREUR  # chiffre de contrôle faux
    for cle, valeur in (("no_avs", "7569217076985"), ("statut", "Salarié"), ("declaration_avs", "oui"),
                        ("date_naissance", "01.02.1990"), ("iban", "ch93 0076 2011 6238 5295 7")):
        champs[cle].valeur_corrigee = valeur
        revalider(champs[cle])
    assert champs["no_avs"].valeur == "756.9217.0769.85"
    assert champs["iban"].valeur == "CH93 0076 2011 6238 5295 7"
    assert bloquants(a.champs) == []


def test_generation_bloquee_si_erreur(reglages, dossier_principal):
    a = analyser(reglages, presence(dossier_principal), 1)
    with pytest.raises(TraitementInterrompu, match="bloquée"):
        generer(a, reglages, lambda *_: True, lambda *_: True, executer_excel=lambda *a: None)


def test_generation_annulee_sans_confirmation(reglages, dossier_principal):
    a = analyser(reglages, presence(dossier_principal), 0)
    with pytest.raises(TraitementInterrompu, match="non confirmées"):
        generer(a, reglages, lambda *_: False, lambda *_: True, executer_excel=lambda *a: None)
    assert not list(dossier_principal.rglob("Fiche_salaire_*"))
    assert not (dossier_principal / "Sauvegardes").exists()  # rien n'a été touché


def _empreintes(dossier: Path) -> dict:
    return {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in dossier.rglob("*") if p.is_file()}


def test_generation_complete_libreoffice(reglages, dossier_principal):
    """Chaîne complète avec LibreOffice à la place d'Excel (formules réelles du classeur)."""
    from .outils import substitut_excel

    if not substitut_excel.disponible():
        pytest.skip("LibreOffice Calc (python3-uno) indisponible")
    originaux = _empreintes(dossier_principal)
    a = analyser(reglages, presence(dossier_principal), 0)
    confirmations = []
    res = generer(a, reglages, lambda t, l: confirmations.append(l) or True, lambda p: True,
                  executer_excel=substitut_excel.executer)
    assert any("B30" in l for l in confirmations[0])
    c = {x.cle: x for x in res.controles}
    for cle in ("controle_d8", "nom_fiche", "titre_fiche", "F27", "F39", "F44", "pdf_fiche",
                "integrite_onglets", "integrite_formules", "integrite_saisies", "integrite_extensions"):
        assert c[cle].statut is Statut.VALIDE, (cle, c[cle].commentaire)
    v = res.rapport.resultats_excel
    assert v["F27"] == "CHF 355.00"  # tarif Savant·e salarié lu par Excel, jamais recalculé ici
    annuel = Path(reglages.classeurs["2026"])
    assert res.excel == annuel  # le fichier Excel lui-même est rempli…
    assert not list(dossier_principal.rglob("Fiche_salaire_*.xlsx"))  # …sans créer d'autre fichier Excel
    assert res.pdf_fiche.name == "Fiche_salaire_EXEMPLE_Camille_2026-10.pdf"
    assert res.pdf_fiche.exists() and res.pdf_agi.exists() and res.chemin_rapport.exists()
    assert res.pdf_agi.parent == dossier_principal / "AGI" / "octobre 2026"
    # Seul le fichier Excel est modifié ; sa sauvegarde est l'original exact.
    apres = _empreintes(dossier_principal)
    assert all(apres.get(p) == h for p, h in originaux.items() if p != annuel)
    assert apres[annuel] != originaux[annuel]
    sauvegarde = Path(res.rapport.sauvegarde) / annuel.name
    assert _empreintes(sauvegarde.parent)[sauvegarde] == originaux[annuel]
    relu = lire_classeur(annuel)
    assert relu.seances[30] == date(2026, 10, 3)
    assert [p.collaborateur for p in relu.prestations[30]] == ["Camille Exemple"]

    # Seconde génération : PDF en version alternative (jamais d'écrasement), aucun doublon dans Excel.
    a = analyser(reglages, presence(dossier_principal), 0)
    res2 = generer(a, reglages, lambda *_: True, lambda p: True, executer_excel=substitut_excel.executer)
    assert res2.pdf_fiche.name == "Fiche_salaire_EXEMPLE_Camille_2026-10_v2.pdf"
    assert res.pdf_fiche.exists()
    assert [p.collaborateur for p in lire_classeur(annuel).prestations[30]] == ["Camille Exemple"]


def test_generation_avec_formulaire_officiel(reglages, dossier_principal):
    from lanterne_paie.agi_formulaire import valeurs_remplies

    from .conftest import creer_formulaire_agi
    from .outils import substitut_excel

    if not substitut_excel.disponible():
        pytest.skip("LibreOffice Calc (python3-uno) indisponible")
    reglages.modele_agi = str(creer_formulaire_agi(dossier_principal / "Modèles" / "AGI formulaire.pdf"))
    originaux = _empreintes(dossier_principal)
    a = analyser(reglages, presence(dossier_principal), 0)
    activite = next(c for c in a.champs if c.cle == "activite_agi")
    activite.valeur_corrigee = "Animatrice"
    res = generer(a, reglages, lambda *_: True, lambda p: True, executer_excel=substitut_excel.executer)
    v = valeurs_remplies(res.pdf_agi)
    assert v["Nom_et_prénom"] == "Exemple Camille"
    assert v["NPA_localité_rue"] == "1000 Lausanne, Rue Fictive 1"
    assert (v["mois"], v["année"], v["1_3"]) == ("octobre", "2026", "8")
    assert v["Activité_exercée"] == "Animatrice"
    assert v["8_salaire_contractuel_cotisation_AVS_par_mois"] == "355,00"  # lu dans Excel (F27)
    assert v["10_Indemnité_vacances_%"] == "10,64"
    assert v["12_cotisations_LPP"] == "/1"
    assert v["13_Caisse_de_compensation_AVS"] == "Caisse Cantonale Vaudoise de Compensation"
    assert v["Lieu_date"].startswith("Testville, le ")
    assert v["n_de_téléphone"] == "076 000 00 09"  # ligne « Comptabilité » de la fiche de présence
    apres = _empreintes(dossier_principal)
    annuel = Path(reglages.classeurs["2026"])
    assert all(apres.get(p) == h for p, h in originaux.items() if p != annuel)


def test_modele_integre_par_defaut(reglages, dossier_principal):
    from lanterne_paie.agi_formulaire import valeurs_remplies

    from .outils import substitut_excel

    if not substitut_excel.disponible():
        pytest.skip("LibreOffice Calc (python3-uno) indisponible")
    reglages.modele_agi = ""  # aucun modèle choisi : formulaire officiel intégré
    a = analyser(reglages, presence(dossier_principal), 0)
    res = generer(a, reglages, lambda *_: True, lambda p: True, executer_excel=substitut_excel.executer)
    v = valeurs_remplies(res.pdf_agi)
    assert v["Nom_et_prénom"] == "Exemple Camille" and v["1_3"] == "8"
