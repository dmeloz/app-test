from datetime import date, datetime

from lanterne_paie.fichiers import (
    detecter_classeurs, detecter_fiches_presence, detecter_modele_agi, detecter_planning, nom_agi, nom_fiche,
    sauvegarder, suffixe_periode, version_disponible,
)
from lanterne_paie.journal import Rapport, journaliser
from lanterne_paie.reglages import Reglages


def test_noms():
    assert nom_fiche("Dupré", "Zoé", "2026-10", "pdf") == "Fiche_salaire_DUPRE_Zoe_2026-10.pdf"
    assert nom_agi("de la Tour", "Jean-Marc", "2026-11-07") == "AGI_DE-LA-TOUR_Jean-Marc_2026-11-07.pdf"
    assert suffixe_periode(date(2026, 11, 7), False) == "2026-11"
    assert suffixe_periode(date(2026, 11, 7), True) == "2026-11-07"


def test_versions_et_sauvegarde(tmp_path):
    f = tmp_path / "a.pdf"
    assert version_disponible(f) == f
    f.write_text("1")
    (tmp_path / "a_v2.pdf").write_text("2")
    assert version_disponible(f).name == "a_v3.pdf"
    moment = datetime(2026, 10, 4, 9, 30, 0)
    s1 = sauvegarder(tmp_path, [f], moment)
    s2 = sauvegarder(tmp_path, [f], moment)  # même seconde : nouveau dossier, rien n'est écrasé
    assert s1 != s2 and (s1 / "a.pdf").read_text() == "1" and (s2 / "a.pdf").exists()
    assert f.exists()  # l'original n'est jamais supprimé


def test_detection(dossier_principal):
    assert list(detecter_classeurs(dossier_principal)) == [2026]
    assert len(detecter_planning(dossier_principal)) == 1
    assert len(detecter_modele_agi(dossier_principal)) == 1
    assert len(detecter_fiches_presence(dossier_principal / "Fiches de salaire" / "octobre 2026")) == 1


def test_rapport_et_journal(tmp_path):
    r = Rapport(mois="octobre 2026", collaborateur="Camille <Exemple>")
    r.erreurs.append({"Champ": "N° AVS", "Commentaire": "Format invalide."})
    chemin = r.enregistrer(tmp_path, "Rapport_test")
    html = chemin.read_text(encoding="utf-8")
    assert "Camille &lt;Exemple&gt;" in html and "Format invalide." in html
    assert chemin.with_suffix(".json").exists()
    assert r.enregistrer(tmp_path, "Rapport_test").name == "Rapport_test_v2.html"
    journaliser(tmp_path, "essai")
    assert "essai" in (tmp_path / "Rapports" / "journal.log").read_text(encoding="utf-8")


def test_reglages_aller_retour(tmp_path):
    r = Reglages(dossier_principal="/x", classeurs={"2026": "/x/a.xlsx"}, agi_lieu="Testville")
    r.enregistrer(tmp_path / "r.json")
    assert Reglages.charger(tmp_path / "r.json") == r
