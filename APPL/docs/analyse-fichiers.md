# Analyse des fichiers réels — préparation des salaires La Lanterne Magique

Date : 2026-10-04 · Statut : **analyse avant code, en attente de validation de Sarah Moumin**

Fichiers examinés (lecture seule, aucun original modifié, aucun fichier réel versionné) :

| Fichier | Nature |
|---|---|
| `2026 - 2027 _Gestion-administrative-travailleurs-20261.xlsx` | Classeur de gestion (7 onglets) |
| `PLANNIG 2026-2027_La Lanterne Magique-…_20260714 (1).pdf` | Planning annuel, PDF natif FileMaker, 7 pages |
| `Attestation de gain intermédiaire - modèle.pdf` | Modèle AGI 716.105 f, 1 page A4 paysage |

Non fourni : **la fiche de présence mensuelle** (`Chexbres_1 Fiche de présence.xlsx`). Sa structure reste à analyser.

Légende : **[Fait vérifié]** observé dans le fichier · **[Hypothèse]** à confirmer · **[Décision]** à valider.

---

## 1. Classeur Excel

### 1.1 Onglets réels [Fait vérifié]

Les noms diffèrent de la demande initiale. L'application les détectera par leur numéro et un libellé
approché, jamais par un nom codé en dur.

| Ordre | Nom réel | Zone d'impression |
|---|---|---|
| 0 | `Informations` | A1:H29 |
| 1 | `1. Configuration` | A1:C49 |
| 2 | `2. Collaborateurs·trices` | A1:M40 |
| 3 | `3. Prestations` | D1:N102 |
| 4 | `4. Fiches de salaire` | **B7:G48** |
| 5 | `5. Déclaration AVS` | A1:D41 |
| 6 | `6. Certificats de salaire` | A1:K42 |

### 1.2 `1. Configuration` [Fait vérifié]

- B5 : année civile concernée (actuellement **2026**). Le classeur est organisé en **année civile**, pas de juin à juin.
- B8:B10 : raison sociale, adresse, NPA/localité du club (Chexbres).
- A13:C16 : tarifs par fonction (Savant·e, Naïf·ve, Artiste, Musicien·ne) — colonne B salarié, C indépendant.
- A24:A35 / **B24:B35 : dates des séances** — séances 4 à 9 de la saison précédente, séances 1 à 3 de la saison
  en cours, 3 séances supplémentaires. B30:B32 (séances 1-3 de 2026-2027) sont **vides**.
- B38:C48 : taux (vacances, AVS/AI/APG, AC, AANP, APG-maladie, AFC, autres, frais, LAA). **Lus, jamais modifiés.**
- B51:C51 : valeurs de liste « non » / « oui » (franchise AVS).

### 1.3 `2. Collaborateurs·trices` [Fait vérifié]

**Ce n'est pas un tableau structuré Excel** (aucun objet `Table` dans le fichier) : c'est une plage A5:M40.
En-têtes ligne 5, données lignes 6 à 40 (35 places, 6 occupées actuellement).

| Col. | En-tête | Type | Remarque |
|---|---|---|---|
| A | Prénom | texte | saisie |
| B | Nom | texte | saisie |
| C | Collaborateur·trice | **formule** `=IF(A6>0,(A6&" "&B6),"")` | clé « Prénom Nom » utilisée partout |
| D | Adresse | texte | saisie |
| E | NPA, Localité | texte | saisie |
| F | E-mail | texte | saisie |
| G | Téléphone | texte | saisie |
| H | Statut | liste : Salarié / Indépendant | |
| I | Taux LPP | % | actuellement 0 % |
| J | Déclaration AVS | liste : oui / non (B51:C51) | |
| K | Date naiss. | date | validation de date |
| L | N° AVS | texte `756.XXXX.XXXX.XX` | format vérifié sur les lignes remplies |
| M | IBAN | texte | |

Écart avec la demande : « Adresse » est répartie sur **deux colonnes** (D et E).

### 1.4 `3. Prestations` [Fait vérifié]

Organisé **par séance**, pas par mois : 12 blocs de 11 lignes, un par date de `Configuration!B24:B35`.

| Bloc | Ligne titre | Lignes de saisie |
|---|---|---|
| Séance n (n = 0…11) | 5 + 11n | 7 + 11n à 14 + 11n (8 personnes max) |

Par ligne de prestation :

| Col. | Contenu | Saisie ou formule |
|---|---|---|
| A | Index déclaration AVS | formule |
| B | Index certificats de salaire | formule |
| C | Clé « Prénom Nom » + date | formule `=D7&C$6` |
| **D** | **Collaborateur·trice** (« Prénom Nom ») | **saisie** |
| **E** | **Fonction** (Savant·e, Naïf·ve, Artiste, Musicien·ne) | **saisie** |
| F | Statut | formule (lu dans Collaborateurs) |
| G | Déclaration AVS | formule |
| H | Salaire brut (incl. vac.) | formule (tarif de Configuration) |
| L | Cachet (non soumis) | formule |
| **M** | **Autre** (non soumis à cotisation) | **saisie** |
| **N** | **Remarques** | **saisie** (ligne titre) |

Ligne 137 : totaux H, L, M.

### 1.5 `4. Fiches de salaire` [Fait vérifié]

Fiche **par séance** et non par mois. Deux cellules de saisie, avec listes déroulantes :

- **B5** (fusionnée B5:C5) : collaborateur·trice « Prénom Nom » — liste `Collaborateurs!C6:C40`.
- **E5** (fusionnée E5:G5) : date de séance — liste `Configuration!B24:B35`.

Tout le reste est calculé : D8 message de contrôle (doit être vide), E13:E15 nom/adresse, C21 titre
« Fiche de salaire: séance du JJ.MM.AAAA », F25 salaire de base, F26 vacances, F27 brut, F29:F36 déductions,
F37 total déductions, F39 net, F41:F42 suppléments, **F44 total versé** (`MROUND(…;0.05)`), F47 `=TODAY()`.

**Zone d'export PDF : B7:G48** (zone d'impression définie, ajustée à la page).

### 1.6 `5. Déclaration AVS` et `6. Certificats de salaire` [Fait vérifié]

Entièrement calculés à partir de Prestations et Collaborateurs. L'application ne les touche pas.

### 1.7 Points de vigilance dans le classeur [Fait vérifié — non corrigés, signalés]

1. **Liaison externe cassée** : les noms définis `mois` et `name` pointent vers
   `/Users/…/Downloads/EZYsalaires_2018_v2.0.xlsm`. Excel peut demander de « mettre à jour les liaisons »
   à l'ouverture ; l'automatisation doit l'ouvrir **sans mise à jour des liaisons**.
2. Prestations A11 et A12 : plage `COUNTIF($D$6:D8…)` / `($D$6:D9…)` au lieu de `D10` / `D11`
   (incohérence de recopie, peut fausser l'index AVS). À corriger par vous dans Excel si souhaité.
3. Prestations ligne 137 : les totaux n'incluent pas les 3 séances supplémentaires (blocs 10 à 12).
4. Listes déroulantes et mises en forme conditionnelles stockées en **extensions Excel 2010** :
   une bibliothèque comme `openpyxl` les **supprime silencieusement** à l'enregistrement (vérifié :
   avertissements « extension is not supported and will be removed »).

**Conséquence d'architecture [Décision] :** aucune écriture dans le classeur par une bibliothèque tierce.
Toutes les écritures passent par **Microsoft Excel lui-même** (AppleScript), qui conserve formules, listes,
mises en forme, recalcule et exporte le PDF. Une bibliothèque n'est utilisée **qu'en lecture**.

---

## 2. Planning annuel PDF [Fait vérifié]

- PDF natif (texte extractible, polices intégrées) — pas d'OCR nécessaire.
- Une section par club : `VILLE • Cinéma`, puis 9 dates `JJ.MM.AA` avec le titre du film et le format.
- Exemple pour **CHEXBRES • CinéChexbres** : 03.10.26, 07.11.26, 28.11.26, 30.01.27, 27.02.27, 13.03.27,
  24.04.27, 22.05.27, 19.06.27.
- **Un mois peut contenir deux séances** (novembre 2026 à Chexbres). Il y aura donc plusieurs fiches de
  salaire par collaborateur pour ce mois (voir décision D2).

---

## 3. Modèle AGI [Fait vérifié]

- Formulaire 716.105 f, 1 page A4 paysage, produit par « macOS Quartz / pdftopdf ».
- **Aucun champ de formulaire** (pas d'AcroForm, pas de XFA) : le modèle a été aplati lors d'une impression
  en PDF. Il est donc **impossible d'identifier des champs** dans ce fichier.
- Le modèle contient déjà des réponses pré-cochées (questions 3, 5, 6, 11, 14, 15, 17 à « non »,
  16 « Contrat d'une durée déterminée d'un jour ») et les indications « Indiquer “8” dans le cadre
  correspondant à la date de la séance », « Activité exercée : Animateur·trice ».

Zones à renseigner identifiées par le texte (positions **non** déduites) : nom et prénom, n° AVS, adresse,
date de naissance, mois/année, calendrier (8 h à la date de séance), 8 salaire contractuel, 9 salaire brut
(heures × CHF = CHF), 10 salaire de base / vacances %, 12 LPP oui/non, lieu et date, signature.

Avec la règle « ne pas inventer de position », ce modèle donnerait **toutes les zones À vérifier**.
Voir décision D3.

---

## 4. Décisions à valider

| # | Question | Proposition |
|---|---|---|
| D1 | Le classeur est en année civile (séances 4-9 de 2025-26 + 1-3 de 2026-27). Octobre à décembre 2026 s'inscrivent dans ce classeur (B30:B32) ; janvier à juin 2027 dans le classeur de l'année civile 2027 ? | Oui. L'application choisit le classeur selon `Configuration!B5` et alerte si la date de séance n'est pas dans `B24:B35`. |
| D2 | Fiche de salaire par séance (structure Excel) mais nom de fichier par mois `YYYY-MM`. | Une fiche par séance : `Fiche_salaire_NOM_Prenom_YYYY-MM-JJ.pdf` si le mois a plusieurs séances, sinon `YYYY-MM`. |
| D3 | AGI sans champs. | Fournir le **formulaire officiel remplissable** 716.105 (arbeit.swiss), ou valider une **calibration unique** des zones par vous-même dans l'application (vous cliquez chaque zone une fois ; positions enregistrées, jamais devinées). |
| D4 | La date de séance n'existe pas encore dans `Configuration!B30:B32`. Écrire la date de séance dans Configuration ? | Oui, avec confirmation explicite (modification de structure), en lisant la date dans le planning PDF. |
| D5 | Ajout d'un collaborateur absent : écrire dans la première ligne vide de A6:M40 (sans toucher la colonne C formule). | Oui, avec confirmation. Plus de 35 collaborateurs → Erreur bloquante. |
| D6 | E-mail : Outlook Web dans Chrome ne permet pas de joindre un fichier par lien. | Brouillon ouvert dans Chrome (destinataire, objet, texte) + dossier des PDF ouvert dans le Finder pour glisser les pièces jointes. |

---

## 5. Architecture proposée [Décision]

- **Swift + SwiftUI**, application macOS native, 100 % locale, aucun appel réseau (pas de dépendance réseau à
  l'exécution ; le seul lien ouvert est le brouillon Outlook Web, sans pièce jointe ni donnée salariale autre que
  le texte du message que vous relisez).
- Lecture `.xlsx` : bibliothèque de lecture seule (CoreXLSX) sur une **copie** du fichier.
- Écriture, recalcul, export PDF : **Microsoft Excel via AppleScript** (ouverture sans mise à jour des liaisons,
  écriture des seules cellules de saisie, `save`, export de la zone d'impression de `4. Fiches de salaire`).
- Planning : PDFKit (extraction texte). AGI : PDFKit (champs AcroForm si disponibles, sinon zones calibrées).
- Sauvegarde horodatée de tout fichier avant traitement ; aucun écrasement : suffixe `_v2`, `_v3`.
- Journal et rapport en JSON + HTML lisible dans `Rapports/`.

## 6. Stratégie de test

1. **Fixtures synthétiques** générées à partir de la structure réelle (mêmes onglets, formules, extensions)
   avec des personnes fictives ; aucun fichier réel dans le dépôt (`APPL/.gitignore`).
2. **Tests unitaires** (Swift, sans Excel) : extraction du planning, identification par nom/prénom/AVS
   (0, 1, plusieurs correspondances), statuts Validé/À vérifier/Erreur, blocage sur Erreur obligatoire,
   nommage, dossiers mensuels, versionnement anti-écrasement.
3. **Test d'intégrité du classeur** : comparaison formule par formule, onglets, noms définis, validations et
   mises en forme conditionnelles (XML `extLst`) **avant/après** écriture. Toute différence hors cellules de
   saisie attendues = échec.
4. **Tests d'intégration sur le Mac** (Excel installé) : écriture → recalcul → contrôle D8 vide → contrôle
   C21 et E13 → export PDF → PDF non vide d'une page.
5. **Recette** avec Sarah sur une copie, un collaborateur fictif, puis un réel.

## 7. Éléments encore nécessaires

- Une fiche de présence mensuelle (anonymisée si possible).
- Réponses aux décisions D1 à D6.
- Le formulaire AGI remplissable si disponible.
- Une confirmation que Microsoft Excel (version Mac) est installé.
