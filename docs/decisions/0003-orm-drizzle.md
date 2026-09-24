# ADR 0003 — Accès aux données : Drizzle + migrations SQL relues

- **Statut** : Proposé · **Date** : 2026-09-24

## Contexte
Besoins : RLS avec `SET LOCAL` par transaction, FK composites, contraintes CHECK, index partiels,
requêtes de capacité concurrentes (`UPDATE … WHERE reserved < max RETURNING`), migrations réversibles
relues par un humain et un auditeur.

## Options
1. **Drizzle ORM** (npm 0.45.3, pré-1.0) : schéma TypeScript proche du SQL, SQL brut typé facile,
   migrations SQL générées puis éditables.
2. **Prisma** (npm 8.0.0-rc.15 — version majeure en release candidate au 2026-09-24) : DX riche ;
   RLS possible via extensions client et transactions interactives ; migrations SQL générées ;
   CHECK/politiques RLS à écrire en SQL brut de toute façon.
3. SQL pur + Kysely (query builder typé).

## Décision
Option 1, avec règles : migrations SQL versionnées et relues (y compris RLS, rôles, CHECK) ; wrapper de
transaction unique posant `SET LOCAL app.tenant_id` ; SQL brut autorisé et typé pour les requêtes
critiques. Version exacte épinglée au L01.

## Conséquences
+ Contrôle fin du SQL, RLS naturelle, pas de moteur binaire, bonne portabilité.
− API encore en 0.x : changements possibles → épinglage et mise à jour contrôlée.

## Risques
Rupture d'API Drizzle → couche repository isolant l'ORM ; tests d'intégration sur PG réel.

## Réversibilité
Moyenne : les migrations sont du SQL standard (réutilisables avec Kysely/Prisma) ; seuls les
repositories seraient réécrits.
