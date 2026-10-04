from datetime import date

import pytest

from lanterne_paie.classeur import CHAMPS_COLLAB, Classeur, LignePrestation, lire_classeur
from lanterne_paie.modeles import Collaborateur
from lanterne_paie.plan_excel import PlanImpossible, planifier

from .conftest import CLASSEUR_FICTIF


@pytest.fixture
def classeur():
    return lire_classeur(CLASSEUR_FICTIF)


def test_lecture(classeur):
    assert classeur.annee == 2026
    assert classeur.feuilles.collaborateurs.startswith("2.")
    assert classeur.anomalies == []
    assert [c.ligne for c in classeur.collaborateurs] == [6, 7, 8, 9]
    assert classeur.seances[30] is None and classeur.seances[24] == date(2026, 1, 17)
    assert classeur.tarifs["Artiste"] == (304, 319)
    assert [p.collaborateur for p in classeur.prestations[24]] == ["Camille Exemple", "Noa Indep"]


def test_correspondances_lignes(classeur):
    assert [Classeur.ligne_configuration(n) for n in range(1, 10)] == [30, 31, 32, 24, 25, 26, 27, 28, 29]
    assert list(Classeur.lignes_bloc(30)) == list(range(73, 81))
    assert len(classeur.rechercher(nom_complet="Alex Martin")) == 2  # homonymes
    assert classeur.rechercher(nom_complet="alex martin", no_avs="756.2222.2222.24")[0].ligne == 8
    assert classeur.rechercher(nom_complet="Personne Inconnue") == []


def test_plan_collaborateur_existant(classeur):
    existant = classeur.collaborateurs[0]
    modifie = Collaborateur(**{**existant.__dict__, "email": "nouveau@example.org", "taux_lpp": None})
    ecritures = planifier(classeur, modifie, existant, 1, date(2026, 10, 3), "Savant·e")
    cellules = {(e.feuille.split(".")[0], e.cellule): e for e in ecritures}
    assert ("2", "F6") in cellules and cellules[("2", "F6")].a_confirmer
    assert cellules[("1", "B30")].valeur == date(2026, 10, 3)
    assert cellules[("3", "D73")].valeur == "Camille Exemple" and cellules[("3", "E73")].valeur == "Savant·e"
    assert cellules[("4", "B5")].valeur == "Camille Exemple" and cellules[("4", "E5")].valeur == date(2026, 10, 3)
    assert not any(e.cellule.startswith("C") and e.feuille.startswith("2.") for e in ecritures)  # formule
    assert not any(e.cellule.startswith("I") and e.feuille.startswith("2.") for e in ecritures)  # taux


def test_plan_nouveau_collaborateur(classeur):
    nouveau = Collaborateur(None, "Zoé", "Nouvelle", statut="Salarié", declaration_avs="oui",
                            no_avs="756.0000.0000.02", iban="CH93 0076 2011 6238 5295 7", date_naissance=date(2000, 1, 1))
    ecritures = planifier(classeur, nouveau, None, 4, date(2026, 1, 17), "Artiste")
    lignes = {e.cellule for e in ecritures if e.feuille.startswith("2.")}
    assert lignes == {f"{CHAMPS_COLLAB[a]}10" for a in ("prenom", "nom", "statut", "declaration_avs", "no_avs", "iban", "date_naissance")}
    assert all(e.a_confirmer for e in ecritures if e.feuille.startswith("2."))
    assert not any(e.feuille.startswith("1.") for e in ecritures)  # date déjà présente en B24
    assert ("D9", "Zoé Nouvelle") in {(e.cellule, e.valeur) for e in ecritures}  # 3e place du bloc 24


def test_plan_conflit_de_date(classeur):
    with pytest.raises(PlanImpossible, match="contient déjà"):
        planifier(classeur, classeur.collaborateurs[0], classeur.collaborateurs[0], 4, date(2026, 1, 18), "Savant·e")


def test_plan_bloc_complet(classeur):
    classeur.prestations[30] = [LignePrestation(l, f"Personne {l}", "Artiste") for l in Classeur.lignes_bloc(30)]
    with pytest.raises(PlanImpossible, match="complet"):
        planifier(classeur, classeur.collaborateurs[0], classeur.collaborateurs[0], 1, date(2026, 10, 3), "Savant·e")
