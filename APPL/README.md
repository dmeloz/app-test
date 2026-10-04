# Lanterne Paie — fiches de salaire et AGI

Application macOS locale, en français, qui prépare pour La Lanterne Magique :

- le remplissage de **votre fichier Excel** (collaborateur, date de séance, prestation, fiche de salaire) et le PDF
  de la fiche de salaire, pour chaque collaborateur·trice salarié·e et chaque séance ;
- l'attestation de gain intermédiaire (AGI) remplie et signée ;
- un brouillon d'e-mail Outlook (jamais envoyé), un rapport et une sauvegarde.

**Confidentialité.** L'application fonctionne hors ligne. Elle n'envoie aucun document ni aucune donnée
salariale vers un service distant. La seule ouverture d'Internet est le brouillon Outlook dans Chrome,
à votre demande. Il contient le destinataire, l'objet et le texte ; vous joignez vous-même les PDF.

## Installation (une seule fois)

### Méthode simple, sans rien installer d'autre que l'application

1. Ouvrir la page GitHub du dépôt, onglet **Actions**, puis le dernier passage réussi (coche verte) de
   **« Lanterne Paie (macOS) »**.
2. En bas de la page, dans **Artifacts**, télécharger **Lanterne-Paie-macOS**.
3. Double-cliquer sur le fichier téléchargé pour l'ouvrir. Si un fichier `.zip` apparaît, double-cliquer aussi
   dessus. Glisser ensuite **Lanterne Paie.app** dans le dossier **Applications**.
4. Au premier lancement : **clic droit › Ouvrir**, puis **Ouvrir**. L'application n'est pas signée par Apple,
   macOS demande donc une confirmation la première fois.

Il faut aussi **Microsoft Excel** et **Google Chrome**.

### Méthode développeur

Installer Python 3.11+, double-cliquer sur `Installer.command`, puis lancer avec
`Lancer Lanterne Paie.command`.

### Autorisations demandées par macOS la première fois

- **« Lanterne Paie souhaite contrôler Microsoft Excel »** : répondre *OK*.
- Excel peut demander l'**accès au dossier** : choisir le dossier de la saison et cliquer *Accorder l'accès*.

### Réglages à faire une seule fois (bouton « Réglages… »)

- **Signature** : cliquer sur **« Choisir un AGI signé… »** et sélectionner un AGI que vous avez déjà signé.
  L'application reprend votre signature et l'appose sur les AGI suivants.

C'est tout. Le reste est automatique :
- **Formulaire AGI** : le formulaire officiel vierge est fourni avec l'application.
- **Téléphone de l'AGI** : repris de la ligne « Comptabilité » de la fiche de présence.
- **Fichier ouvert** : si votre fichier Excel est ouvert dans Excel, l'application le signale et vous demande
  de le fermer.
- **Activité** : « Animateur·trice » par défaut, modifiable dans le tableau (« Animatrice »…).

## Utilisation

1. **Dossier principal** : choisir le dossier de la saison, par exemple `09.26 - 06.27`. L'application détecte :
   - les **fichiers Excel** par année civile, d'après l'onglet Configuration, cellule B5. Les noms de fichiers ne
     sont pas codés en dur. Il y a un fichier par année civile, par exemple un pour 2026 et un pour 2027 ;
   - le **planning** : un PDF dont le nom contient « plan » ;
   - le **modèle AGI** : dans `Modèles/`, un PDF dont le nom contient « gain » et « modèle ». Le formulaire
     officiel **remplissable** (716.105 f) est choisi en priorité. Un AGI déjà rempli convient aussi : il est
     entièrement vidé avant usage (champs, annotations, ancienne signature).

   Chaque fichier peut aussi être choisi à la main.
2. **Mois** : liste de juin à juin. Les fiches de présence de `Fiches de salaire/<mois année>/` apparaissent
   automatiquement, en PDF ou en Excel.
3. **Collaborateur·trice** : les intervenant·es lus dans la fiche de présence.
4. **Analyser** : le tableau de validation affiche, pour chaque donnée, la valeur détectée, sa source, son
   statut, une valeur corrigée (modifiable) et un commentaire.
   - **Validé** : donnée trouvée et cohérente entre les sources.
   - **À vérifier** : la fiche de présence et Excel diffèrent, la donnée est nouvelle ou a été déduite.
   - **Erreur** : donnée obligatoire absente ou invalide (N° AVS, IBAN, date…), ou plusieurs correspondances.
     Pour les homonymes, saisir le numéro de ligne dans « Valeur corrigée ».

      Le tableau contient aussi l'**activité exercée** pour l'AGI (« Animateur » ou « Animatrice », à adapter) et
   l'**état civil**, facultatif.

   **Générer reste désactivé tant qu'une donnée obligatoire est en Erreur.**
5. **Générer** :
   1. Sauvegarde horodatée de votre fichier Excel dans `Sauvegardes/` (version d'avant, en cas de besoin).
   2. Liste des cellules qui seront remplies (collaborateur, date de séance, prestation), à **confirmer**.
   3. **Votre fichier Excel est rempli directement** : aucun autre fichier Excel n'est créé. Excel écrit
      uniquement les cellules de saisie, **calcule lui-même**, enregistre et exporte la zone d'impression de
      « 4. Fiches de salaire » en PDF. Le fichier est relu juste avant : une même prestation n'est jamais
      ajoutée deux fois.
   5. Contrôles :
      - la cellule D8 est vide ;
      - le nom et la date de séance figurent sur la fiche ;
      - les montants sont numériques ;
      - le PDF fait une page ;
      - les onglets, les formules, les listes déroulantes et les mises en forme conditionnelles sont tous
        conservés ;
      - seules les cellules prévues ont changé (comparaison avec la sauvegarde).
   6. AGI remplie champ par champ, avec les montants de la fiche sans aucun recalcul et au format de
      l'association (mois en lettres, virgule décimale, « Contrat à durée déterminée d'un jour », caisse
      cantonale vaudoise…). Elle est signée et classée dans `AGI/<mois année>/`.
   7. Rapport HTML et JSON dans `Rapports/`, et journal dans `Rapports/journal.log`.
6. **Préparer l'e-mail** : ouvre un brouillon Outlook dans Chrome et affiche les PDF dans le Finder, à glisser
   dans le message. Statut affiché : *E-mail préparé – en attente d'envoi*.
7. **Ouvrir le dossier** / **Afficher le rapport**.

Si le fichier Excel est ouvert dans Excel, l'application vous demande de le fermer avant de le remplir.

Si un mois compte deux séances (par exemple novembre 2026 à Chexbres), les fichiers portent la date complète :
`…_2026-11-07.pdf`, `…_2026-11-28.pdf`. Si un fichier existe déjà, l'application propose une version
alternative (`_v2`). Elle ne remplace ni ne supprime jamais un fichier.

## Réglages (bouton « Réglages… »)

- **Signature** : image PNG/JPG, ou signature dessinée dans l'application. La signature numérique certifiée
  est prévue pour une version future.
- **Réponses de l'association pour l'AGI** :
  - lieu (vide = nom du club, par exemple « Chexbres ») ;
  - téléphone figurant sur l'AGI : **à saisir**, il n'est pas pré-rempli ;
  - caisse AVS (par défaut : Caisse Cantonale Vaudoise de Compensation) ;
  - assureur LPP.

  Les réponses fixes de l'association (questions 2 à 7, 11, 14 à 17) sont dans
  `ressources/agi_formulaire.json`.
- **Aperçu avec des données fictives**.
- **E-mail** : compte Outlook.com ou Microsoft 365, objet et texte du message.

## Règles respectées

- Aucune ligne, aucun onglet, aucune formule ni aucun taux n'est supprimé ou modifié. Seules les cellules de
  saisie déverrouillées sont écrites, et la protection des feuilles est laissée en place.
- Aucun montant n'est calculé par l'application : Excel calcule, l'application lit et recopie. Les montants
  sont affichés en CHF avec deux décimales.
- PDF natifs uniquement : un PDF scanné est signalé, sans reconnaissance de caractères (OCR).
- AGI : l'application remplit les **champs du formulaire officiel**. Un champ introuvable est marqué « À vérifier »
  et rien n'est écrit à sa place. Aucune donnée d'un AGI précédent ne subsiste dans le fichier produit, même
  invisible. Un modèle aplati, sans champs, reste pris en charge : chaque zone est alors repérée par un texte du
  modèle (`ressources/agi_gabarit.json`).

## Tests

```bash
./scripts/tester.command
# Sur vos propres fichiers, sans rien envoyer :
LANTERNE_DOSSIER_REEL="/Users/…/09.26 - 06.27" ./scripts/tester.command
# Génération réelle avec Excel, sur une copie temporaire du dossier :
LANTERNE_DOSSIER_REEL="…" LANTERNE_TEST_EXCEL=1 ./scripts/tester.command
```

Les tests utilisent uniquement des données fictives : `tests/fixtures/classeur_fictif_2026.xlsx` (structure et
formules du vrai classeur) et des PDF générés. Sous Linux, LibreOffice remplace Excel pour tester la chaîne
complète.

Détail de l'analyse des fichiers réels : [`docs/analyse-fichiers.md`](docs/analyse-fichiers.md).
