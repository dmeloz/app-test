"""Contrôles de format (sans aucun calcul de montant)."""

from __future__ import annotations

import re
import unicodedata


def normaliser(texte: str) -> str:
    """Comparaison tolérante : sans accents, minuscules, espaces et apostrophes unifiés."""
    texte = unicodedata.normalize("NFKD", texte or "")
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    texte = texte.replace("’", "'").replace("·", "").replace("-", " ")
    return re.sub(r"\s+", " ", texte).strip().lower()


def sans_accents_fichier(texte: str) -> str:
    """Partie de nom de fichier : sans accents ni caractères spéciaux."""
    texte = unicodedata.normalize("NFKD", texte or "")
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    texte = re.sub(r"[^A-Za-z0-9]+", "-", texte).strip("-")
    return texte


def avs_valide(no_avs: str) -> bool:
    """N° AVS 756.XXXX.XXXX.XX avec chiffre de contrôle EAN-13."""
    if not re.fullmatch(r"756\.\d{4}\.\d{4}\.\d{2}", (no_avs or "").strip()):
        return False
    chiffres = [int(c) for c in no_avs if c.isdigit()]
    somme = sum(c * (3 if i % 2 else 1) for i, c in enumerate(chiffres[:12]))
    return (10 - somme % 10) % 10 == chiffres[12]


def formater_avs(texte: str) -> str:
    """756XXXXXXXXXX -> 756.XXXX.XXXX.XX (si 13 chiffres)."""
    chiffres = re.sub(r"\D", "", texte or "")
    if len(chiffres) != 13:
        return (texte or "").strip()
    return f"{chiffres[:3]}.{chiffres[3:7]}.{chiffres[7:11]}.{chiffres[11:]}"


def iban_valide(iban: str) -> bool:
    """IBAN (contrôle modulo 97). Les IBAN suisses comptent 21 caractères."""
    compact = re.sub(r"\s", "", iban or "").upper()
    if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", compact):
        return False
    if compact.startswith(("CH", "LI")) and len(compact) != 21:
        return False
    reorganise = compact[4:] + compact[:4]
    nombre = "".join(str(int(c, 36)) for c in reorganise)
    return int(nombre) % 97 == 1


def email_valide(email: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[A-Za-z]{2,}", (email or "").strip()))


def formater_chf(valeur: object) -> str:
    """Affichage CHF à deux décimales (mise en forme uniquement, aucun calcul)."""
    if valeur is None or valeur == "":
        return ""
    try:
        nombre = float(valeur)
    except (TypeError, ValueError):
        return str(valeur)
    texte = f"{nombre:,.2f}".replace(",", "'")
    return f"CHF {texte}"


def formater_nombre(valeur: object) -> str:
    """Montant à deux décimales sans symbole (pour les cases CHF de l'AGI)."""
    if valeur is None or valeur == "":
        return ""
    try:
        return f"{float(valeur):,.2f}".replace(",", "'")
    except (TypeError, ValueError):
        return str(valeur)


def formater_pourcentage(valeur: object) -> str:
    """0.1064 -> « 10.64 » (mise en forme d'un taux lu dans Excel, jamais modifié)."""
    if valeur is None or valeur == "":
        return ""
    try:
        return f"{float(valeur) * 100:.2f}"
    except (TypeError, ValueError):
        return str(valeur)


def formater_nombre_fr(valeur: object) -> str:
    """Montant à deux décimales, virgule décimale (« 228,67 »), comme sur les AGI de l'association."""
    texte = formater_nombre(valeur)
    return texte.replace(".", ",") if texte and texte[0].isdigit() else texte


def formater_pourcentage_fr(valeur: object) -> str:
    """0.1064 -> « 10,64 »."""
    return formater_pourcentage(valeur).replace(".", ",")
