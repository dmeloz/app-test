# Reprise du projet (état au 2026-10-04)

- Dépôt : `dmeloz/app-test`, branche `claude/macos-payroll-automation-app-e5tceo`, dossier `APPL/`.
- Application : Python + PySide6 (macOS), « Lanterne Paie ». Guide : `README.md`. Analyse et décisions :
  `docs/analyse-fichiers.md`.
- Application téléchargeable : GitHub › Actions › « Lanterne Paie (macOS) » › dernier passage vert ›
  Artifacts › Lanterne-Paie-macOS (puce Apple uniquement ; non signée : « Ouvrir quand même »).

## Décisions de Sarah

- Fichier Excel rempli **directement** (pas de copie), sauvegarde horodatée avant chaque génération.
- Une fiche de salaire par séance (`YYYY-MM-JJ` si plusieurs séances dans le mois).
- Un classeur Excel par année civile (2026, 2027), saison d'octobre à juin.
- AGI : formulaire officiel remplissable, conventions de l'AGI de l'association ; point 8 sur la ligne
  « par mois ».

## Vérifié

- 44 tests (données fictives) ; serveur macOS GitHub vert (tests, fabrication, démarrage de l'app).
- Essai complet sur une copie des fichiers réels d'octobre 2026 (LibreOffice à la place d'Excel) :
  analyse, remplissage du fichier Excel, PDF fiche de salaire, AGI signé, rapport.

## Prochaines étapes

1. Premier essai de Sarah sur son Mac avec Microsoft Excel (autorisations macOS, export PDF par Excel).
2. Corriger ce que cet essai révèle (le pilotage AppleScript d'Excel n'a jamais tourné sur un vrai Mac).
3. Version Intel si le Mac de Sarah n'a pas de puce Apple.

Les fichiers réels de Sarah ne sont jamais versionnés : il faudra les lui redemander dans la nouvelle
discussion si besoin.
