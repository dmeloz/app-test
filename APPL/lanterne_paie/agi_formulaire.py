"""AGI au format officiel REMPLISSABLE (716.105 f, champs de formulaire PDF).

Le modèle peut être le formulaire vierge ou un AGI déjà rempli : il est d'abord « nettoyé » (tous les champs
vidés, annotations ajoutées et ancienne signature retirées), puis rempli champ par champ. Un champ absent du
modèle n'est jamais positionné à la main : il est signalé « À vérifier ».
"""

from __future__ import annotations

import io
import json
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, NameObject, TextStringObject

from .modeles import Champ, Statut

_BASE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent.parent))
CORRESPONDANCES = _BASE / "ressources" / "agi_formulaire.json"
SOURCE = "Formulaire AGI"


def est_formulaire(modele: Path) -> bool:
    try:
        return bool(PdfReader(str(modele)).get_fields())
    except Exception:
        return False


def charger_correspondances(chemin: Path | None = None) -> dict:
    return json.loads((chemin or CORRESPONDANCES).read_text(encoding="utf-8"))


def _annotations(page) -> list:
    annots = page.get("/Annots")
    return list(annots.get_object()) if annots is not None else []


def _widgets(redacteur: PdfWriter):
    """(page, widget, nom complet du champ, champ parent)."""
    for page in redacteur.pages:
        for ref in _annotations(page):
            w = ref.get_object()
            if w.get("/Subtype") != "/Widget":
                continue
            parent = w["/Parent"].get_object() if "/Parent" in w else w
            nom = str(w.get("/T") or parent.get("/T") or "")
            yield page, w, nom, parent


def _type(w, parent) -> str:
    return str(w.get("/FT") or parent.get("/FT") or "")


def _reconstruire_champs(redacteur: PdfWriter) -> None:
    """/AcroForm /Fields doit désigner les champs réellement affichés sur les pages.

    Certains PDF réenregistrés par macOS contiennent des copies des champs, distinctes des widgets
    affichés : on repart des widgets des pages.
    """
    racines, vus = [], set()
    for page in redacteur.pages:
        for ref in _annotations(page):
            w = ref.get_object()
            if w.get("/Subtype") != "/Widget":
                continue
            while "/Parent" in w:
                ref = w.raw_get("/Parent")
                w = ref.get_object()
            cle = id(w)
            if cle not in vus:
                vus.add(cle)
                racines.append(ref)
    formulaire = redacteur._root_object["/AcroForm"].get_object()
    formulaire[NameObject("/Fields")] = ArrayObject(racines)


def nettoyer(redacteur: PdfWriter) -> int:
    """Vide tous les champs et retire les annotations non-formulaire (texte libre, signature précédente)."""
    _reconstruire_champs(redacteur)
    retirees = 0
    for page in redacteur.pages:
        annots = _annotations(page)
        if not annots:
            continue
        garder = [a for a in annots if a.get_object().get("/Subtype") == "/Widget"]
        retirees += len(annots) - len(garder)
        page[NameObject("/Annots")] = ArrayObject(garder)
    for _, w, _, parent in _widgets(redacteur):
        for objet in (w, parent):
            objet.pop("/DV", None)  # valeur par défaut : peut contenir les données d'un autre AGI
        t = _type(w, parent)
        if t == "/Tx":
            parent[NameObject("/V")] = TextStringObject("")
            w.pop("/AP", None)
        elif t == "/Btn":
            parent[NameObject("/V")] = NameObject("/Off")
            w[NameObject("/AS")] = NameObject("/Off")
        elif t == "/Sig":
            parent.pop("/V", None)
            w.pop("/AP", None)  # ancienne signature visible
    return retirees


_PEINTURE = {b"S", b"s", b"f", b"F", b"f*", b"B", b"B*", b"b", b"b*", b"n"}
_CONSTRUCTION = {b"m", b"l", b"c", b"v", b"y", b"h", b"re"}


def retirer_traces(page, redacteur: PdfWriter, zone: list[float]) -> int:
    """Retire les tracés (lignes, courbes) situés entièrement dans la zone de signature.

    Un AGI déjà signé contient sa signature dans le dessin de la page : utilisé comme modèle, elle
    réapparaîtrait sous la nouvelle.
    """
    from pypdf.generic import ContentStream

    from .agi import _mul, _point

    x0, y0, x1, y1 = zone
    flux = ContentStream(page.get_contents(), redacteur)
    garder, chemin, points = [], [], []
    pile, ctm, retires = [], (1, 0, 0, 1, 0, 0), 0
    for operandes, op in flux.operations:
        if op == b"q":
            pile.append(ctm)
        elif op == b"Q" and pile:
            ctm = pile.pop()
        elif op == b"cm":
            ctm = _mul(tuple(float(v) for v in operandes), ctm)
        if op in _CONSTRUCTION:
            chemin.append((operandes, op))
            valeurs = [float(v) for v in operandes]
            if op == b"re":
                x, y, w, h = valeurs
                valeurs = [x, y, x + w, y + h]
            points += [_point(ctm, valeurs[i], valeurs[i + 1]) for i in range(0, len(valeurs) - 1, 2)]
            continue
        if op in _PEINTURE and chemin:
            dedans = points and all(x0 <= px <= x1 and y0 <= py <= y1 for px, py in points)
            if dedans:
                retires += 1
            else:
                garder += chemin + [(operandes, op)]
            chemin, points = [], []
            continue
        garder += chemin
        chemin, points = [], []
        garder.append((operandes, op))
    if retires:
        flux.operations = garder
        page.replace_contents(flux)
    return retires


def _etats(w) -> list[str]:
    ap = w.get("/AP")
    if not ap or "/N" not in ap:
        return []
    return [str(k) for k in ap["/N"].get_object().keys()]


def _cocher(redacteur: PdfWriter, nom: str, etat: str) -> bool:
    trouve = False
    for _, w, n, parent in _widgets(redacteur):
        if n != nom or _type(w, parent) != "/Btn":
            continue
        trouve = True
        parent[NameObject("/V")] = NameObject(etat)
        w[NameObject("/AS")] = NameObject(etat if etat in _etats(w) else "/Off")
    return trouve


def remplir_formulaire(
    modele: Path,
    sortie: Path,
    donnees: dict[str, object],
    signature: Path | None = None,
    correspondances: dict | None = None,
) -> list[Champ]:
    """donnees : clé (voir ressources/agi_formulaire.json) -> texte, ou état « /0 », « /1 », « /Ja »."""
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    corr = correspondances or charger_correspondances()
    lecteur = PdfReader(str(modele))
    redacteur = PdfWriter(clone_from=lecteur)
    nettoyer(redacteur)
    sig = corr.get("signature", {})
    page_sig = next((p for p, w, n, _ in _widgets(redacteur) if n == sig.get("champ")), None)
    if page_sig is not None and sig.get("zone"):
        retirer_traces(page_sig, redacteur, sig["zone"])
    noms = {n: _type(w, p) for _, w, n, p in _widgets(redacteur)}
    champs: list[Champ] = []

    textes: dict[str, str] = {}
    for nom, valeur in corr["constantes"].items():
        if nom not in noms:
            champs.append(Champ(f"agi:{nom}", nom, str(valeur), SOURCE, Statut.A_VERIFIER,
                                "Champ absent du modèle : non rempli.", modifiable=False))
        elif noms[nom] == "/Btn":
            _cocher(redacteur, nom, str(valeur))
        else:
            textes[nom] = str(valeur)

    for cle, definition in corr["donnees"].items():
        nom = definition["champ"]
        valeur = donnees.get(cle)
        if cle == "calendrier":
            if valeur is None:
                continue
            nom = nom.format(jour=valeur)
            valeur = str(donnees.get("heures", "8"))
        libelle = definition["libelle"]
        if nom not in noms:
            champs.append(Champ(f"agi:{cle}", libelle, str(valeur or ""), SOURCE, Statut.A_VERIFIER,
                                f"Champ « {nom} » non identifiable dans le modèle : non rempli.", modifiable=False))
            continue
        if valeur in (None, ""):
            if not definition.get("facultatif"):
                champs.append(Champ(f"agi:{cle}", libelle, "", SOURCE, Statut.A_VERIFIER,
                                    "Valeur non disponible : champ laissé vide.", modifiable=False))
            continue
        if noms[nom] == "/Btn":
            _cocher(redacteur, nom, str(valeur))
        else:
            textes[nom] = str(valeur)
        champs.append(Champ(f"agi:{cle}", libelle, str(valeur), SOURCE, Statut.VALIDE, "", modifiable=False))

    for page in redacteur.pages:
        a_remplir = {n: v for n, v in textes.items()
                     if any(n == nn for _, _, nn, _ in _widgets_page(page))}
        if a_remplir:
            redacteur.update_page_form_field_values(page, a_remplir, auto_regenerate=False)
    redacteur.set_need_appearances_writer(True)

    # Adresse de l'employeur : sous la zone de signature, comme sur l'AGI de l'association.
    adr = corr.get("adresse_employeur")
    lignes = donnees.get("adresse_employeur") or []
    if adr and lignes:
        page_adr = next((p for p, w, n, _ in _widgets(redacteur) if n == adr["page_du_champ"]), None)
        if page_adr is None:
            champs.append(Champ("agi:adresse_employeur", "Adresse de l'employeur", " / ".join(lignes), SOURCE,
                                Statut.A_VERIFIER, "Zone de l'adresse introuvable : non écrite.", modifiable=False))
        else:
            tampon = io.BytesIO()
            toile = canvas.Canvas(tampon, pagesize=(float(page_adr.mediabox.width), float(page_adr.mediabox.height)))
            toile.setFont("Helvetica", float(adr["taille"]))
            for i, ligne in enumerate(lignes):
                toile.drawString(float(adr["x"]), float(adr["y"]) - i * float(adr["interligne"]), str(ligne))
            toile.save()
            page_adr.merge_page(PdfReader(io.BytesIO(tampon.getvalue())).pages[0])
            champs.append(Champ("agi:adresse_employeur", "Adresse de l'employeur", " / ".join(lignes), SOURCE,
                                Statut.VALIDE, "", modifiable=False))
    elif adr:
        champs.append(Champ("agi:adresse_employeur", "Adresse de l'employeur", "", SOURCE, Statut.A_VERIFIER,
                            "Adresse du club absente du classeur (Configuration B8:B10).", modifiable=False))

    # Signature : image dans la zone du champ « Signature » (le champ reste libre pour une
    # future signature numérique certifiée).
    if signature is not None and signature.exists():
        if page_sig is None:
            champs.append(Champ("agi:signature", "Signature", signature.name, SOURCE, Statut.A_VERIFIER,
                                "Champ « Signature » introuvable : signature non apposée.", modifiable=False))
        else:
            x0, y0, x1, y1 = sig["zone"]
            tampon = io.BytesIO()
            largeur, hauteur = float(page_sig.mediabox.width), float(page_sig.mediabox.height)
            toile = canvas.Canvas(tampon, pagesize=(largeur, hauteur))
            toile.drawImage(ImageReader(str(signature)), x0, y0, x1 - x0, y1 - y0,
                            preserveAspectRatio=True, anchor="c", mask="auto")
            toile.save()
            page_sig.merge_page(PdfReader(io.BytesIO(tampon.getvalue())).pages[0])
            champs.append(Champ("agi:signature", "Signature", signature.name, SOURCE, Statut.VALIDE, "",
                                modifiable=False))

    # Seconde passe : seuls les objets encore utilisés sont recopiés (les anciennes valeurs, annotations
    # et signatures retirées ne subsistent pas, même invisibles, dans le fichier produit).
    tampon = io.BytesIO()
    redacteur.write(tampon)
    propre = PdfWriter(clone_from=PdfReader(io.BytesIO(tampon.getvalue())))
    propre.set_need_appearances_writer(True)
    if sortie.exists():
        raise FileExistsError(sortie)
    sortie.parent.mkdir(parents=True, exist_ok=True)
    with sortie.open("wb") as f:
        propre.write(f)
    return champs


def _widgets_page(page):
    for ref in _annotations(page):
        w = ref.get_object()
        if w.get("/Subtype") != "/Widget":
            continue
        parent = w["/Parent"].get_object() if "/Parent" in w else w
        yield page, w, str(w.get("/T") or parent.get("/T") or ""), parent


def valeurs_remplies(chemin: Path) -> dict[str, str]:
    """Valeurs des champs d'un AGI produit (contrôle et tests)."""
    return {n: str(f.get("/V", "")) for n, f in (PdfReader(str(chemin)).get_fields() or {}).items()}
