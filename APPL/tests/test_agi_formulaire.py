import pypdf

from lanterne_paie import agi_formulaire
from lanterne_paie.agi_formulaire import est_formulaire, remplir_formulaire, valeurs_remplies
from lanterne_paie.controles import formater_nombre_fr, formater_pourcentage_fr
from lanterne_paie.modeles import Statut

from .conftest import creer_formulaire_agi, creer_modele_agi


def tout_le_contenu(chemin) -> str:
    lecteur = pypdf.PdfReader(str(chemin))
    blob = ""
    for i in range(1, lecteur.trailer["/Size"]):
        try:
            o = lecteur.get_object(i)
        except Exception:
            continue
        if o is None:
            continue
        blob += str(o)
        if hasattr(o, "get_data"):
            try:
                blob += o.get_data().decode("latin-1")
            except Exception:
                pass
    return blob


def test_detection(tmp_path):
    assert est_formulaire(creer_formulaire_agi(tmp_path / "f.pdf"))
    assert not est_formulaire(creer_modele_agi(tmp_path / "m.pdf"))


def test_nettoyage_et_remplissage(tmp_path, monkeypatch):
    modele = creer_formulaire_agi(tmp_path / "f.pdf")
    sortie = tmp_path / "AGI.pdf"
    from PIL import Image
    sig = tmp_path / "sig.png"
    Image.new("RGBA", (120, 40), (0, 0, 120, 255)).save(sig)
    champs = remplir_formulaire(modele, sortie, {
        "nom_prenom": "Exemple Camille", "no_avs": "756.0000.0000.02", "mois": "octobre", "annee": "2026",
        "calendrier": 3, "heures": "8", "salaire_contractuel": "355,00", "lpp": "/1",
        "lieu_date": "Testville, le 04.10.2026", "adresse_employeur": ["Club fictif c/o Exemple", "1000 Lausanne"],
    }, signature=sig)
    v = valeurs_remplies(sortie)
    assert v["Nom_et_prénom"] == "Exemple Camille" and v["1_3"] == "8"
    assert v["1_15"] == "" and v["Etat_civil"] == "" and v["Date_de_naissance"] == ""  # anciennes valeurs vidées
    assert v["12_cotisations_LPP"] == "/1" and v["2_contrat_de_travail_écrit"] == "/1"  # constante association
    assert v["15_L_activité_poursuit_non"] == "/Ja"
    assert v["7_motif_refusé_possibilité1"] == "Contrat à durée déterminée d'un jour"
    contenu = tout_le_contenu(sortie)
    for ancien in ("Ancien Nom", "Ancien état", "Ancienne-Ville", "756.9217.0769.85", "Ailleurs"):
        assert ancien not in contenu, ancien  # aucune donnée de l'ancien AGI, même invisible
    texte_page = pypdf.PdfReader(str(sortie)).pages[0].extract_text()
    assert "Club fictif c/o Exemple" in texte_page
    statut = {c.cle: c.statut for c in champs}
    assert statut["agi:nom_prenom"] is Statut.VALIDE and statut["agi:signature"] is Statut.VALIDE
    assert statut["agi:caisse_avs"] is Statut.A_VERIFIER  # valeur non fournie
    assert statut["agi:salaire_base"] is Statut.A_VERIFIER


def test_signature_incrustee_retiree(tmp_path):
    from pypdf.generic import ContentStream

    modele = creer_formulaire_agi(tmp_path / "f.pdf")
    sortie = tmp_path / "AGI.pdf"
    remplir_formulaire(modele, sortie, {"nom_prenom": "X"})
    lecteur = pypdf.PdfReader(str(sortie))
    ops = [op for _, op in ContentStream(lecteur.pages[0].get_contents(), lecteur).operations]
    assert b"c" not in ops  # la courbe de l'ancienne signature a disparu
    assert b"l" in ops  # le trait du formulaire hors zone est conservé


def test_champ_absent_non_invente(tmp_path):
    modele = creer_formulaire_agi(tmp_path / "f.pdf")
    corr = agi_formulaire.charger_correspondances()
    corr["donnees"]["telephone"]["champ"] = "champ_inexistant"
    champs = remplir_formulaire(modele, tmp_path / "AGI.pdf", {"telephone": "000"}, correspondances=corr)
    c = next(c for c in champs if c.cle == "agi:telephone")
    assert c.statut is Statut.A_VERIFIER and "non identifiable" in c.commentaire


def test_formats_suisses():
    assert formater_nombre_fr(228.67) == "228,67"
    assert formater_nombre_fr(1234.5) == "1'234,50"
    assert formater_pourcentage_fr(0.1064) == "10,64"
