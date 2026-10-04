import hashlib
from pathlib import Path

import pytest

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
    assert not (dossier_principal / "Fiches de salaire" / "octobre 2026" / "Fiche_salaire_EXEMPLE_Camille_2026-10.xlsx").exists()


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
    assert res.excel.name == "Fiche_salaire_EXEMPLE_Camille_2026-10.xlsx"
    assert res.pdf_fiche.exists() and res.pdf_agi.exists() and res.chemin_rapport.exists()
    assert res.pdf_agi.parent == dossier_principal / "AGI" / "octobre 2026"
    # Aucun fichier existant n'a été modifié ou supprimé.
    apres = _empreintes(dossier_principal)
    assert all(apres.get(p) == h for p, h in originaux.items())
    assert any(p.parent.parent.name == "Sauvegardes" for p in apres)

    # Doublon : version alternative, jamais d'écrasement.
    a = analyser(reglages, presence(dossier_principal), 0)
    res2 = generer(a, reglages, lambda *_: True, lambda p: True, executer_excel=substitut_excel.executer)
    assert res2.excel.name == "Fiche_salaire_EXEMPLE_Camille_2026-10_v2.xlsx"
    assert res.excel.exists()
