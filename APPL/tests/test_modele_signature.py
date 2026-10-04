import pypdf
from pypdf.generic import ContentStream

from lanterne_paie.agi_formulaire import (
    MODELE_VIERGE, creer_modele_vierge, est_formulaire, extraire_signature, remplir_formulaire, valeurs_remplies,
)
from lanterne_paie.presence import lire_presence

from .conftest import creer_formulaire_agi, creer_presence


def operations(chemin, page=0):
    lecteur = pypdf.PdfReader(str(chemin))
    return [op for _, op in ContentStream(lecteur.pages[page].get_contents(), lecteur).operations]


def test_modele_integre_vierge():
    assert MODELE_VIERGE.exists() and est_formulaire(MODELE_VIERGE)
    valeurs = valeurs_remplies(MODELE_VIERGE)
    assert len(valeurs) >= 100
    assert all(v in ("", "/Off", "None") for v in valeurs.values())
    lecteur = pypdf.PdfReader(str(MODELE_VIERGE))
    assert all(a.get_object().get("/Subtype") == "/Widget" for p in lecteur.pages for a in (p.get("/Annots") or []))
    assert "/Metadata" not in lecteur.trailer["/Root"]


def test_creer_modele_vierge(tmp_path):
    vierge = creer_modele_vierge(creer_formulaire_agi(tmp_path / "f.pdf"), tmp_path / "vierge.pdf")
    v = valeurs_remplies(vierge)
    assert v["Nom_et_prénom"] == "" and v["1_15"] == ""
    assert b"c" not in operations(vierge)  # ancienne signature retirée
    assert b"Ancien" not in vierge.read_bytes()


def test_extraire_et_reapposer_signature(tmp_path):
    modele = creer_formulaire_agi(tmp_path / "f.pdf")
    sig = tmp_path / "signature.pdf"
    assert extraire_signature(modele, sig)
    ops = operations(sig)
    assert b"c" in ops and b"Tj" not in ops and b"l" not in ops  # seulement la signature
    sortie = tmp_path / "AGI.pdf"
    champs = remplir_formulaire(modele, sortie, {"nom_prenom": "X"}, signature=sig)
    assert b"c" in operations(sortie)
    assert next(c for c in champs if c.cle == "agi:signature").statut.value == "Validé"
    assert not extraire_signature(creer_modele_vierge(modele, tmp_path / "v.pdf"), tmp_path / "rien.pdf")


def test_sans_signature_a_verifier(tmp_path):
    champs = remplir_formulaire(creer_formulaire_agi(tmp_path / "f.pdf"), tmp_path / "AGI.pdf", {"nom_prenom": "X"})
    assert next(c for c in champs if c.cle == "agi:signature").statut.value == "À vérifier"


def test_telephone_comptabilite(tmp_path):
    f = lire_presence(creer_presence(tmp_path / "p.pdf"))
    assert f.organisation["Comptabilité"].telephones == ["076 000 00 09"]
