# Audit 4 (contre-audit limité) — Lot L00 — 2026-09-24

- **Auditeur** : auditor-opus · **Périmètre** : `15309bb..bfe18d0` (N11 `3e491eb`, L-a/L-b `a4abeb5`, R1-bis `bfe18d0`).
- **Vérifications rejouées sur clone propre** (toutes concordent avec le rapport) :
  - install `--frozen-lockfile`, format, lint : OK ;
  - typecheck : 10/10 ;
  - test sans build : 48 (33+9+3+3) ;
  - lint-boundaries : 17/17 ;
  - build : routes `ƒ` ;
  - log `req:{method,url}` sans query ;
  - e2e : 13 passed ;
  - test-guards : 45/45 ;
  - `pnpm audit` : aucune vulnérabilité ;
  - `playwright-report/index.html` créé et ignoré par git.

## Suivi
| Constat | Statut |
|---|---|
| N11 | RÉSOLU pour les cas listés (58 cas sondés), mais régression partielle → N12 |
| R1-bis | RÉSOLU (11 chiffres de preuve concordants) |
| L-a | RÉSOLU |
| L-b | RÉSOLU (titre 404 bilingue vérifié par curl + Chromium) |

## Nouveaux constats
- **[MEDIUM] N12** — `guard-bash.sh` n'examinait que la première mention `.env` : `cat .env.example; cat .env`, `cat .env .env.example`, `diff .env.example .env`… passaient.
- **[LOW] L-c** — Chiffres descriptifs périmés dans le rapport : statistiques du diff, nombre de fichiers de test de l'API, `@app/config` absent de la liste des paquets sans test.
- **[INFO]** :
  - I-h : limites inhérentes d'une liste de verbes (`python -c open`, etc.) ; défense en profondeur.
  - I-i : le HTML serveur de `/xx` n'a pas de `lang` et a un corps vide avant hydratation ; à traiter au prochain passage sur les 404.

## Verdict
**CHANGES_REQUIRED** — 0 BLOCKER, 0 HIGH ; N12 (MEDIUM, périmètre `.claude/` du fil principal). Audit 5 limité à N12 et L-c.

## Suivi Opus (fil principal) — commit `1ab8ee3`
- **N12** : la règle `.env` examine toutes les mentions (analyse Python), couvre les globs `.env*`, `diff`/`tac`/`nl`/`od`, `. ./.env` ; limite documentée. `test-guards.sh` : **56/56**.
- **L-c** : statistiques figées sur `bfe18d0` (138 fichiers, 9525 insertions, 17 suppressions), 8 fichiers de test api, `@app/config` ajouté.
- N12 ayant été corrigé par le fil principal, sa validation revient à un **auditeur indépendant** (audit 5).
