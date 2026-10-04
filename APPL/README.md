# Lanterne Paie — fiches de salaire et AGI

Application macOS locale, en français, qui prépare pour La Lanterne Magique :

- la fiche de salaire (copie Excel + PDF) de chaque collaborateur·trice salarié·e, par séance ;
- l'attestation de gain intermédiaire (AGI) remplie et signée ;
- un brouillon d'e-mail Outlook (jamais envoyé), un rapport et une sauvegarde.

**Confidentialité.** L'application fonctionne hors ligne. Elle n'envoie aucun document ni aucune donnée
salariale vers un service distant. La seule ouverture d'Internet est le brouillon Outlook dans Chrome,
à votre demande. Il contient le destinataire, l'objet et le texte ; vous joignez vous-même les PDF.

## Installation (une seule fois)

1. Installer **Python 3.11 ou plus récent** depuis <https://www.python.org/downloads/macos/>.
2. Vérifier que **Microsoft Excel** et **Google Chrome** sont installés.
3. Double-cliquer sur `Installer.command`. C'est le seul moment où une connexion Internet est nécessaire.
4. Lancer l'application avec `Lancer Lanterne Paie.command`.

La première fois, macOS demande deux autorisations :

- **« Lanterne Paie / Terminal souhaite contrôler Microsoft Excel »** : répondre *OK*
  (Réglages Système › Confidentialité et sécurité › Automatisation).
- Excel peut demander l'**accès au dossier** : choisir le dossier principal et cliquer *Accorder l'accès*.

Facultatif : `scripts/construire_app.command` crée une application `dist/Lanterne Paie.app`.

## Utilisation

1. **Dossier principal** : choisir le dossier de la saison, par exemple `09.26 - 06.27`. L'application détecte :
   - les **fichiers Excel** par année civile, d'après l'onglet Configuration, cellule B5. Les noms de fichiers ne
     sont pas codés en dur. Il y a un fichier par année civile, par exemple un pour 2026 et un pour 2027 ;
   - le **planning** : un PDF dont le nom contient « plan » ;
   - le **modèle AGI** : dans `Modèles/`, un PDF dont le nom contient « gain » et « modèle ».

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

   **Générer reste désactivé tant qu'une donnée obligatoire est en Erreur.**
5. **Générer** :
   1. Sauvegarde horodatée dans `Sauvegardes/`.
   2. Liste des cellules qui seront écrites (collaborateur, date de séance, prestation), à **confirmer**.
   3. Copie de travail `Fiche_salaire_NOM_Prenom_YYYY-MM.xlsx` : **le fichier Excel original n'est jamais
      modifié**.
   4. Excel écrit uniquement les cellules de saisie, **calcule lui-même**, enregistre et exporte la zone
      d'impression de « 4. Fiches de salaire » en PDF.
   5. Contrôles :
      - la cellule D8 est vide ;
      - le nom et la date de séance figurent sur la fiche ;
      - les montants sont numériques ;
      - le PDF fait une page ;
      - les onglets, les formules, les listes déroulantes et les mises en forme conditionnelles sont tous
        conservés ;
      - seules les cellules prévues ont changé.
   6. AGI remplie avec les montants de la fiche, sans aucun recalcul, puis signée et classée dans
      `AGI/<mois année>/`.
   7. Rapport HTML et JSON dans `Rapports/`, et journal dans `Rapports/journal.log`.
6. **Préparer l'e-mail** : ouvre un brouillon Outlook dans Chrome et affiche les PDF dans le Finder, à glisser
   dans le message. Statut affiché : *E-mail préparé – en attente d'envoi*.
7. **Ouvrir le dossier** / **Afficher le rapport**.

Si un mois compte deux séances (par exemple novembre 2026 à Chexbres), les fichiers portent la date complète :
`…_2026-11-07.pdf`, `…_2026-11-28.pdf`. Si un fichier existe déjà, l'application propose une version
alternative (`_v2`). Elle ne remplace ni ne supprime jamais un fichier.

## Réglages (bouton « Réglages… »)

- **Signature** : image PNG/JPG, ou signature dessinée dans l'application. La signature numérique certifiée
  est prévue pour une version future.
- **Réponses de l'association pour l'AGI** : lieu, téléphone du club, caisse AVS, assureur LPP, contrat
  écrit. Une valeur laissée vide conserve la consigne du modèle et la marque « À vérifier ».
- **Aperçu avec des données fictives** : à contrôler une fois. Cochez ensuite « J'ai contrôlé l'aperçu… » pour
  que les zones de l'AGI passent de « À vérifier » à « Validé ».
- **E-mail** : compte Outlook.com ou Microsoft 365, objet et texte du message.

## Règles respectées

- Aucune ligne, aucun onglet, aucune formule ni aucun taux n'est supprimé ou modifié. Seules les cellules de
  saisie déverrouillées sont écrites, et la protection des feuilles est laissée en place.
- Aucun montant n'est calculé par l'application : Excel calcule, l'application lit et recopie. Les montants
  sont affichés en CHF avec deux décimales.
- PDF natifs uniquement : un PDF scanné est signalé, sans reconnaissance de caractères (OCR).
- AGI : le modèle n'a pas de champs de formulaire. Chaque zone est repérée par un texte présent dans le modèle
  (`ressources/agi_gabarit.json`). Si ce texte est introuvable, la zone est marquée « À vérifier » et rien
  n'est écrit.

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
