# Fixtures de test des frontières ESLint (H1)

Ce dossier ne contient **aucun code applicatif**. Chaque fichier est un import volontairement
invalide, utilisé uniquement par `tools/eslint-boundaries.test.mjs` pour prouver que
`eslint.config.mjs` détecte réellement chaque violation de frontière (`import-x/no-restricted-paths`,
`no-restricted-imports`, `no-restricted-syntax`).

- Exclu du typecheck (`tsconfig.json` de chaque paquet/app) et de `next build`.
- Exclu de `pnpm lint` en pratique via un commentaire `eslint-disable-next-line` sur chaque import :
  sans lui, `pnpm lint` échouerait en permanence sur ces fixtures. Le test dédié relance ESLint avec
  `linterOptions.noInlineConfig: true` pour ignorer ce commentaire et vérifier que la règle
  déclenche bien une erreur (`ruleId` + `severity === 2`) sur le fichier réel du monorepo.
- Ne jamais importer ces fichiers depuis du code applicatif réel.
