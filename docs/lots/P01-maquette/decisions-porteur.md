# Lot P01 — Décisions du porteur en cours de lot

## 2026-09-27 — Suite de la revue sécurité 1 (S1) et de l'audit 1 (L1, L2, L3)

**Contexte.** `security-1.md` (S1, MEDIUM) et `audit-1.md` (L1) montrent que le blocage G4 ajouté au
garde-fou (`80954d6`) se contourne par des variantes courantes (`--method=PUT`, option collée, POST
implicite, GraphQL, `curl`, alias) et que l'outil MCP GitHub de fusion de PR, canal réellement utilisé
par le fil principal, n'est couvert par aucun hook. L2 (exception « documentation seule » à préciser),
L3/S3 (masquages résiduels du mode « stripped ») et S2 (faux positif « push forcé ») portent aussi sur
`.claude/` ou la règle 11.

**Décision D-P01-2 (porteur) : lot séparé.** Le renforcement du garde-fou et de la gouvernance
(S1 points 2 et 3, S2, S3, L1, L2, L3) est sorti de la PR P01 et fera l'objet d'un lot dédié
(`docs/lots/G01-garde-fou/spec.md`, statut PROPOSÉ, validation humaine requise). Dans la PR P01, ces
constats sont des **écarts connus, non corrigés**. Le commit `80954d6` reste en place : sans régression
(107 cas antérieurs verts, échec fermé préservé, N17 conforme selon les deux audits), il améliore
l'existant ; sa formulation « G4 bloqué dans le hook » doit se lire « partiellement bloqué ».

**Décision D-P01-3 (porteur) : barrière côté serveur vérifiée.** Le porteur déclare avoir vérifié que
le ruleset `protection-main` n'a **aucun acteur de contournement** (« bypass actors » vide). La règle
11 / G4 repose donc, pour le canal MCP, sur la protection GitHub côté serveur (PR obligatoire, checks
`ci` et `docker-api` obligatoires, push forcé et suppression interdits), qui s'applique quel que soit
l'outil utilisé. Statut : fait déclaré par le porteur, non vérifiable par l'agent.

**Décision D-P01-4 (fil principal) : frais et minimum (audit-1 M2).** Implémentés avec des valeurs
fictives plutôt qu'omis ; le porteur peut revenir sur ce choix.
