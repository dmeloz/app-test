from datetime import date

from lanterne_paie.planning import lire_planning
from lanterne_paie.presence import lire_presence

from .conftest import creer_planning, creer_presence


def test_planning(tmp_path):
    clubs = lire_planning(creer_planning(tmp_path / "p.pdf"))
    assert set(clubs) == {"testville", "autre ville"}
    t = clubs["testville"]
    assert t.cinema == "Cinéma Test"
    assert len(t.dates) == 9 and t.dates[0] == date(2026, 10, 3) and t.dates[-1] == date(2027, 6, 19)
    assert t.numero_seance(date(2026, 11, 28)) == 3
    assert t.numero_seance(date(2026, 11, 29)) is None


def test_presence(tmp_path):
    f = lire_presence(creer_presence(tmp_path / "f.pdf"))
    assert f.club == "TESTVILLE"
    assert f.date_seance == date(2026, 10, 3) and f.heure == "10:30"
    assert f.programme == "Film fictif" and f.cinema == "Cinéma Test"
    assert [p.fonction for p in f.intervenants] == ["Savant·e", "Naïf·ve", "Artiste"]
    c = f.intervenants[0]
    assert (c.nom_complet, c.adresse, c.npa_localite) == ("Camille Exemple", "Rue Fictive 1", "1000 Lausanne")
    assert c.telephones == ["021 000 00 01"] and c.email == "camille@example.org"
    assert f.intervenants[2].telephones == ["078 000 00 05", "021 000 00 06"]
    assert f.cachet_artiste == "319"


def test_pdf_scanne_refuse(tmp_path):
    import pytest
    from reportlab.pdfgen import canvas

    from lanterne_paie.pdf_texte import PdfNonPrisEnCharge

    chemin = tmp_path / "scan.pdf"
    c = canvas.Canvas(str(chemin))
    c.rect(10, 10, 100, 100, fill=1)  # aucune couche texte
    c.save()
    with pytest.raises(PdfNonPrisEnCharge):
        lire_presence(chemin)
