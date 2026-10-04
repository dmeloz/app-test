# Analyse des fichiers réels — préparation des salaires La Lanterne Magique

Date : 2026-10-04 · Statut : **analyse validée par Sarah Moumin ; application v0.1 développée (voir README)**

Fichiers examinés (lecture seule, aucun original modifié, aucun fichier réel versionné) :

| Fichier | Nature |
|---|---|
| `2026 - 2027 _Gestion-administrative-travailleurs-20261.xlsx` | Classeur de gestion (7 onglets) |
| `PLANNIG 2026-2027_La Lanterne Magique-…_20260714 (1).pdf` | Planning annuel, PDF natif FileMaker, 7 pages |
| `Attestation de gain intermédiaire - modèle.pdf` | Modèle AGI 716.105 f, 1 page A4 paysage |

| `Chexbres_1 Fiche de présence.pdf` | Fiche de présence, PDF natif FileMaker, 1 page (fournie le 2026-10-04) |

La fiche de présence fournie est un **PDF** (et non un Excel) : les deux formats sont pris en charge.

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

## 4. Fiche de présence [Fait vérifié]

- PDF natif, colonne de libellés à gauche (x ≈ 108 pt), valeurs à droite (x ≥ 312 pt).
- En-tête « CLUB CONFIRMATION DE PRÉSENCE », puis Séance (jour, date JJ.MM.AAAA, heure), Programme, Cinéma.
- Rubrique Animation : une ligne par fonction (Savant·e, Naïf·ve, Artiste) avec « Prénom Nom, adresse,
  NPA localité », puis téléphones et e-mail sur la ligne suivante. **Pas de N° AVS** : l'identification se fait
  par « Prénom Nom », le N° AVS est repris du classeur.
- « Le cachet de l'artiste est de CHF 319.– » : comparé au tarif indépendant de Configuration (C15).
- Constats sur le fichier d'octobre 2026 : un téléphone du classeur a perdu son 0 initial (enregistré comme
  nombre) ; l'artiste n'est pas encore dans le classeur 2026 (nouveau collaborateur, statut indépendant).

## 5. Décisions

| # | Question | Décision |
|---|---|---|
| D1 | Classeurs en année civile | **Validé par Sarah** : saison octobre → juin classée par mois ; un classeur Excel par année civile (2026, 2027). L'application choisit le classeur selon `Configuration!B5` et l'année de la séance. |
| D2 | Fiche par séance / nom par mois | **Validé par Sarah** : une fiche par séance ; suffixe `YYYY-MM`, ou `YYYY-MM-JJ` si le club a plusieurs séances dans le mois. |
| D3 | AGI sans champs | **Précisé par Sarah** : modèle officiel pré-rempli par l'association. Zones repérées par les textes du modèle ; les consignes (calque rose/rouge ajouté par l'association) sont retirées là où une valeur est écrite ; les réponses pré-cochées sont conservées. Aperçu fictif à contrôler une fois. |
| D4 | Date de séance absente de Configuration | Inscrite dans la copie de travail (B30:B32 pour les séances 1-3, B24:B29 pour 4-9), après confirmation. Date différente déjà présente = Erreur. |
| D5 | Nouveau collaborateur | Ajouté dans la 1re ligne libre (6 à 40) de la copie, colonne C (formule) jamais écrite, après confirmation. |
| D6 | E-mail | Brouillon Outlook Web dans Chrome + pièces jointes montrées dans le Finder. |
| D7 | Excel installé | **Confirmé par Sarah.** |
| D8 | Classeur annuel | **Validé par Sarah** : le classeur annuel cumule aussi les prestations (déclaration AVS, certificats). Mêmes écritures que la copie (sauf la sélection de la fiche), après sauvegarde horodatée et confirmation ; relu avant chaque génération (pas de doublon) ; intégrité contrôlée contre la sauvegarde. Option désactivable. |
| D11 | Simplification | Formulaire officiel vierge fourni avec l'application (créé à partir de l'AGI de l'association, entièrement vidé) ; signature reprise d'un AGI déjà signé ; téléphone repris de la ligne « Comptabilité » de la fiche de présence ; classeur ouvert dans Excel détecté. Point 8 : salaire sur la ligne « par mois » comme sur l'AGI rempli (la consigne de l'association indique la ligne « par jour ») — *à confirmer*. |
| D10 | AGI remplissable | **Exemple fourni par Sarah** (AGI rempli par l'association) : formulaire officiel 716.105 f avec 105 champs. L'application remplit les champs et applique les conventions de l'exemple. |
| D9 | Indépendant·e | Le classeur ne produit pas de fiche de salaire pour un statut « Indépendant » (contrôle D8) : statut Erreur, génération bloquée. |

Protection : toutes les feuilles sont protégées ; les cellules écrites par l'application sont toutes
déverrouillées [Fait vérifié]. La protection n'est jamais retirée.

## 5 bis. AGI remplissable (exemple de l'association) [Fait vérifié]

- 2 pages A4 portrait, 105 champs (texte, cases à choix, champ « Signature »). Pas de XFA.
- Conventions de l'association reprises :
  - « Nom Prénom » ; « NPA Localité, Rue » ;
  - date de naissance JJ.MM.AAAA ; mois en lettres et année ;
  - « 8 » dans la case du jour ; salaire contractuel au point 8, ligne « par mois » ;
  - point 10 : salaire de base, taux et montant des vacances, avec virgule décimale ;
  - réponses « non » aux questions 2, 3, 5, 6, 11, 14, 15 (avec tirets), 17 ;
  - « Contrat à durée déterminée d'un jour » aux points 7 et 16 ;
  - LPP non ; Caisse Cantonale Vaudoise de Compensation ; « Lieu, le JJ.MM.AAAA » ;
  - adresse du club sous la signature.
- Pièges du fichier d'exemple, tous traités :
  - Les champs du formulaire existent en double : les champs affichés et une autre copie référencée par le
    formulaire. La liste des champs est reconstruite à partir des champs affichés.
  - Des valeurs par défaut (`/DV`) contiennent les anciennes données : elles sont supprimées.
  - Les adresses ont été ajoutées en annotations de texte libre : elles sont supprimées.
  - La signature est incrustée dans le dessin de la page : les tracés situés dans la zone de signature sont
    supprimés.
  - Une seconde passe ne recopie que les objets utilisés. Contrôle sur fichier réel : aucune donnée de
    l'exemple ne subsiste dans l'AGI produit.

## 6. Architecture retenue

- **Python 3.11+ et PySide6 (Qt)** : interface macOS native en français. Choisi à la place de Swift pour pouvoir
  exécuter les tests de toute la logique dans l'environnement de développement (le compilateur Swift n'y est
  pas disponible).
- Lecture : `openpyxl` (lecture seule), `pdfminer.six` (texte positionné des PDF natifs).
- Écriture, recalcul, export PDF : **Microsoft Excel via AppleScript** (`osascript`), sans mise à jour des
  liaisons externes.
- AGI : `pypdf` (retrait des consignes) et `reportlab` (valeurs, cases, signature).
- Après chaque génération, **contrôle d'intégrité** : onglets, formules (1 495 dans le classeur réel), listes
  déroulantes et mises en forme conditionnelles comparés entre original et copie ; seules les cellules
  prévues peuvent différer.

## 7. Stratégie de test (mise en œuvre)

1. **Fixtures fictives** : `tests/fixtures/classeur_fictif_2026.xlsx` (structure et formules du classeur réel,
   personnes fictives, liens externes et métadonnées retirés ; absence de données réelles vérifiée
   automatiquement) et PDF de planning, de fiche de présence et d'AGI générés par les tests.
2. **Tests unitaires** (Swift, sans Excel) : extraction du planning, identification par nom/prénom/AVS
   (0, 1, plusieurs correspondances), statuts Validé/À vérifier/Erreur, blocage sur Erreur obligatoire,
   nommage, dossiers mensuels, versionnement anti-écrasement.
3. **Test d'intégrité du classeur** : comparaison formule par formule, onglets, noms définis, validations et
   mises en forme conditionnelles (XML `extLst`) **avant/après** écriture. Toute différence hors cellules de
   saisie attendues = échec.
4. **Chaîne complète** : sous Linux avec LibreOffice à la place d'Excel (mêmes écritures, formules réelles
   recalculées : D8 vide, montants numériques, nom et date affichés, PDF d'une page — vérifié sur les fichiers
   réels et sur le classeur fictif) ;
   sur le Mac avec Excel via `LANTERNE_TEST_EXCEL=1` sur une copie temporaire.
5. **Recette** avec Sarah sur une copie, un collaborateur fictif, puis un réel.

## 8. Éléments encore nécessaires

- Recette sur le Mac : premier lancement avec Excel (autorisations macOS), contrôle de l'aperçu AGI.
- Réponses aux points D2 et D8.
- Réponses de l'association pour l'AGI (caisse AVS, téléphone du club, contrat écrit, assureur LPP).
