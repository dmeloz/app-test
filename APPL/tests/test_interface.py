import pytest


@pytest.fixture
def app(monkeypatch, tmp_path):
    monkeypatch.setenv("QT_QPA_PLATFORM", "offscreen")
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path / "config"))
    try:
        from PySide6.QtWidgets import QApplication
    except ImportError as exc:  # bibliothèques graphiques absentes
        pytest.skip(str(exc))
    return QApplication.instance() or QApplication([])


def test_fenetre_analyse(app, reglages):
    from lanterne_paie.ui.fenetre import COLONNES, Fenetre

    f = Fenetre(reglages)
    assert [f.table.horizontalHeaderItem(i).text() for i in range(6)] == COLONNES
    textes = [b.text() for b in (f.b_analyser, f.b_generer, f.b_email, f.b_dossier, f.b_rapport)]
    assert textes == ["Analyser", "Générer", "Préparer l’e-mail", "Ouvrir le dossier", "Afficher le rapport"]
    index = f.cb_mois.findText("octobre 2026")
    f.cb_mois.setCurrentIndex(index)
    assert f.cb_presence.count() == 1 and f.cb_collab.count() == 3
    f.cb_collab.setCurrentIndex(0)
    f.lancer_analyse()
    assert f.table.rowCount() == len(f.analyse.champs)
    assert f.b_generer.isEnabled()
    # Correction invalide => Erreur => Générer désactivé.
    ligne = next(i for i, c in enumerate(f.analyse.champs) if c.cle == "no_avs")
    f.table.item(ligne, 4).setText("756.1234.5678.00")
    assert f.analyse.champs[ligne].statut.value == "Erreur"
    assert not f.b_generer.isEnabled()
    f.close()
