import shutil
import warnings

from openpyxl import load_workbook
from pypdf import PdfReader

from lanterne_paie import agi
from lanterne_paie.integrite import verifier
from lanterne_paie.modeles import Statut
from lanterne_paie.plan_excel import Ecriture

from .conftest import CLASSEUR_FICTIF, creer_modele_agi


def texte(chemin):
    return PdfReader(str(chemin)).pages[0].extract_text()


def test_agi_remplace_les_consignes(tmp_path):
    modele = creer_modele_agi(tmp_path / "modele.pdf")
    sortie = tmp_path / "AGI.pdf"
    champs = agi.remplir(modele, sortie, {
        "nom_prenom": "EXEMPLE Camille", "no_avs": "756.0000.0000.02", "date_naissance": "02/01/1990",
        "mois_annee": "10/2026", "calendrier_consigne": True, "calendrier": 3, "heures": "8",
        "salaire_contractuel": "355.00", "lieu_date": "Testville, 04/10/2026",
        "adresse": "",  # valeur absente : la consigne reste
    })
    t = texte(sortie)
    assert "EXEMPLE Camille" in t and "756.0000.0000.02" in t and "Testville, 04/10/2026" in t
    assert "Nom et prénom du travailleur" not in t and "XXX.–" not in t and "Indiquer «8»" not in t
    assert "Nom et prénom" in t  # le formulaire officiel est intact
    assert "Adresse du travailleur" in t
    statut = {c.cle: c for c in champs}
    assert statut["adresse"].statut is Statut.A_VERIFIER
    assert statut["nom_prenom"].statut is Statut.A_VERIFIER  # gabarit pas encore validé par Sarah
    assert "X" in t  # réponse pré-remplie conservée
    assert texte(modele).count("Nom et prénom du travailleur") == 1  # modèle non modifié


def test_agi_zone_introuvable_non_inventee(tmp_path):
    modele = creer_modele_agi(tmp_path / "modele.pdf")
    champs = agi.remplir(modele, tmp_path / "AGI.pdf", {"caisse_avs": "Caisse X", "telephone_club": "000"},
                         gabarit_valide=True)
    for c in (c for c in champs if c.cle in ("caisse_avs", "telephone_club")):
        assert c.statut is Statut.A_VERIFIER and "non identifiable" in c.commentaire
    assert "Caisse X" not in texte(tmp_path / "AGI.pdf")


def test_agi_gabarit_valide(tmp_path):
    modele = creer_modele_agi(tmp_path / "modele.pdf")
    champs = agi.remplir(modele, tmp_path / "AGI.pdf", {"nom_prenom": "EXEMPLE Camille"}, gabarit_valide=True)
    assert champs[0].statut is Statut.VALIDE


def test_integrite_detecte_formule_modifiee(tmp_path):
    copie = tmp_path / "copie.xlsx"
    shutil.copy2(CLASSEUR_FICTIF, copie)
    assert all(c.statut is Statut.VALIDE for c in verifier(CLASSEUR_FICTIF, copie, []))
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        wb = load_workbook(copie)
    wb.worksheets[4]["F44"] = 999  # formule remplacée par une valeur
    wb.worksheets[2]["A6"] = "Autre"  # saisie non prévue
    wb.save(copie)
    resultat = {c.cle: c for c in verifier(CLASSEUR_FICTIF, copie, [])}
    assert resultat["integrite_formules"].statut is Statut.ERREUR and "F44" in resultat["integrite_formules"].commentaire
    assert resultat["integrite_saisies"].statut is Statut.ERREUR
    prevue = [Ecriture(wb.worksheets[2].title, "A6", "Autre", "")]
    assert {c.cle: c for c in verifier(CLASSEUR_FICTIF, copie, prevue)}["integrite_saisies"].statut is Statut.VALIDE
