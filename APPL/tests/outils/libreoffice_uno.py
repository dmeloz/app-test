"""Substitut d'Excel pour les tests (exécuté par le Python système qui fournit « uno »).

Entrée JSON (stdin) : {"classeur", "feuille_fiche", "pdf", "ecritures": [[feuille, cellule, type, valeur]], "lire": [...]}
Sortie : lignes « CELLULE<TAB>NUM:…|TXT:…|DATE:… », comme le script AppleScript.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
from datetime import date

import uno
from com.sun.star.beans import PropertyValue


def prop(nom, valeur):
    p = PropertyValue()
    p.Name, p.Value = nom, valeur
    return p


def main():
    demande = json.load(sys.stdin)
    profil = tempfile.mkdtemp(prefix="lo_profil_")
    tube = f"lanterne{os.getpid()}"
    soffice = subprocess.Popen([
        "soffice", "--headless", "--invisible", "--nologo", "--norestore",
        f"-env:UserInstallation=file://{profil}", f"--accept=pipe,name={tube};urp;",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        local = uno.getComponentContext()
        resolveur = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
        for _ in range(120):
            try:
                ctx = resolveur.resolve(f"uno:pipe,name={tube};urp;StarOffice.ComponentContext")
                break
            except Exception:
                time.sleep(0.5)
        bureau = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        url = uno.systemPathToFileUrl(demande["classeur"])
        doc = bureau.loadComponentFromURL(url, "_blank", 0, (prop("Hidden", True),))
        feuilles = doc.Sheets
        for feuille, cellule, type_, valeur in demande["ecritures"]:
            c = feuilles.getByName(feuille).getCellRangeByName(cellule)
            if type_ == "date":
                a, m, j = (int(x) for x in valeur.split("-"))
                c.setValue((date(a, m, j) - date(1899, 12, 30)).days)
            elif type_ == "nombre":
                c.setValue(float(valeur))
            else:
                c.setString(valeur)
        doc.calculateAll()
        fiche = feuilles.getByName(demande["feuille_fiche"])
        formats = doc.NumberFormats
        sortie = []
        for cellule in demande["lire"]:
            c = fiche.getCellRangeByName(cellule)
            texte = c.getString()
            from com.sun.star.table.CellContentType import FORMULA, VALUE, EMPTY
            est_nombre = c.getType() == VALUE or (c.getType() == FORMULA and c.FormulaResultType2 == 1)
            if c.getType() == EMPTY:
                sortie.append(f"{cellule}\tTXT:")
            elif est_nombre:
                type_format = formats.getByKey(c.NumberFormat).Type
                if type_format & 2:  # DATE
                    d = date(1899, 12, 30).toordinal() + int(c.getValue())
                    d = date.fromordinal(d)
                    sortie.append(f"{cellule}\tDATE:{d.year}-{d.month}-{d.day}")
                else:
                    sortie.append(f"{cellule}\tNUM:{c.getValue()!r}")
            else:
                sortie.append(f"{cellule}\tTXT:{texte}")
        doc.store()
        if not demande["pdf"]:  # mise à jour du classeur annuel : pas d'export
            doc.close(True)
            print("\n".join(sortie))
            return
        # Export PDF de la zone d'impression de la feuille « Fiches de salaire ».
        zones = fiche.getPrintAreas()
        selection = fiche.getCellRangeByPosition(
            zones[0].StartColumn, zones[0].StartRow, zones[0].EndColumn, zones[0].EndRow) if zones else fiche
        filtre = uno.Any("[]com.sun.star.beans.PropertyValue", (prop("Selection", selection),))
        doc.storeToURL(uno.systemPathToFileUrl(demande["pdf"]),
                       (prop("FilterName", "calc_pdf_Export"), prop("FilterData", filtre)))
        doc.close(True)
        print("\n".join(sortie))
    finally:
        try:
            bureau.terminate()
        except Exception:
            pass
        soffice.terminate()
        soffice.wait(timeout=30)


if __name__ == "__main__":
    main()
