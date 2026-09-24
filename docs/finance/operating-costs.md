# Coûts d'exploitation — tableau mensuel

> Aucun prix ci-dessous n'est vérifié : chaque ligne est complétée à l'activation du service, avec la
> source (page de tarifs + date). Tout service à coût variable est inscrit ici **avec son plafond avant
> activation**.

Légende type : **Réel** (payé) · **Gratuit temporaire** (offre gratuite/crédit, date de fin) · **Quota**
(inclus) · **Dépassement** (prix après quota).

| Service | Env. | Type | Coût mensuel | Quota inclus | Prix après dépassement | Plafond / alerte | Source + date | Remplaçabilité |
|---|---|---|---|---|---|---|---|---|
| Abonnement Claude | dev | Réel | à relever | — | — | — | | — |
| Domaine plateforme | prod | Réel (annuel) | à relever | — | — | — | | facile |
| Hébergement conteneurs | staging/prod | à choisir | à relever | | | à définir | | standard OCI |
| PostgreSQL géré | staging/prod | à choisir | à relever | | | | | standard |
| Redis géré | prod | à choisir | à relever | | | | | standard |
| Stockage objet | prod | à choisir | à relever | | | | | S3 |
| E-mail transactionnel | prod | à choisir | à relever | | | ex. X e-mails/jour | | port |
| Géocodage | prod | à choisir | à relever | | | ex. X requêtes/jour | | port |
| SMS | prod | après pilote | — | | | plafond obligatoire | | port |
| Observabilité (logs) | prod | à choisir | à relever | | | volume/jour | | OTel |
| OIDC | prod | à choisir | à relever | | | | | OIDC standard |
| Stripe (plateforme, abonnement SaaS) | prod | variable | frais par transaction | | | | | — |
| GitHub | dev | à relever | | | | minutes CI | | — |

## Budget incompressible avant commercialisation (à chiffrer)

Validation juridique (CGV, confidentialité, contrat SaaS, DPA) · avis fiduciaire (TVA) · test d'intrusion
externe · matériel pilote (tablette, imprimante réseau) · assurance RC professionnelle/cyber (à étudier).

## Suivi du temps du porteur (heures par lot)

| Lot | Cadrage | Validation/revue | Tests manuels | Total | Estimation initiale |
|---|---|---|---|---|---|
| Phase 1 — cadrage | | | | | 1–3 sem. |
