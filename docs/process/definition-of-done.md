# Définition de terminé

Un lot est terminé seulement si :

- [ ] Les critères d'acceptation de la spec sont satisfaits (vérifiés un par un dans l'audit).
- [ ] Le comportement FR/EN est testé lorsque concerné.
- [ ] `pnpm typecheck` réussit (TypeScript strict).
- [ ] `pnpm lint` et `pnpm format:check` réussissent.
- [ ] Tests unitaires réussis.
- [ ] Tests d'intégration concernés réussis (PostgreSQL/Redis réels).
- [ ] Tests d'isolation multi-tenant réussis pour toute ressource ajoutée ou modifiée.
- [ ] Tests end-to-end critiques réussis.
- [ ] Build de production réussi.
- [ ] Migrations testées (up, et down lorsque possible) ; rollback documenté.
- [ ] Logs structurés et métriques nécessaires présents ; aucune donnée sensible dans les logs.
- [ ] Documentation à jour (spec, data-model, api-contracts, ADR si décision).
- [ ] Aucun secret exposé (scan secrets vert).
- [ ] Aucun constat BLOCKER ou HIGH ouvert.
- [ ] Verdict `auditor-opus` : `APPROVED` (et `security-opus` pour un lot critique).
- [ ] Heures humaines du lot renseignées.
- [ ] Un humain a autorisé la fusion (et, séparément, la production).

Chaque case cochée renvoie à une preuve : commande exécutée + extrait de sortie, ou lien vers le fichier.
