# Workflow de développement par lot — Opus / Sonnet / Humain

Ce cycle se répète **pour chaque lot important**. Il ne s'agit pas de faire « Opus une fois, puis Sonnet
jusqu'à la fin ».

```text
1. OPUS    analyse et prépare      cadrage, architecture, modèle de données, sécurité, spec, critères, backlog
2. HUMAIN  valide le plan          Sonnet ne commence pas avant un accord explicite
3. SONNET  développe               code, migrations, tests, documentation technique, build
4. OPUS    audite                  diff, sécurité, multi-tenant, paiements, régressions, qualité des tests
5. SONNET  corrige                 tous les BLOCKER et HIGH (MEDIUM : corrigés ou justifiés)
6. OPUS    valide définitivement   contre-audit → APPROVED
7. OPUS    fusionne               PR fusionnée si audit APPROVED + CI verte + aucun conflit (règle 11)
8. HUMAIN  autorise                déploiement de production
```

## Rôles et outils

| Étape | Acteur | Mécanisme Claude Code | Sortie écrite |
|---|---|---|---|
| 1 | Opus (fil principal) | session lancée avec le modèle Opus | `docs/lots/<lot>/spec.md` (statut `PROPOSÉ`) |
| 1b | Opus (option) | sous-agent `auditor-opus` sur la spec | `docs/lots/<lot>/spec-review.md` |
| 2 | Humain | réponse explicite « je valide le lot X » | spec passée à `VALIDÉ` + date + nom |
| 3 | Sonnet | sous-agent `developer-sonnet` | commits sur branche + `implementation-report.md` |
| 4 | Opus | sous-agents `auditor-opus` (+ `security-opus` si lot critique) | `audit-1.md` (+ `security-1.md`) |
| 5 | Sonnet | sous-agent `developer-sonnet` avec la liste des constats | commits + rapport mis à jour |
| 6 | Opus | sous-agent `auditor-opus` (contre-audit) | `audit-2.md` → `APPROVED` |
| 7 | Opus (fil principal) | fusion de la PR (merge commit) si audit `APPROVED`, checks `ci` + `docker-api` verts, aucun conflit | PR fusionnée, commentaire de fusion citant l'audit |
| 8 | Humain | autorisation du déploiement de production | journal de déploiement |

Les boucles 4 → 5 → 6 se répètent tant que le verdict n'est pas `APPROVED`. Au-delà de 3 boucles sur un
même constat, Opus remonte le problème à l'humain (probable défaut de spécification).

## Invocation type (depuis le fil principal Opus)

```text
Utilise le sous-agent developer-sonnet pour implémenter le lot L03 selon docs/lots/L03-catalog/spec.md
(statut VALIDÉ). Fichiers concernés : packages/db/src/schema/catalog.ts, apps/api/src/modules/catalog/**.
Critères d'acceptation : AC-L03-01 à AC-L03-09. Rends le rapport d'implémentation.
```

```text
Utilise le sous-agent auditor-opus pour auditer la branche lot/L03-catalog contre
docs/lots/L03-catalog/spec.md et implementation-report.md. Rejoue lint, typecheck et tests.
```

## Lots critiques — audit Opus obligatoire, jamais validés par Sonnet seul

Architecture initiale · modèle multi-tenant · authentification et autorisations · paiements et
remboursements · webhooks · prix, taxes, promotions · machine à états des commandes · créneaux et capacité ·
migrations PostgreSQL · données personnelles et consentements · export et suppression · sauvegardes et
restauration · infrastructure de production · intégrations POS/imprimante/livraison · incident de
sécurité · mise en production majeure.

Pour ces lots : `security-opus` en plus de `auditor-opus`, et validation humaine de la spec **obligatoire**.

## Approbation humaine obligatoire (quel que soit le lot)

Architecture majeure · nouvelle dépendance de production · contrat API public · migration destructive ·
modèle de tenancy · règle fiscale ou légale · calcul de prix ou de taxe · paiement/remboursement/transfert ·
allergènes · permissions · secret ou configuration de production · déploiement de production ·
suppression ou export massif · activation de l'alcool.

## Vérification du modèle réellement utilisé

Avant chaque phase critique, vérifier le modèle servi (`/model`, ou métadonnées de session) et noter toute
substitution dans le rapport du lot. Ne pas définir de variable d'environnement forçant un modèle unique
pour tous les sous-agents : elle annulerait la séparation Opus/Sonnet.

## Suivi du temps

Chaque lot note les heures humaines passées (cadrage, validation, revue, tests manuels) dans
`docs/lots/<lot>/spec.md` § Temps, pour mesurer le coût économique réel.

## Modèles des sous-agents

Les fichiers `.claude/agents/*.md` utilisent les alias `model: opus` et `model: sonnet`, résolus par
Claude Code vers la version courante de chaque famille chez le fournisseur configuré. Pour figer une
version (reproductibilité), remplacer l'alias par l'identifiant complet du modèle dans le frontmatter ;
si le fournisseur ne le reconnaît pas, revenir à l'alias. Ne jamais définir de variable d'environnement
qui force un modèle unique pour tous les sous-agents.
