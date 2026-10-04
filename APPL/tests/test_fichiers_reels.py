"""Tests facultatifs sur les fichiers réels de Sarah (jamais versionnés, jamais copiés hors du Mac).

LANTERNE_DOSSIER_REEL : dossier principal (ex. « …/09.26 - 06.27 »).
LANTERNE_TEST_EXCEL=1 : génère aussi avec Microsoft Excel, sur une copie temporaire du dossier.
"""

import os
import shutil
from pathlib import Path

import pytest

from lanterne_paie.dates_fr import lire_dossier_mois
from lanterne_paie.fichiers import (
    DOSSIER_FICHES, detecter_classeurs, detecter_fiches_presence, detecter_modele_agi, detecter_planning,
)
from lanterne_paie.reglages import Reglages
from lanterne_paie.traitement import analyser, generer

DOSSIER = os.environ.get("LANTERNE_DOSSIER_REEL")
pytestmark = pytest.mark.skipif(not DOSSIER, reason="LANTERNE_DOSSIER_REEL non défini")


def _reglages(racine: Path) -> Reglages:
    r = Reglages(dossier_principal=str(racine))
    r.classeurs = {str(a): str(f[0]) for a, f in detecter_classeurs(racine).items()}
    r.planning = str(detecter_planning(racine)[0])
    modeles = detecter_modele_agi(racine)
    r.modele_agi = str(modeles[0]) if modeles else ""
    return r


def _fiches(racine: Path) -> list[Path]:
    dossiers = [d for d in (racine / DOSSIER_FICHES).iterdir() if d.is_dir() and lire_dossier_mois(d.name)]
    return [f for d in dossiers for f in detecter_fiches_presence(d)]


def test_analyse_de_toutes_les_fiches():
    racine = Path(DOSSIER)
    r = _reglages(racine)
    fiches = _fiches(racine)
    assert fiches, "Aucune fiche de présence trouvée"
    for fiche in fiches:
        for i in range(3):
            try:
                a = analyser(r, fiche, i)
            except IndexError:
                break
            assert any(c.cle == "club" for c in a.champs)


@pytest.mark.skipif(os.environ.get("LANTERNE_TEST_EXCEL") != "1", reason="LANTERNE_TEST_EXCEL=1 non défini")
def test_generation_excel_sur_copie(tmp_path):
    copie = tmp_path / Path(DOSSIER).name
    shutil.copytree(DOSSIER, copie)
    r = _reglages(copie)
    fiche = _fiches(copie)[0]
    a = analyser(r, fiche, 0)
    res = generer(a, r, lambda *_: True, lambda *_: True)
    for c in res.controles:
        print(c.statut.value, c.libelle, c.commentaire)
    assert res.pdf_fiche and res.pdf_fiche.exists()
    assert all(c.statut.value != "Erreur" for c in res.controles)
