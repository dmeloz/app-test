# Audit 5 (contre-audit limité, security-opus) — Lot L00 — 2026-09-24

- **Périmètre** : `bfe18d0..b68575c` (correctif N12 du garde-fou `.env`, L-c). Hook réel sollicité localement, comparaison avec la version précédente.

## Suivi
| Constat | Statut |
|---|---|
| N12 | RÉSOLU pour les cas listés (7 N12 + 9 N11 bloqués, 3 modèles autorisés, 56/56) — mais régression N13 |
| L-c | RÉSOLU (138 fichiers / 9525 / 17 ; 8 fichiers de test api ; @app/config) |
| Autres règles du hook | Aucune régression (37 cas comparés) |

## Nouveaux constats
- **[HIGH] N14** — Échec **ouvert** de l'extraction (préexistant) : une entrée malformée (surrogate isolé, JSON invalide, `python3` absent) faisait sortir le hook en 1/127, ce qui laisse passer la commande et contourne toutes les règles. Exploitabilité par un agent jugée improbable, mais classée HIGH par principe.
- **[MEDIUM] N13** — Régression de N12 : un verbe précédé de `'`, `"`, `/` ou `\` n'était plus reconnu (`bash -c 'cat .env'`, `sh -c`, `docker compose exec … sh -c`, `ssh host '…'`, `eval`, `/bin/cat`, `\cat`).
- **[LOW] L-d** — Le retrait des corps de heredoc permettait `bash <<EOF` / `python3 - <<EOF` ; `<<<` et `$((a<<b))` étaient pris pour des heredocs.
- **[LOW] L-e** — `test-guards.sh` ne couvrait pas plusieurs règles existantes (force-with-lease, `+branche`, `:main`, clean, filter-branch, TRUNCATE, DATABASE_URL de prod, helm, Stripe live, sk_live_, printenv, openssl).
- **[INFO]** :
  - I-j : limites de la liste de verbes (`$(<.env)`, `dd if=`, `perl`, `curl -F @.env`…).
  - I-k : faux positifs conservateurs acceptables (`cp .env.example .env` bloqué, cohérent avec la condition de fusion n°4).

## Verdict
**CHANGES_REQUIRED** — N14 (HIGH) et N13 (MEDIUM), dans `.claude/` (périmètre du fil principal).

## Suivi Opus (fil principal)
- **N14** : `trap 'exit 2' ERR` et extraction en `if ! …; then block` ; JSON invalide ou vide → blocage ; `tool_input` ou `command` null → commande vide ; `command` non textuel sérialisé ; sortie encodée avec `replace` (surrogates). Vérifié : sans `python3` dans le `PATH` → code 2.
- **N13** : borne gauche du verbe `(?<![\w.-])`, fin de chaîne acceptée (`xargs cat`) ; mention `.env` précédée de `` ` $ @ : `` reconnue.
- **L-d** : corps de heredoc conservé et analysé quand le heredoc alimente un interpréteur (bash, sh, python, node, perl, ruby, ssh, eval, source, xargs) ; `<<<` et `$((…<<…))` exclus.
- **L-e** : 12 cas ajoutés pour les autres règles, plus 7 cas d'entrée malformée.
- `test-guards.sh` : **91/91**. Validation par un auditeur indépendant requise (audit 6).
