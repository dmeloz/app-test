"""Lecture positionnelle du texte des PDF natifs (aucun OCR)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from pdfminer.high_level import extract_pages
from pdfminer.layout import LAParams, LTChar, LTTextContainer, LTTextLine


class PdfNonPrisEnCharge(Exception):
    """PDF scanné (sans texte) ou illisible : non traité dans cette version."""


@dataclass
class Segment:
    """Un morceau de texte continu sur une ligne, avec sa position (points PDF)."""

    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    texte: str

    @property
    def taille(self) -> float:
        return self.y1 - self.y0


def segments(chemin: Path) -> list[Segment]:
    """Découpe le texte en segments séparés par des espaces larges (colonnes)."""
    resultat: list[Segment] = []
    try:
        pages = list(extract_pages(str(chemin), laparams=LAParams()))
    except Exception as exc:  # pdfminer lève des exceptions variées
        raise PdfNonPrisEnCharge(f"PDF illisible : {chemin.name} ({exc})") from exc
    for numero, page in enumerate(pages):
        for bloc in page:
            if not isinstance(bloc, LTTextContainer):
                continue
            for ligne in bloc:
                if isinstance(ligne, LTTextLine):
                    resultat.extend(_decouper_ligne(numero, ligne))
    if sum(len(s.texte) for s in resultat) < 20:
        raise PdfNonPrisEnCharge(
            f"{chemin.name} ne contient pas de texte : PDF scanné non pris en charge (pas d'OCR)."
        )
    return resultat


def _decouper_ligne(page: int, ligne: LTTextLine) -> list[Segment]:
    morceaux: list[Segment] = []
    courant: list[LTChar] = []
    for car in ligne:
        if not isinstance(car, LTChar):
            continue
        if courant:
            precedent = courant[-1]
            ecart = car.x0 - precedent.x1
            if ecart > 0.45 * max(precedent.size, 1):
                morceaux.append(_segment(page, courant))
                courant = []
        if car.get_text().strip() or courant:
            courant.append(car)
    if courant:
        morceaux.append(_segment(page, courant))
    return [m for m in morceaux if m.texte]


def _segment(page: int, cars: list[LTChar]) -> Segment:
    morceaux: list[str] = []
    for i, car in enumerate(cars):
        if i and car.x0 - cars[i - 1].x1 > 0.15 * max(car.size, 1) and not morceaux[-1].endswith(" "):
            morceaux.append(" ")  # espace implicite (non codée dans le PDF)
        morceaux.append(car.get_text())
    texte = re.sub(r"\s+", " ", "".join(morceaux)).strip()
    return Segment(
        page=page,
        x0=min(c.x0 for c in cars),
        y0=min(c.y0 for c in cars),
        x1=max(c.x1 for c in cars),
        y1=max(c.y1 for c in cars),
        texte=texte,
    )


def rangees(segs: list[Segment], tolerance: float | None = None) -> list[list[Segment]]:
    """Regroupe les segments d'une même page en rangées (de haut en bas, puis gauche à droite)."""
    tries = sorted(segs, key=lambda s: (s.page, -s.y0, s.x0))
    groupes: list[list[Segment]] = []
    for s in tries:
        tol = tolerance if tolerance is not None else max(2.0, s.taille * 0.4)
        if groupes and groupes[-1][0].page == s.page and abs(groupes[-1][0].y0 - s.y0) <= tol:
            groupes[-1].append(s)
        else:
            groupes.append([s])
    for g in groupes:
        g.sort(key=lambda s: s.x0)
    return groupes
