---
paths:
  - "infra/**/*"
  - ".github/**/*"
  - "**/Dockerfile"
  - "**/compose*.yaml"
---

# Règles DevOps

- Environnements `development`, `test`, `staging`, `production` : secrets, base, comptes PSP, domaines,
  webhooks et clés de notification séparés. Aucune donnée de production hors production.
- Images OCI standard, non-root, multi-stage, versions épinglées ; aucun stockage local persistant.
- Configuration par variables d'environnement validées au démarrage (schéma Zod) ; secrets externes.
- Infrastructure as Code (OpenTofu) ; aucun changement manuel non documenté en staging/production.
- Pipeline CI : install verrouillée → format → lint → typecheck → unitaires → intégration → isolation
  tenant → scan secrets → scan dépendances → build → e2e critiques → image → scan image → SBOM →
  staging → smoke → **validation humaine** → production progressive → vérification → rollback documenté.
- Aucun agent n'exécute `tofu apply`, un déploiement, une migration staging/production ou une commande
  avec des identifiants de production.
- Sauvegardes chiffrées, PITR, copie isolée ; aucun backup considéré fiable sans test de restauration.
- Tout service à coût variable est inscrit dans `docs/finance/operating-costs.md` avec son plafond
  avant activation.
