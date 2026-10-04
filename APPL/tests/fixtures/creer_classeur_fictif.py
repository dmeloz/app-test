"""Crée tests/fixtures/classeur_fictif_2026.xlsx à partir d'un classeur réel (structure et formules).

Toutes les données personnelles sont remplacées par des données fictives ; liens externes, images et
métadonnées d'auteur sont retirés. Usage : python creer_classeur_fictif.py <classeur réel.xlsx>
"""

import sys
import warnings
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook

SORTIE = Path(__file__).with_name("classeur_fictif_2026.xlsx")

COLLABORATEURS = [
    # prénom, nom, adresse, NPA localité, e-mail, téléphone, statut, LPP, décl. AVS, naissance, AVS, IBAN
    ("Camille", "Exemple", "Rue Fictive 1", "1000 Lausanne", "camille@example.org", "021 000 00 01",
     "Salarié", 0, "oui", datetime(1990, 1, 2), "756.0000.0000.02", "CH93 0076 2011 6238 5295 7"),
    ("Alex", "Martin", "Chemin du Test 2", "1950 Sion", "alex@example.org", "079 000 00 02",
     "Salarié", 0, "oui", datetime(1985, 5, 6), "756.1111.1111.13", "CH56 0483 5012 3456 7800 9"),
    ("Alex", "Martin", "Avenue Modèle 3", "1200 Genève", "alex.m@example.org", "079 000 00 03",
     "Salarié", 0, "non", datetime(1992, 3, 4), "756.2222.2222.24", "CH93 0076 2011 6238 5295 7"),
    ("Noa", "Indep", "Place Imaginaire 4", "2000 Neuchâtel", "noa@example.org", "078 000 00 04",
     "Indépendant", 0, "", None, "", ""),
]


def main(source: Path) -> None:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        wb = load_workbook(source, keep_links=False)
    for nom in list(wb.defined_names):
        if "[" in wb.defined_names[nom].attr_text:
            del wb.defined_names[nom]
    wb.properties.creator = "Fixture"
    wb.properties.lastModifiedBy = "Fixture"

    conf, collab, prest, fiche = (wb.worksheets[i] for i in (1, 2, 3, 4))
    conf["B8"] = "La Lanterne Magique de Testville"
    conf["B9"] = "Lanterne Magique de Testville\nc/o Exemple,\nRue de l'Essai 9,"
    conf["B10"] = "1000 Lausanne"
    for r in range(6, 41):
        for c in "ABDEFGHIJKLM":
            collab[f"{c}{r}"] = None
    for i, valeurs in enumerate(COLLABORATEURS):
        for c, v in zip("ABDEFGHIJKLM", valeurs):
            collab[f"{c}{6 + i}"] = v
    for k in range(12):
        prest[f"N{5 + 11 * k}"] = None
        for r in range(7 + 11 * k, 15 + 11 * k):
            for c in "DEMN":
                if not str(prest[f"{c}{r}"].value or "").startswith("="):
                    prest[f"{c}{r}"] = None
    prest["D7"], prest["E7"] = "Camille Exemple", "Savant·e"
    prest["D8"], prest["E8"] = "Noa Indep", "Artiste"
    fiche["B5"] = "Camille Exemple"
    fiche["E5"] = datetime(2026, 1, 17)
    for ws in wb.worksheets:
        ws._images = []
    wb.save(SORTIE)
    print(f"Créé : {SORTIE}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
