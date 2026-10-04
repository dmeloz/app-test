"""Remplissage de l'attestation de gain intermédiaire (AGI).

Le modèle fourni n'a pas de champs de formulaire. Les zones sont repérées par des textes présents
dans le modèle (ressources/agi_gabarit.json). Les consignes de l'association (surlignage rose et
texte rouge, ajoutés par-dessus le formulaire officiel) sont retirées là où une valeur est écrite.
Aucun montant n'est calculé : les valeurs viennent de la fiche de salaire calculée par Excel.
"""

from __future__ import annotations

import io
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from pdfminer.high_level import extract_pages
from pdfminer.layout import LAParams, LTChar, LTTextContainer, LTTextLine
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream

from .modeles import Champ, Statut

# Application empaquetée (PyInstaller) : les ressources sont dans sys._MEIPASS.
_BASE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent.parent))
GABARIT_DEFAUT = _BASE / "ressources" / "agi_gabarit.json"
SOURCE = "Modèle AGI"


@dataclass
class Ancre:
    texte: str
    x0: float
    y0: float
    x1: float
    y1: float

    def intersecte(self, x0: float, y0: float, x1: float, y1: float, marge: float = 0.0) -> bool:
        return not (x1 < self.x0 - marge or x0 > self.x1 + marge or y1 < self.y0 - marge or y0 > self.y1 + marge)


# --- Repérage des textes du modèle ------------------------------------------------------------

def _compact(texte: str) -> str:
    return re.sub(r"\s+", "", texte)


def lignes_modele(chemin: Path) -> list[list[tuple[str, tuple[float, float, float, float]]]]:
    """Pour chaque ligne de texte de la 1re page : liste (caractère, bbox) sans les espaces."""
    lignes = []
    for page in extract_pages(str(chemin), laparams=LAParams(), maxpages=1):
        for bloc in page:
            if not isinstance(bloc, LTTextContainer):
                continue
            for ligne in bloc:
                if isinstance(ligne, LTTextLine):
                    cars = [(c.get_text(), c.bbox) for c in ligne if isinstance(c, LTChar) and c.get_text().strip()]
                    if cars:
                        lignes.append(cars)
    return lignes


def chercher(lignes, texte: str, zone: list[float] | None = None, exact: bool = False) -> list[Ancre]:
    cible = _compact(texte)
    trouves = []
    for cars in lignes:
        chaine = "".join(c for c, _ in cars)
        positions = [m.start() for m in re.finditer(re.escape(cible), chaine)]
        if exact:
            positions = [0] if chaine == cible else []
        for debut in positions:
            boites = [b for _, b in cars[debut:debut + len(cible)]]
            a = Ancre(texte, min(b[0] for b in boites), min(b[1] for b in boites),
                      max(b[2] for b in boites), max(b[3] for b in boites))
            if zone and not (zone[0] <= a.x0 <= zone[2] and zone[1] <= a.y0 <= zone[3]):
                continue
            trouves.append(a)
    trouves.sort(key=lambda a: (-a.y0, a.x0))
    return trouves


# --- Retrait des consignes (calque rouge/rose) ------------------------------------------------

def _mul(m, n):
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return (a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F)


def _point(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


@dataclass
class Groupe:
    debut: int
    fin: int
    boite: tuple[float, float, float, float] | None
    rouge: bool


def groupes_de_premier_niveau(operations) -> list[Groupe]:
    """Blocs q…Q de premier niveau, avec leur boîte englobante et leur couleur."""
    groupes: list[Groupe] = []
    pile, ctm, couleur, tm = [], (1, 0, 0, 1, 0, 0), None, None
    debut, points, rouge = None, [], False
    for i, (operandes, op) in enumerate(operations):
        if op == b"q":
            if not pile:
                debut, points, rouge = i, [], False
            pile.append((ctm, couleur))
        elif op == b"Q":
            if pile:
                ctm, couleur = pile.pop()
            if not pile and debut is not None:
                boite = None
                if points:
                    xs, ys = [p[0] for p in points], [p[1] for p in points]
                    boite = (min(xs), min(ys), max(xs), max(ys))
                groupes.append(Groupe(debut, i, boite, rouge))
                debut = None
        elif op == b"cm":
            ctm = _mul(tuple(float(v) for v in operandes), ctm)
        elif op in (b"sc", b"scn", b"rg"):
            try:
                couleur = tuple(float(v) for v in operandes)
            except (TypeError, ValueError):
                couleur = None
        elif op == b"Tm":
            tm = tuple(float(v) for v in operandes)
        if debut is None:
            continue
        if op == b"re":
            x, y, w, h = (float(v) for v in operandes)
            suivant = operations[i + 1][1] if i + 1 < len(operations) else b""
            if suivant != b"W":  # rectangle de détourage ignoré
                points += [_point(ctm, x, y), _point(ctm, x + w, y + h)]
        elif op in (b"m", b"l"):
            points.append(_point(ctm, float(operandes[0]), float(operandes[1])))
        elif op in (b"Tj", b"TJ") and tm:
            points.append(_point(ctm, tm[4], tm[5]))
        if op in (b"f", b"f*", b"Tj", b"TJ", b"S", b"B") and couleur and len(couleur) == 3:
            r, g, b = couleur
            if r > 0.95 and g < 0.9 and b < 0.9:
                rouge = True
    return groupes


def retirer_consignes(page, lecteur, ancres: list[tuple[Ancre, float]]) -> int:
    """Supprime les blocs rouges/roses de premier niveau qui touchent les ancres données."""
    flux = ContentStream(page.get_contents(), lecteur)
    operations = flux.operations
    a_retirer: set[int] = set()
    for g in groupes_de_premier_niveau(operations):
        if not g.rouge or g.boite is None:
            continue
        if any(a.intersecte(*g.boite, marge=m) for a, m in ancres):
            a_retirer.update(range(g.debut, g.fin + 1))
    if a_retirer:
        flux.operations = [op for i, op in enumerate(operations) if i not in a_retirer]
        page.replace_contents(flux)
    return len(a_retirer)


# --- Remplissage ----------------------------------------------------------------------------

def charger_gabarit(chemin: Path | None = None) -> dict:
    return json.loads((chemin or GABARIT_DEFAUT).read_text(encoding="utf-8"))


def remplir(
    modele: Path,
    sortie: Path,
    valeurs: dict[str, object],
    signature: Path | None = None,
    gabarit: dict | None = None,
    gabarit_valide: bool = False,
) -> list[Champ]:
    """Remplit le modèle et retourne le statut de chaque zone.

    valeurs : clé de zone -> texte (str), liste de lignes, True pour une case à cocher,
              ou entier (jour du mois) pour le calendrier. Une clé absente = zone non remplie.
    """
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    gabarit = gabarit or charger_gabarit()
    taille = float(gabarit.get("taille_police", 7.5))
    lignes = lignes_modele(modele)
    lecteur = PdfReader(str(modele))
    redacteur = PdfWriter(clone_from=lecteur)
    page = redacteur.pages[0]
    largeur, hauteur = float(page.mediabox.width), float(page.mediabox.height)

    tampon = io.BytesIO()
    toile = canvas.Canvas(tampon, pagesize=(largeur, hauteur))
    toile.setFont("Helvetica", taille)
    a_retirer: list[tuple[Ancre, float]] = []
    champs: list[Champ] = []
    commentaire_gabarit = "" if gabarit_valide else "Gabarit à valider une fois sur l'aperçu."

    for zone in gabarit["zones"]:
        cle, libelle, mode = zone["cle"], zone["libelle"], zone["mode"]
        valeur = valeurs.get(cle)
        if mode == "calendrier":
            if not isinstance(valeur, int):
                continue
            cases = chercher(lignes, str(valeur), zone.get("zone"), exact=True)
            if len(cases) != 1:
                champs.append(Champ(cle, libelle, str(valeur), SOURCE, Statut.A_VERIFIER,
                                    "Case du jour introuvable dans le calendrier : rien n'a été écrit.", modifiable=False))
                continue
            c = cases[0]
            toile.drawString(c.x0 + zone.get("dx", 0), c.y0 + zone.get("dy", 0), str(valeurs.get("heures", "8")))
            champs.append(Champ(cle, libelle, f"{valeurs.get('heures', '8')} h le {valeur}", SOURCE,
                                Statut.VALIDE if gabarit_valide else Statut.A_VERIFIER, commentaire_gabarit, modifiable=False))
            continue

        trouvees = chercher(lignes, zone["ancre"], zone.get("zone"))
        if len(trouvees) != 1:
            if mode == "retirer" or valeur not in (None, "", False, []):
                champs.append(Champ(cle, libelle, _afficher(valeur), SOURCE, Statut.A_VERIFIER,
                                    f"Zone non identifiable dans le modèle ({len(trouvees)} correspondance(s) pour « {zone['ancre']} ») : rien n'a été écrit.",
                                    modifiable=False))
            continue
        ancre = trouvees[0]
        marge = float(zone.get("marge", 0.5))

        if mode == "retirer":
            if valeur is False:
                continue  # consigne conservée volontairement
            a_retirer.append((ancre, marge))
            continue
        if valeur in (None, "", False, []):
            if mode == "remplacer":
                champs.append(Champ(cle, libelle, "", SOURCE, Statut.A_VERIFIER,
                                    "Valeur non disponible : la consigne du modèle est conservée.", modifiable=False))
            continue

        x = (ancre.x1 if zone.get("apres") else ancre.x0) + float(zone.get("dx", 0))
        y = ancre.y0 + float(zone.get("dy", 0))
        if mode == "remplacer":
            a_retirer.append((ancre, marge))
        if mode == "image":
            if signature is None or not signature.exists():
                continue
            toile.drawImage(ImageReader(str(signature)), x, y, float(zone["largeur"]), float(zone["hauteur"]),
                            preserveAspectRatio=True, anchor="sw", mask="auto")
        elif mode == "cocher":
            toile.setFont("Helvetica-Bold", taille + 0.5)
            toile.drawString(x, y, "X")
            toile.setFont("Helvetica", taille)
        elif isinstance(valeur, list):
            interligne = float(zone.get("interligne", taille + 1))
            haut = ancre.y1 - taille + float(zone.get("dy", 0))
            for n, texte in enumerate(valeur):
                toile.drawString(x, haut - n * interligne, str(texte))
        else:
            toile.drawString(x, y, str(valeur))
        champs.append(Champ(cle, libelle, _afficher(valeur), SOURCE,
                            Statut.VALIDE if gabarit_valide else Statut.A_VERIFIER, commentaire_gabarit, modifiable=False))

    toile.save()
    retirer_consignes(page, redacteur, a_retirer)
    calque = PdfReader(io.BytesIO(tampon.getvalue())).pages[0]
    page.merge_page(calque)
    sortie.parent.mkdir(parents=True, exist_ok=True)
    if sortie.exists():
        raise FileExistsError(sortie)
    with sortie.open("wb") as f:
        redacteur.write(f)
    return champs


def _afficher(valeur: object) -> str:
    if valeur is True:
        return "X"
    if isinstance(valeur, list):
        return " / ".join(str(v) for v in valeur)
    return "" if valeur is None else str(valeur)
