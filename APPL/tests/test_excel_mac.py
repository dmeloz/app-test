from datetime import date
from pathlib import Path

from lanterne_paie.excel_mac import chaine_applescript, generer_script, lire_sortie
from lanterne_paie.plan_excel import Ecriture


def test_script_applescript():
    ecritures = [
        Ecriture("2. Collaborateurs·trices", "G6", "079 000 00 01", ""),
        Ecriture("2. Collaborateurs·trices", "D6", 'Rue "du" Test', ""),
        Ecriture("1. Configuration", "B30", date(2026, 10, 3), ""),
    ]
    s = generer_script(Path("/tmp/Copie.xlsx"), ecritures, "4. Fiches de salaire", Path("/tmp/Fiche.pdf"))
    assert 'update links do not update links' in s
    assert "\"'079 000 00 01\"" in s  # texte forcé : le 0 initial est conservé
    assert 'Rue \\"du\\" Test' in s  # guillemets échappés
    assert 'my ecrireDate(worksheet "1. Configuration" of wb, "B30", 2026, 10, 3)' in s
    assert "calculate full" in s and "save as active sheet" in s and "close wb saving no" in s
    assert s.index("save wb") < s.index("save as active sheet")


def test_lecture_sortie():
    r = lire_sortie("D8\tTXT:\nF44\tNUM:332,3\nF27\tNUM:355.0\nE5\tDATE:2026-10-3\nC21\tTXT:Fiche de salaire: séance du 03.10.2026\nX\tTXT:missing value\n")
    assert r.controle_d8 == ""
    assert r.valeurs["F44"] == 332.3 and r.valeurs["F27"] == 355.0
    assert r.valeurs["E5"] == date(2026, 10, 3)
    assert r.valeurs["X"] == ""
    assert chaine_applescript('a\\b"c') == '"a\\\\b\\"c"'
