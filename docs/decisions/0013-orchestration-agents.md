# ADR 0013 — Orchestration Opus/Sonnet et garde-fous des agents

- **Statut** : Proposé · **Date** : 2026-09-24

## Contexte
Le développement est réalisé par le porteur avec Claude. Il faut séparer conception/audit et
implémentation, empêcher l'auto-validation et imposer les interdits techniquement.

## Décision
- Fil principal sur Opus : cadrage, specs, arbitrages, synthèse.
- Sous-agent `developer-sonnet` (modèle Sonnet) : implémentation d'un lot **validé**.
- Sous-agents `auditor-opus` et `security-opus` (modèle Opus, sans Edit/Write) : audits indépendants.
- Cycle par lot (`docs/process/workflow-lots.md`) : Opus spécifie → humain valide → Sonnet développe →
  Opus audite → Sonnet corrige → Opus approuve → humain fusionne/déploie.
- Garde-fous : `CLAUDE.md` concis, règles ciblées `.claude/rules/` (frontmatter `paths`), hooks
  `PreToolUse` (commandes destructives, secrets, push forcé, infra), permissions `deny`/`ask`,
  `main` protégée, CI obligatoire.
- Écart assumé avec le prompt : `permissionMode: default` + `disallowedTools: Edit, Write` pour les
  auditeurs, au lieu de `plan`, afin qu'ils puissent rejouer tests et lint.
- Alias de modèles `opus`/`sonnet` dans les fichiers d'agents (identifiant complet possible pour figer).

## Conséquences
+ Audit indépendant, répétable, visible dans le dépôt. − Coût en tokens plus élevé (audits multiples).

## Risques
Hook trop large bloquant un usage légitime → suite de tests `.claude/hooks/test-guards.sh` ; faux
sentiment de sécurité → les hooks complètent, ne remplacent pas, la protection de branche et la CI.

## Réversibilité
Totale (fichiers de configuration).
