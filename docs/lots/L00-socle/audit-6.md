# Audit 6 (contre-audit limité, security-opus) — Lot L00 — 2026-09-24

- **Périmètre** : `b68575c..5645bdd` (garde-fou bash : N14, N13, L-d, L-e). Tests sur des copies des deux versions du hook ; aucune commande testée n'est exécutée.
- `test-guards.sh` à `5645bdd` : 91/91, EXIT=0.

## Suivi
| Constat | Statut |
|---|---|
| N14 (échec fermé) | **RÉSOLU**. Surrogate, JSON invalide/vide/profond, données après le JSON, BOM, `python3` absent, entrée > 128 Ko → 2 ; aucun faux blocage sur 17 commandes normales. |
| N13 | **RÉSOLU**. 8 cas de l'audit 5 + `xargs cat` + backticks bloqués ; aucun faux positif sans mention `.env` (`concat`, `category`, `tailwind`…). |
| L-d | **PARTIEL**. `/bin/bash <<EOF` et `cat <<EOF \| bash` non couverts. |
| L-e | **RÉSOLU**. 12 règles couvertes, plus 7 cas d'entrée malformée. |
| Régressions | Aucune (43 cas comparés). |

## Nouveaux constats
- **[MEDIUM] N15** — Décalage entre la lecture des heredocs par le hook et par bash. Un faux marqueur (`echo '<<EOF'`, `# <<EOF`, `(( x = 1<<Y ))`, délimiteur tronqué `<<EOF-X` ou `<<'EOF'X`) masquait les lignes suivantes à **toutes** les règles. Défaut préexistant.
- **[LOW] N16** — Coût quadratique des regex git : 125 Ko → 56 s, contre un délai de hook de 60 s. Risque d'échec ouvert sur une machine lente.
- **[INFO]** : limites connues de la liste de verbes (`"cat"`, `$(<.env)`, `dd`, `perl`…) ; faux positifs prudents (`cp .env.example .env`).

## Verdict
**CHANGES_REQUIRED** — seul N15 (MEDIUM) empêche l'APPROVED. Aucun BLOCKER ni HIGH.

## Suivi Opus (fil principal)
- **N15** (option (a) recommandée par l'audit) : toutes les règles s'appliquent désormais à la **commande brute**. Le retrait des corps de heredoc ne sert plus qu'à la règle des fichiers de secrets, et il est durci : le marqueur doit être hors guillemets, hors commentaire et hors `((…))`, et le délimiteur doit être suivi d'un métacaractère ou de la fin de ligne. En cas de doute, le corps est conservé. Faux positif prudent assumé : un document qui décrit une commande interdite s'écrit avec l'outil Write, pas avec un heredoc bash.
- **L-d résiduel** : l'interpréteur est cherché sur toute la ligne, avec la borne gauche de N13 (`/bin/bash <<EOF`, `cat <<EOF | bash`).
- **N16** : entrée de plus de 64 Ko refusée d'emblée.
- Tests ajoutés : les 6 scénarios N15, les 3 cas L-d, 1 cas N16 et 5 branches jusque-là sans test. `test-guards.sh` : **107/107**.
- Validation par un auditeur indépendant requise (audit 7).
- Note : la condition « fusion sur `main` par l'humain uniquement » citée par l'audit est remplacée par la règle 11 de `CLAUDE.md`, modifiée par le porteur (`d3f9029`).
