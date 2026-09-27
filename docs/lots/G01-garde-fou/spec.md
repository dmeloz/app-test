# Lot G01 — Renforcement du garde-fou des agents et de la gouvernance de fusion

- **Statut** : PROPOSÉ (validation humaine requise avant toute implémentation)
- **Critique** : oui (sécurité du processus, modifie `.claude/` et la règle 11) → `auditor-opus` + `security-opus`
- **Origine** : `docs/lots/P01-maquette/security-1.md` (S1, S2, S3, S4), `docs/lots/P01-maquette/audit-1.md`
  (L1, L2, L3), décision D-P01-2 (`docs/lots/P01-maquette/decisions-porteur.md`)
- **Pré-requis** : P01 fusionné

## 1. Besoin

La règle 11 (G4) interdit toute fusion administrative et toute modification du ruleset. Le hook
`.claude/hooks/guard-bash.sh` ne l'applique que partiellement et ne voit pas les outils MCP. La vraie
barrière est la protection GitHub côté serveur (ruleset `protection-main` sans acteur de contournement,
D-P01-3) ; le hook est une défense en profondeur qui doit être cohérente avec ce qu'il affirme.

## 2. Périmètre

1. **G4 dans le hook** (S1 point 2, L1) : normaliser `gh api` (guillemets, `=`, option collée) ;
   bloquer toute méthode non GET, y compris implicite (`-f`, `-F`, `--field`, `--raw-field`,
   `--input`) vers `rulesets`, `protection`, `pulls/…/merge` ; `gh api graphql` avec mutation
   `*Ruleset*`, `*BranchProtection*`, `mergePullRequest` ; option admin de `pr merge` quelle que soit la
   position des options persistantes ; `gh alias set` contenant `merge` ; `curl`/`wget` vers
   `api.github.com` en méthode non GET. Retirer ou justifier la règle `gh ruleset` sans objet.
2. **Canal MCP** (S1 point 3) : hook `PreToolUse` ou règle `ask` sur l'outil MCP de fusion de PR et
   les outils MCP d'écriture de protection — **ou** décision écrite que G4 repose sur la protection
   serveur pour ce canal. Décision du porteur requise (impact : chaque fusion demanderait une
   confirmation humaine).
3. **Faux positif « push forcé »** (S2) : limiter les règles git au segment de commande (`[^;&|\n]*`).
4. **Mode « stripped »** (S3, L3) : conserver le corps d'un heredoc ouvert dans `$(…)`, après un
   délimiteur coupé par antislash ou `\<<` ; compléter les verbes de lecture (`sort`, `tr … <`,
   `dd if=`).
5. **Gouvernance** (L2) : préciser dans la règle 11 et `workflow-lots.md` que `CLAUDE.md`,
   `.claude/**`, `docs/process/**` et `.github/**` ne relèvent jamais de l'exception « documentation
   seule ».
6. **S4** : faux positif G4 sur un texte contenant « rulesets » (commentaire d'issue).

## 3. Critères d'acceptation

- **AC-G01-01** Toutes les variantes listées dans `security-1.md` S1 et `audit-1.md` L1 sont bloquées
  (code 2) dans `test-guards.sh` ; les lectures GET correspondantes restent autorisées (code 0).
- **AC-G01-02** Aucune régression : les 127 cas existants restent verts ; échec fermé préservé.
- **AC-G01-03** Les cas S2 et S3/L3 sont couverts par des tests (faux positif levé, masquage refermé).
- **AC-G01-04** Décision écrite pour le canal MCP (point 2).
- **AC-G01-05** Règle 11 et `workflow-lots.md` précisés (L2) ; `CLAUDE.md` < 200 lignes.

## 4. Hors périmètre

Toute modification du ruleset GitHub (action exclusivement humaine).

## 5. Temps (heures du porteur)

| Cadrage | Validation/revue | Tests manuels | Total |
|---|---|---|---|
| | | | |
