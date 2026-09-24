# Audit 7 (contre-audit limité, security-opus) — Lot L00 — 2026-09-24

- **Périmètre** : `5645bdd..a78d239` (garde-fou : N15, L-d, N16) + gouvernance `d3f9029`.
- **Verdict : APPROVED** pour le lot L00. Aucun constat BLOCKER, HIGH ou MEDIUM ouvert.

## Suivi
| Constat | Statut | Preuves |
|---|---|---|
| N15 | RÉSOLU | Les 6 scénarios de l'audit 6 sont bloqués ; toutes les règles hors `.env` lisent la commande brute ; plus aucune désynchronisation heredoc/bash pour ces règles. |
| L-d | RÉSOLU | 11 cas bloqués (`/bin/bash <<EOF`, `\| bash`, `\| sh`, `ssh host bash`, `env python3 -`, `docker compose exec -T api sh`, `sudo -u app bash -s`…). |
| N16 | RÉSOLU | Au-delà de 64 Ko → 2 en moins de 10 ms ; pire cas à 64 Ko : 11 à 24 s, sous le délai de 60 s. |

- **Tests** : `test-guards.sh` 107 « ok », 0 FAIL. 98 cas comparés avec `5645bdd`, aucune régression. Les 59 messages de commit réels de la branche ne sont pas bloqués.

## Constats non bloquants
- **[LOW] N17** — Faux marqueurs résiduels pour la règle `.env` uniquement : constructions adverses délibérées, déjà présentes avant ce diff.
- **[LOW/INFO]** — Indirections d'interpréteur non détectées pour la règle `.env` (`. /dev/stdin`, `$SHELL`, script écrit puis exécuté). Limite inhérente d'un hook Bash.
- **[INFO]** — `${#input}` compte des caractères et non des octets. Faux positifs prudents dans des messages de commit écrits via heredoc : contournement par Write + `git commit -F fichier`.

## Gouvernance (`d3f9029`) — cohérente, ne relâche rien d'autre
Précisions LOW conseillées :
- **G1** : aligner `workflow-lots.md` et `definition-of-done.md` sur la règle 11 (PR non brouillon ; checks `ci` et `docker-api` nommés).
- **G2** : « audit indépendant APPROVED » signifie *tous* les audits requis (security-opus en plus pour un lot critique), sur le SHA fusionné ; tout commit postérieur doit être audité ou limité à la documentation.
- **G3** : exiger que les approbations humaines obligatoires (`workflow-lots.md`) aient été obtenues avant la fusion.
- **G4** : interdire le contournement des checks (`gh pr merge --admin`, suppression ou modification du ruleset) dans la règle 11 et, idéalement, dans le hook.
- **INFO** : `docs/security/threat-model.md` (M15) cite encore la « revue humaine ».

## Décision du fil principal (Opus)
- Commits postérieurs à l'audit : `22d9153` (spec L01) et le présent fichier. **Documentation uniquement**, sans effet sur le code, les hooks ou la CI : pris en compte conformément à G2.
- **Fusion de la PR #2** selon la règle 11, sous réserve de la CI verte sur la tête finale.
- G1 à G4, N17 et l'INFO M15 sont traités dans la **première PR suivante** (lot P01), avec audit.
