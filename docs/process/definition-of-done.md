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
- [ ] Verdict `auditor-opus` : `APPROVED` (et `security-opus` pour un lot critique) — tous les audits requis
      (G2), portant sur le SHA effectivement fusionné.
- [ ] Toutes les approbations humaines obligatoires du lot (`docs/process/workflow-lots.md`) obtenues
      **avant** la fusion (G3).
- [ ] Heures humaines du lot renseignées.
- [ ] Fusion par le fil principal selon la règle 11 de `CLAUDE.md` : audit indépendant `APPROVED` (G2),
      checks `ci` + `docker-api` nommés verts, aucun conflit, PR non brouillon (G1), aucun contournement des
      checks — jamais `gh pr merge --admin` ni modification du ruleset/de la protection de branche (G4) ;
      la mise en production reste soumise à une autorisation humaine explicite.

Chaque case cochée renvoie à une preuve : commande exécutée + extrait de sortie, ou lien vers le fichier.
