"""Lecture du planning annuel (PDF natif FileMaker)."""

from __future__ import annotations

import re
from pathlib import Path

from .controles import normaliser
from .dates_fr import lire_date
from .modeles import PlanningClub
from .pdf_texte import Segment, segments

_DATE_COURTE = re.compile(r"\d{2}\.\d{2}\.\d{2}")


def lire_planning(chemin: Path) -> dict[str, PlanningClub]:
    """Retourne les clubs du planning, indexés par nom normalisé (« chexbres »)."""
    return analyser_segments(segments(chemin))


def analyser_segments(segs: list[Segment]) -> dict[str, PlanningClub]:
    """Chaque rangée de dates est rattachée à l'en-tête « CLUB • Cinéma » situé juste au-dessus."""
    dates = [s for s in segs if _DATE_COURTE.fullmatch(s.texte)]
    rangs: list[list[Segment]] = []
    for d in sorted(dates, key=lambda s: (s.page, -s.y0, s.x0)):
        if rangs and rangs[-1][0].page == d.page and abs(rangs[-1][0].y0 - d.y0) < 3:
            rangs[-1].append(d)
        else:
            rangs.append([d])
    clubs: dict[str, PlanningClub] = {}
    for rang in rangs:
        y, page = rang[0].y0, rang[0].page
        entete = sorted(
            (
                s for s in segs
                if s.page == page and 3 < s.y0 - y <= 20 and s.x0 < 400
                and not _DATE_COURTE.fullmatch(s.texte)
            ),
            key=lambda s: s.x0,
        )
        if not entete:
            continue
        # On ne garde que la rangée la plus basse au-dessus des dates (l'en-tête lui-même).
        y_entete = min(s.y0 for s in entete)
        texte = " ".join(s.texte for s in entete if abs(s.y0 - y_entete) < 3)
        club, cinema = _decouper_entete(texte)
        if not club:
            continue
        jours = [j for j in (lire_date(d.texte) for d in sorted(rang, key=lambda s: s.x0)) if j]
        clubs[normaliser(club)] = PlanningClub(club=club, cinema=cinema, dates=jours)
    return clubs


def _decouper_entete(texte: str) -> tuple[str, str]:
    """« CHEXBRES • CinéChexbres » -> (« CHEXBRES », « CinéChexbres »)."""
    texte = re.sub(r"\(cid:\d+\)", " ", texte)  # glyphe non décodable (ex. puce « • »)
    mots = texte.replace("•", " ").split()
    club: list[str] = []
    for mot in mots:
        lettres = [c for c in mot if c.isalpha()]
        if mot in {"-", "–"} or (lettres and mot.upper() == mot and len(lettres) >= 2):
            club.append(mot)
        else:
            break
    while club and club[-1] in {"-", "–"}:
        club.pop()
    if not club:
        return "", ""
    return " ".join(club), " ".join(mots[len(club):])
