"""Fixtures fictives : aucune donnée réelle n'est utilisée par les tests."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest
from reportlab.pdfgen import canvas

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE))

CLASSEUR_FICTIF = RACINE / "tests" / "fixtures" / "classeur_fictif_2026.xlsx"
DATES_TESTVILLE = ["03.10.26", "07.11.26", "28.11.26", "30.01.27", "27.02.27", "13.03.27", "24.04.27", "22.05.27", "19.06.27"]


def creer_planning(chemin: Path) -> Path:
    c = canvas.Canvas(str(chemin), pagesize=(842, 595))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(42, 560, "LA LANTERNE MAGIQUE 2026-2027")
    for y, club, cinema, dates in (
        (482, "TESTVILLE", "Cinéma Test", DATES_TESTVILLE),
        (443, "AUTRE - VILLE", "Ciné Autre", ["09.09.26", "14.10.26"]),
    ):
        c.setFont("Helvetica-Bold", 8)
        c.drawString(42, y, club)
        c.drawString(42 + c.stringWidth(club, "Helvetica-Bold", 8) + 3, y, "•")
        c.drawString(42 + c.stringWidth(club, "Helvetica-Bold", 8) + 9, y, cinema)
        c.drawString(609, y + 2, "35mm")
        for i, d in enumerate(dates):
            c.drawString(42 + 84 * i, y - 10, d)
            c.setFont("Helvetica", 6)
            c.drawString(110 + 84 * i, y - 9, "DCP")
            c.setFont("Helvetica-Bold", 8)
    c.save()
    return chemin


def creer_presence(chemin: Path, date_seance: str = "03.10.2026") -> Path:
    c = canvas.Canvas(str(chemin), pagesize=(1062.5, 1503.57))

    def ecrire(x, y, texte, gras=False):
        c.setFont("Helvetica-Bold" if gras else "Helvetica", 20)
        c.drawString(x, y, texte)

    ecrire(108, 1205, "TESTVILLE CONFIRMATION DE PRÉSENCE", True)
    ecrire(108, 1150, "Informations pratiques", True)
    ecrire(108, 1115, "Séance", True); ecrire(313, 1115, "Samedi"); ecrire(383, 1115, date_seance)
    ecrire(313, 1093, "10:30")
    ecrire(108, 1060, "Programme", True); ecrire(313, 1060, "Film fictif")
    ecrire(108, 1005, "Cinéma", True); ecrire(313, 1005, "Cinéma Test")
    ecrire(108, 930, "Animation", True)
    personnes = [
        ("Savant·e", "Camille Exemple", "Rue Fictive 1", "1000", "Lausanne", ["021 000 00 01"], "camille@example.org"),
        ("Naïf·ve", "Alex Martin", "Chemin du Test 2", "1950", "Sion", ["079 000 00 02"], "alex@example.org"),
        ("Artiste", "Nouvelle Personne", "Rue Neuve 5", "1000", "Lausanne", ["078 000 00 05", "021 000 00 06"], "nouvelle@example.org"),
    ]
    y = 895
    for fonction, nom, rue, npa, lieu, tels, email in personnes:
        ecrire(108, y, fonction, True)
        x = 312
        for morceau in (nom, ",", rue, ",", npa, lieu):
            ecrire(x, y, morceau)
            x += c.stringWidth(morceau, "Helvetica", 20) + (2 if morceau == "," else 12)
        x = 313
        for morceau in (*tels, email):
            ecrire(x, y - 22, morceau)
            x += c.stringWidth(morceau, "Helvetica", 20) + 15
        y -= 70
    ecrire(108, y, "Organisation", True)
    ecrire(108, y - 35, "Responsable", True); ecrire(313, y - 35, "Personne Responsable")
    ecrire(313, y - 57, "079 000 00 08"); ecrire(470, y - 57, "resp@example.org")
    ecrire(108, y - 92, "Comptabilité", True); ecrire(313, y - 92, "Personne Comptable")
    ecrire(313, y - 114, "076 000 00 09"); ecrire(470, y - 114, "compta@example.org")
    y -= 120
    ecrire(108, y - 80, "Informations importantes", True)
    ecrire(108, y - 110, "Le cachet de l’artiste est de")
    ecrire(108, y - 135, "CHF 319.– (défraiement inclus)")
    c.save()
    return chemin


def creer_modele_agi(chemin: Path) -> Path:
    """Modèle AGI simplifié : formulaire noir + calque de consignes (surlignage translucide et texte rouge)."""
    c = canvas.Canvas(str(chemin), pagesize=(842, 595))
    c.setFont("Helvetica", 7)
    formulaire = [
        (59, 490, "Nom et prénom"), (275, 490, "N° AVS"), (59, 473, "NPA, localité, rue, numéro"),
        (262, 473, "Date de naissance"), (320, 473, "Etat civil"), (59, 451, "Mois:"), (168, 451, "Activité exercée:"),
        (59, 196, "8  Salaire contractuel brut"), (163, 196, "CHF"), (233, 196, "par"),
        (59, 169, "9  Salaire brut soumis à cotisation"), (255, 170, "CHF = CHF"),
        (75, 148, "Salaire de base"), (271, 148, "= CHF"), (76, 125, "Indemnités de vacances"), (262, 125, "% = CHF"),
        (462, 476, "12 LPP"), (483, 476, "oui"), (515, 476, "non"), (462, 146, "Lieu et date"),
    ]
    for x, y, t in formulaire:
        c.drawString(x, y, t)
    for i, jour in enumerate(range(1, 17)):
        c.drawString(59 + 20.3 * i, 397, str(jour))
    for i, jour in enumerate(range(17, 32)):
        c.drawString(59 + 20.3 * i, 377, str(jour))

    def consigne(x, y, texte, surligner=True):
        if surligner:
            c.saveState()
            c.setFillColorRGB(1, 0.25, 0.08)
            c.setFillAlpha(0.2)
            c.rect(x - 1, y - 1.5, c.stringWidth(texte, "Helvetica", 7) + 2, 9, stroke=0, fill=1)
            c.restoreState()
        c.saveState()
        c.setFillColorRGB(1, 0.15, 0)
        c.setFont("Helvetica", 7)
        c.drawString(x, y, texte)
        c.restoreState()

    consigne(58, 483, "Nom et prénom du travailleur")
    consigne(274, 483, "756._ _ _ _._ _ _ _._ _")
    consigne(58, 465, "Adresse du travailleur")
    consigne(262, 464, "JJ/MM/AAAA")
    consigne(58, 445, "Date séance (MM/AAAA)")
    consigne(171, 445, "Animateur·trice")
    consigne(58, 388, "Indiquer «8» dans la cadre correspondant à la date de la séance", surligner=False)
    consigne(179, 196, "XXX.–")
    consigne(522, 144, "Lieu, JJ/MM/AAAA")
    consigne(478, 500, "X")  # réponse pré-remplie par l'association : doit rester
    c.save()
    return chemin


@pytest.fixture
def dossier_principal(tmp_path: Path) -> Path:
    racine = tmp_path / "09.26 - 06.27"
    (racine / "Modèles").mkdir(parents=True)
    mois = racine / "Fiches de salaire" / "octobre 2026"
    mois.mkdir(parents=True)
    shutil.copy2(CLASSEUR_FICTIF, racine / "2026 - 2027 _Gestion-administrative-travailleurs-test.xlsx")
    creer_planning(racine / "PLANNING 2026-2027 test.pdf")
    creer_modele_agi(racine / "Modèles" / "Attestation de gain intermédiaire - modèle.pdf")
    creer_presence(mois / "Testville_1 Fiche de présence.pdf")
    return racine


@pytest.fixture
def reglages(dossier_principal: Path, tmp_path: Path):
    from lanterne_paie.fichiers import detecter_classeurs, detecter_modele_agi, detecter_planning
    from lanterne_paie.reglages import Reglages

    r = Reglages(dossier_principal=str(dossier_principal), agi_lieu="Testville")
    r.classeurs = {str(a): str(f[0]) for a, f in detecter_classeurs(dossier_principal).items()}
    r.planning = str(detecter_planning(dossier_principal)[0])
    r.modele_agi = str(detecter_modele_agi(dossier_principal)[0])
    return r


def creer_formulaire_agi(chemin: Path) -> Path:
    """Formulaire AGI remplissable fictif, « déjà utilisé » : anciennes valeurs, annotation et signature dessinée."""
    from pypdf import PdfReader, PdfWriter
    from pypdf.annotations import FreeText
    from pypdf.generic import NameObject, TextStringObject

    brut = chemin.with_suffix(".brut.pdf")
    c = canvas.Canvas(str(brut), pagesize=(595, 842))
    c.setFont("Helvetica", 9)
    c.drawString(42, 800, "Attestation de gain intermédiaire (formulaire fictif)")
    form = c.acroForm
    textes = {
        "Nom_et_prénom": (42, 716, "Ancien Nom"), "N_AVS": (386, 716, "756.9217.0769.85"),
        "NPA_localité_rue": (42, 687, ""), "Date_de_naissance": (366, 687, "01.01.1950"),
        "Etat_civil": (454, 687, "Ancien état"), "mois": (67, 665, "mai"), "année": (182, 665, "2020"),
        "Activité_exercée": (301, 665, ""), "8_salaire_contractuel_cotisation_AVS_par_mois": (234, 241, "999"),
        "10_Salaire_de_base_CHF": (427, 182, ""), "10_Indemnité_vacances_%": (310, 146, ""),
        "10_Indemnités_vacances_CHF": (427, 147, ""), "13_Caisse_de_compensation_AVS": (62, 400, ""),
        "Lieu_date": (42, 169, "Ailleurs, le 01.01.2020"), "n_de_téléphone": (117, 146, ""),
        "7_motif_refusé_possibilité1": (59, 332, ""), "16_motif_résilation_rapport_du_travail1": (253, 431, ""),
        "adresse_complète_employeur": (297, 60, ""), "Signature": (321, 132, ""),
    }
    for jour in range(1, 32):
        textes[f"1_{jour}"] = (43 + 16 * ((jour - 1) % 16), 564 - 30 * ((jour - 1) // 16), "8" if jour == 15 else "")
    for nom, (x, y, valeur) in textes.items():
        form.textfield(name=nom, x=x, y=y, width=60 if nom.startswith("1_") is False else 14, height=13,
                       value=valeur, borderWidth=0, fontSize=8)
    for nom, y in (("12_cotisations_LPP", 707), ("2_contrat_de_travail_écrit", 511)):
        form.radio(name=nom, value="0", selected=True, x=65, y=y, size=9)
        form.radio(name=nom, value="1", selected=False, x=116, y=y, size=9)
    form.checkbox(name="15_L_activité_poursuit_non", x=66, y=483, size=9, checked=False)
    # Ancienne signature incrustée dans le dessin de la page.
    c.setStrokeColorRGB(0, 0, 0)
    chemin_sig = c.beginPath()
    chemin_sig.moveTo(330, 140)
    chemin_sig.curveTo(340, 160, 350, 120, 365, 150)
    c.drawPath(chemin_sig)
    c.line(42, 100, 280, 100)  # trait du formulaire hors de la zone : doit rester
    c.save()

    redacteur = PdfWriter(clone_from=PdfReader(str(brut)))
    redacteur.add_annotation(0, FreeText(text="9999 Ancienne-Ville, Rue Ancienne 1", rect=(45, 681, 329, 700)))
    for page in redacteur.pages:
        for ref in page["/Annots"]:
            w = ref.get_object()
            if w.get("/T") == "Nom_et_prénom":
                w[NameObject("/DV")] = TextStringObject("Ancien Nom par défaut")
    with chemin.open("wb") as f:
        redacteur.write(f)
    brut.unlink()
    return chemin
