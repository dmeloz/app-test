---
paths:
  - "apps/**/*"
  - "packages/**/*"
---

# Règles d'architecture

- Monolithe modulaire : `apps/api/src/modules/<module>/` avec un fichier `index.ts` public. Un module
  n'importe jamais les fichiers internes d'un autre module, seulement son `index.ts`.
- Modules du domaine : identity, platform, subscription, tenant, restaurant, location, branding, catalog,
  menu, availability, capacity, cart, pricing, promotion, checkout, order, payment, refund, delivery,
  customer, consent, notification, integration, reporting, audit, support.
- `packages/domain` est pur : aucune dépendance à NestJS, Next.js, Drizzle, Stripe, Redis ou au réseau.
  Prix, taxes, promotions, machine à états, capacité et zones y sont testés unitairement.
- Fournisseurs externes (Stripe, e-mail, SMS, cartographie, imprimante, caisse, livraison, stockage) :
  port (interface) dans le module, adaptateur dans `adapters/<fournisseur>/`. Le domaine ne connaît
  jamais le SDK du fournisseur. Chaque port a un adaptateur factice pour les tests.
- Effets de bord asynchrones (e-mails, impressions, intégrations) via l'outbox PostgreSQL écrite dans la
  même transaction que le changement métier (ADR 0007). Jamais d'appel externe dans une transaction DB.
- Contrats d'API : schémas Zod dans `packages/contracts`, source unique pour la validation et l'OpenAPI.
- Ajout d'une dépendance de production, d'un module ou changement de contrat public : validation humaine.
- Préférer la solution la plus simple qui reste robuste ; pas d'abstraction sans deuxième cas d'usage réel,
  sauf pour les ports fournisseurs.
