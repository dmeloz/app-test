from datetime import date

from lanterne_paie.controles import (
    avs_valide, email_valide, formater_avs, formater_chf, formater_pourcentage, iban_valide, normaliser,
    sans_accents_fichier,
)
from lanterne_paie.dates_fr import lire_date, lire_dossier_mois, mois_saison, nom_dossier_mois


def test_avs():
    assert avs_valide("756.9217.0769.85")  # exemple officiel
    assert not avs_valide("756.9217.0769.84")  # chiffre de contrôle faux
    assert not avs_valide("7569217076985")  # format sans points
    assert formater_avs("7569217076985") == "756.9217.0769.85"


def test_iban():
    assert iban_valide("CH93 0076 2011 6238 5295 7")
    assert not iban_valide("CH93 0076 2011 6238 5295 8")
    assert not iban_valide("CH93 0076 2011 6238 5295")  # longueur suisse incorrecte


def test_email_et_normalisation():
    assert email_valide("a@example.org") and not email_valide("a@b")
    assert normaliser("  Zoé  DUPRÉ-Naïf’ ") == "zoe dupre naif'"
    assert sans_accents_fichier("Zoé Dupré") == "Zoe-Dupre"


def test_mise_en_forme_sans_calcul():
    assert formater_chf(1234.5) == "CHF 1'234.50"
    assert formater_chf(None) == ""
    assert formater_pourcentage(0.1064) == "10.64"


def test_dates():
    assert nom_dossier_mois(date(2026, 10, 3)) == "octobre 2026"
    assert lire_dossier_mois("Décembre 2026") == (2026, 12)
    assert lire_dossier_mois("fevrier 2027") == (2027, 2)
    assert lire_date("03.10.26") == date(2026, 10, 3)
    assert lire_date("03/10/2026") == date(2026, 10, 3)
    assert lire_date("31.02.2026") is None
    saison = mois_saison(2026)
    assert saison[0] == (2026, 6) and saison[-1] == (2027, 6) and len(saison) == 13
