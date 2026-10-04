"""Journal de traitement et rapport (JSON + HTML lisible)."""

from __future__ import annotations

import html
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path

from .fichiers import DOSSIER_RAPPORTS, version_disponible


def journaliser(racine: Path, message: str) -> None:
    dossier = racine / DOSSIER_RAPPORTS
    dossier.mkdir(parents=True, exist_ok=True)
    with (dossier / "journal.log").open("a", encoding="utf-8") as f:
        f.write(f"{datetime.now():%Y-%m-%d %H:%M:%S}  {message}\n")


@dataclass
class Rapport:
    mois: str
    collaborateur: str
    documents_analyses: list[str] = field(default_factory=list)
    donnees_extraites: list[dict] = field(default_factory=list)
    donnees_a_verifier: list[dict] = field(default_factory=list)
    erreurs: list[dict] = field(default_factory=list)
    modifications_excel: list[str] = field(default_factory=list)
    sauvegarde: str = ""
    fichier_excel: str = ""
    pdf_fiche_salaire: str = ""
    pdf_agi: str = ""
    email: str = ""
    resultats_excel: dict = field(default_factory=dict)
    date_heure: str = field(default_factory=lambda: f"{datetime.now():%d.%m.%Y %H:%M:%S}")

    def enregistrer(self, racine: Path, base: str) -> Path:
        dossier = racine / DOSSIER_RAPPORTS
        dossier.mkdir(parents=True, exist_ok=True)
        chemin_json = version_disponible(dossier / f"{base}.json")
        chemin_json.write_text(json.dumps(asdict(self), ensure_ascii=False, indent=2, default=str), encoding="utf-8")
        chemin_html = chemin_json.with_suffix(".html")
        chemin_html.write_text(self.en_html(), encoding="utf-8")
        return chemin_html

    def en_html(self) -> str:
        e = html.escape

        def tableau(lignes: list[dict]) -> str:
            if not lignes:
                return "<p><em>Aucune.</em></p>"
            entetes = list(lignes[0].keys())
            corps = "".join(
                "<tr>" + "".join(f"<td>{e(str(l.get(k, '')))}</td>" for k in entetes) + "</tr>" for l in lignes
            )
            return "<table><tr>" + "".join(f"<th>{e(k)}</th>" for k in entetes) + f"</tr>{corps}</table>"

        def liste(items: list[str]) -> str:
            return "<ul>" + "".join(f"<li>{e(i)}</li>" for i in items) + "</ul>" if items else "<p><em>Aucun.</em></p>"

        fichiers = [
            ("Sauvegarde", self.sauvegarde), ("Fichier Excel rempli", self.fichier_excel),
            ("PDF fiche de salaire", self.pdf_fiche_salaire), ("PDF AGI", self.pdf_agi), ("E-mail", self.email),
        ]
        lignes_fichiers = "".join(f"<tr><th>{e(a)}</th><td>{e(b or '—')}</td></tr>" for a, b in fichiers)
        resultats = "".join(f"<tr><th>{e(k)}</th><td>{e(str(v))}</td></tr>" for k, v in self.resultats_excel.items())
        return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Rapport — {e(self.collaborateur)} — {e(self.mois)}</title>
<style>body{{font-family:-apple-system,Helvetica,Arial,sans-serif;margin:2em;color:#222}}
table{{border-collapse:collapse;margin:.5em 0 1.5em}}td,th{{border:1px solid #ccc;padding:4px 8px;text-align:left;font-size:13px}}
th{{background:#f3f3f3}}h1{{font-size:20px}}h2{{font-size:16px;margin-top:1.5em}}</style></head><body>
<h1>Rapport de traitement</h1>
<table><tr><th>Mois</th><td>{e(self.mois)}</td></tr><tr><th>Collaborateur·trice</th><td>{e(self.collaborateur)}</td></tr>
<tr><th>Date et heure</th><td>{e(self.date_heure)}</td></tr></table>
<h2>Documents analysés</h2>{liste(self.documents_analyses)}
<h2>Données extraites</h2>{tableau(self.donnees_extraites)}
<h2>Données à vérifier</h2>{tableau(self.donnees_a_verifier)}
<h2>Erreurs</h2>{tableau(self.erreurs)}
<h2>Cellules remplies dans le fichier Excel</h2>{liste(self.modifications_excel)}
<h2>Résultats calculés par Excel</h2><table>{resultats or '<tr><td>—</td></tr>'}</table>
<h2>Fichiers produits</h2><table>{lignes_fichiers}</table>
</body></html>"""
