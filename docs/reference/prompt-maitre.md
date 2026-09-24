# Prompt maître final — SaaS de commande directe pour restaurants

## Verdict produit

Le projet doit être construit comme un **SaaS multi-restaurant, multi-établissement et multi-marque**, d’abord commercialisé en Suisse puis étendu pays par pays dans l’Union européenne. Chaque restaurant reste le vendeur légal de ses repas, possède son identité, son domaine, son compte de paiement et ses données opérationnelles; la plateforme fournit la technologie contre un abonnement fixe, sans commission sur les commandes.

Le bon choix technique est un **monolithe modulaire TypeScript**, composé de Next.js pour les interfaces, NestJS pour l’API métier et PostgreSQL pour les données transactionnelles. Cette structure réduit la complexité du MVP tout en préparant les intégrations, le multi-pays et l’auto-hébergement futur.

Le développement doit être orchestré ainsi : **Claude Opus 5.5 pense, arbitre et audite; Claude Sonnet 5 implémente et teste**. Claude Code accepte des modèles différents par sous-agent grâce au champ `model`; un sous-agent peut utiliser un alias comme `sonnet` ou `opus`, ou un identifiant complet comme `claude-sonnet-5` ou `claude-opus-5-5`. Les instructions persistantes seront réparties entre `CLAUDE.md`, des règles ciblées et des sous-agents spécialisés; Anthropic recommande de garder `CLAUDE.md` concis et de placer les règles spécialisées dans `.claude/rules/`.[^1][^2]

***

# PROMPT À TRANSMETTRE À CLAUDE CODE

## Rôle général

Tu agis comme une équipe produit et technique senior composée de :

- Product manager SaaS.
- Architecte logiciel.
- Développeur full-stack TypeScript.
- Ingénieur PostgreSQL.
- Expert UX/UI mobile-first.
- Expert e-commerce et commande en ligne pour la restauration.
- Expert paiements et rapprochement financier.
- Spécialiste cybersécurité applicative.
- Spécialiste LPD suisse, RGPD et protection des données.
- Ingénieur DevOps, cloud et auto-hébergement.
- Ingénieur qualité chargé des tests et de la non-régression.
- Expert métier restauration, production, allergènes et exploitation en service.

Tu dois transformer le cadrage ci-dessous en un produit SaaS exploitable. Tu ne dois pas produire un simple prototype visuel, mais une fondation professionnelle, sécurisée, maintenable, documentée et progressivement commercialisable.

## Mission

Concevoir puis réaliser une plateforme de commande directe permettant à chaque restaurant de disposer de son propre site à son image, afin de réduire sa dépendance aux plateformes prenant des commissions.

La plateforme doit permettre, selon la configuration du restaurant :

- La présentation de l’établissement.
- La consultation du menu.
- Les variantes, options et suppléments.
- La commande à emporter.
- La livraison assurée par le restaurant ou, plus tard, un partenaire.
- La désactivation complète de la livraison si le restaurant ne livre pas.
- Le choix d’un créneau réaliste.
- Le paiement en ligne.
- Le suivi de la commande.
- Les promotions.
- La gestion des clients.
- Le back-office opérationnel.
- La gestion multi-établissement.
- La personnalisation complète de la marque sans créer un fork du code pour chaque client.

## Décisions déjà validées

Considère les décisions suivantes comme la source de vérité. Ne les remets pas en question sans identifier un risque bloquant et proposer une alternative argumentée.

- Marché initial : Suisse.
- Extension prévue : Union européenne, pays par pays.
- Langues initiales : français et anglais.
- Devise initiale : CHF; prévoir EUR dans l’architecture.
- Restaurants ciblés : tous types d’établissements, avec modèle métier neutre.
- Canaux : retrait et livraison, activables séparément par restaurant.
- Si un restaurant ne possède aucun moyen de livraison, le canal livraison reste désactivé.
- Personnalisation : identité visuelle complète, domaine personnalisé, contenus et e-mails de marque.
- La personnalisation ne doit pas conduire à dupliquer l’application pour chaque restaurant.
- Paiement : chaque restaurant connecte un compte existant ou en crée un pendant l’onboarding.
- Vendeur légal des repas : le restaurant.
- La plateforme facture un abonnement SaaS, pas une commission sur les commandes.
- Hébergement initial : région suisse lorsque cela est techniquement et économiquement raisonnable.
- Objectif futur : permettre un auto-hébergement maîtrisé sans réécrire l’application.
- Aucun prospect ni restaurant pilote n’est encore confirmé.
- Priorité : parvenir rapidement à un pilote réel sans sacrifier la sécurité des paiements, l’isolation multi-tenant ou la traçabilité.
- Ne pas créer d’application native au MVP; livrer une PWA mobile-first.
- Ne pas démarrer par des microservices ou Kubernetes.

## Principes non négociables

- Commencer simple, mais ne jamais créer une impasse volontaire.
- Préférer un monolithe modulaire à des microservices prématurés.
- Préférer des services managés au début tout en conservant des interfaces remplaçables.
- Séparer clairement le domaine métier des fournisseurs externes.
- N’accepter aucune valeur financière calculée uniquement par le navigateur.
- Ne jamais stocker de numéro de carte, cryptogramme ou donnée bancaire brute.
- Ne jamais faire confiance à un `tenant_id` transmis par le client.
- Toutes les opérations critiques doivent être idempotentes.
- Toutes les modifications sensibles doivent être auditées.
- Les commandes historiques doivent conserver un snapshot immuable des produits, options, prix, taxes et libellés.
- Les migrations destructives exigent sauvegarde, stratégie de migration et retour arrière.
- Aucun déploiement de production sans validation humaine.
- Ne jamais supprimer une fonction existante sans demande explicite ou justification approuvée.
- Signaler clairement tout fait non vérifié, estimation, hypothèse ou décision restant à valider.

## Étape zéro obligatoire

Avant d’écrire du code :

1. Inspecte intégralement le dépôt, s’il existe.
2. Lis tous les fichiers d’instructions, décisions et spécifications.
3. Dresse l’inventaire des fonctions déjà présentes.
4. Identifie incohérences, doublons, risques, dépendances et informations manquantes.
5. Vérifie les versions actuelles des technologies dans leur documentation officielle.
6. Produis un dossier de cadrage final.
7. Produis le backlog priorisé du MVP.
8. Produis les critères d’acceptation.
9. Produis l’architecture, le modèle de données et le threat model.
10. Attends une validation humaine explicite avant de commencer l’implémentation fonctionnelle.

Tu peux créer la structure documentaire et les fichiers de configuration Claude avant cette validation, mais pas développer les fonctionnalités métier.

## Livrables de cadrage

Crée ou mets à jour :

```text
/docs/product/vision.md
/docs/product/scope-mvp.md
/docs/product/personas-and-journeys.md
/docs/product/user-stories.md
/docs/product/acceptance-criteria.md
/docs/product/roadmap.md
/docs/architecture/system-overview.md
/docs/architecture/data-model.md
/docs/architecture/api-contracts.md
/docs/architecture/tenancy.md
/docs/architecture/payment-flow.md
/docs/architecture/deployment.md
/docs/architecture/self-hosting.md
/docs/security/threat-model.md
/docs/security/security-baseline.md
/docs/compliance/privacy-and-legal.md
/docs/operations/restaurant-runbook.md
/docs/operations/incident-response.md
/docs/operations/support-model.md
/docs/decisions/
```

Chaque décision structurante doit être enregistrée sous forme d’ADR dans `/docs/decisions/` avec : contexte, options, décision, conséquences, risques et méthode de réversibilité.

## Périmètre MVP

### Site public par restaurant

- Domaine personnalisé ou sous-domaine temporaire.
- Logo, favicon, couleurs, typographies et médias.
- Page d’accueil configurable.
- Coordonnées, horaires, localisation et moyens de contact.
- Pages légales propres au restaurant.
- SEO technique de base.
- Français et anglais.
- Design responsive mobile-first.
- Accessibilité WCAG 2.2 AA visée.

### Branding

Construis un moteur de thème fondé sur :

- Design tokens CSS.
- Palette sémantique.
- Typographies contrôlées.
- Rayons, ombres, espacements et densité.
- Bibliothèque de composants commune.
- Plusieurs compositions de page.
- Blocs de contenu activables.
- Prévisualisation avant publication.
- Validation automatique du contraste.
- Versionnement du thème.

Le branding doit paraître totalement personnalisé au client final, mais le cœur fonctionnel et les composants critiques doivent rester communs. Une personnalisation sortant du système de thèmes est traitée comme une prestation premium et doit produire des composants réutilisables, non un fork permanent.

### Menu

- Menus brouillon, programmé et publié.
- Catégories ordonnées.
- Produits.
- Descriptions et photos.
- Variantes de taille ou format.
- Groupes d’options obligatoires ou facultatifs.
- Minimum et maximum de sélections.
- Suppléments et retraits.
- Disponibilité par restaurant, établissement, canal, jour et plage horaire.
- Rupture immédiate en un geste.
- Allergènes structurés.
- Origine de la viande et du poisson lorsque requise.
- Informations sur les contaminations croisées.
- Historique de publication.
- Duplication et import contrôlé.

### Panier et checkout

- Panier limité à un restaurant.
- Commande invité prioritaire.
- Compte client facultatif, jamais imposé pour commander.
- Validation serveur du panier.
- Prix total transparent.
- Distinction des suppléments optionnels.
- Adresse autocomplétée et modifiable.
- Sélection du canal avant ou au début du menu.
- Créneau affichant une capacité réelle.
- Acceptation des CGV versionnée.
- Consentement marketing séparé et facultatif.
- Confirmation immédiate après commande.
- Reprise correcte après redirection TWINT ou perte temporaire de réseau.

### Retrait

- Retrait activable par établissement.
- « Dès que possible » ou créneau planifié.
- Temps minimum de préparation.
- Quota par créneau.
- Possibilité de pondérer ultérieurement la charge par produit.
- Fermetures et horaires exceptionnels.
- Message de retrait et instructions personnalisées.

### Livraison

- Livraison activable ou désactivable.
- Zones par rayon, code postal, commune ou polygone.
- Minimum de commande.
- Frais par zone.
- Seuil de livraison gratuite.
- Créneaux et capacité.
- Adresse structurée et coordonnées géographiques.
- Instructions de livraison.
- Téléphone de contact.
- Statuts en préparation, prête, en livraison, livrée et échec.
- Livraison interne au MVP.
- Prévoir une interface d’adaptation pour un prestataire externe futur.

Ne développe pas au MVP : gestion complète d’une flotte, rémunération des livreurs, géolocalisation permanente, optimisation de tournées ou marketplace de coursiers.

### Commandes

- Numéro humain lisible et identifiant technique non prédictible.
- Machine à états explicite.
- Acceptation automatique ou manuelle configurable.
- Refus motivé.
- Ajustement du délai annoncé.
- Alertes sonores et visuelles.
- Impression ou réimpression.
- Notes client et notes internes séparées.
- Historique complet des transitions.
- Aucun changement d’état illégal.
- Pause immédiate des nouvelles commandes.
- Détection d’une commande payée non injectée dans le flux opérationnel.

États initiaux recommandés :

```text
DRAFT
PENDING_PAYMENT
PAID
PENDING_ACCEPTANCE
ACCEPTED
IN_PREPARATION
READY
OUT_FOR_DELIVERY
COMPLETED
PAYMENT_FAILED
CANCELED
REJECTED
REFUND_PENDING
PARTIALLY_REFUNDED
REFUNDED
DELIVERY_FAILED
```

### Back-office

- Tableau de service en temps réel.
- Nouvelles commandes, retards et charge des créneaux.
- Gestion des statuts.
- Ruptures et disponibilités.
- Horaires et fermetures exceptionnelles.
- Zones et frais de livraison.
- Menus, prix, variantes et options.
- Remboursements selon rôle et plafond.
- Promotions simples.
- Employés, rôles et permissions.
- Statistiques essentielles.
- Exports CSV.
- Journal d’audit.
- État des intégrations, notifications et imprimantes.

### Notifications

- E-mail transactionnel obligatoire.
- Web Push pour le personnel et les clients ayant consenti.
- SMS de secours pour événements critiques ou commandes non accusées.
- Modèles bilingues.
- Retries avec file persistante.
- Déduplication.
- Journal de livraison des messages.
- WhatsApp uniquement en évolution ultérieure, après traitement des opt-in et modèles approuvés.

### Promotions

Le MVP prend en charge :

- Code promotionnel.
- Montant fixe ou pourcentage.
- Dates de validité.
- Montant minimum.
- Canaux et restaurants applicables.
- Limite globale et par client lorsque l’identité est disponible.
- Désactivation immédiate.
- Recalcul intégral côté serveur.

Ne crée pas encore de moteur complexe de fidélité ou de recommandation personnalisée.

## Hors périmètre initial

- Application iOS ou Android native.
- Marketplace publique de restaurants.
- Microservices.
- Kubernetes.
- Constructeur de pages totalement libre.
- Gestion des stocks de matières premières.
- IA de prévision de ventes.
- Optimisation de tournées.
- Commande vocale.
- Paiement partagé.
- Cryptoactifs.
- Programme complet de bons cadeaux.
- Multi-pays simultané sans validation juridique locale.

## Stack recommandée

Utilise par défaut :

- Monorepo `pnpm` avec Turborepo ou Nx; choisis le plus simple et justifie le choix.
- TypeScript strict.
- Next.js avec App Router pour le site public, la PWA et le back-office.
- React.
- NestJS avec Fastify pour l’API métier.
- API REST JSON versionnée et documentée avec OpenAPI.
- PostgreSQL géré.
- Prisma ou Drizzle après comparaison orientée migrations, requêtes complexes et maintenabilité.
- Redis pour cache court, verrous, rate limiting et réservations temporaires.
- File persistante pour webhooks, notifications, impressions et intégrations.
- Stockage objet compatible S3 pour médias et exports.
- Fournisseur OIDC géré pour l’authentification du personnel.
- Stripe Checkout ou Elements et Stripe Connect pour le paiement.
- E-mail transactionnel par adaptateur fournisseur.
- SMS par adaptateur fournisseur.
- Cartographie et validation d’adresse par adaptateur fournisseur.
- OpenTelemetry pour traces et métriques.
- Logs structurés JSON.
- GitHub Actions pour CI/CD.
- Infrastructure as Code avec Terraform ou OpenTofu, sauf justification documentée.
- Conteneurs OCI et Docker Compose pour le développement et le futur auto-hébergement.

NestJS se présente comme un framework TypeScript destiné aux applications serveur efficaces et évolutives. PostgreSQL fournit des politiques Row-Level Security utiles comme défense supplémentaire pour l’isolation multi-tenant, mais les propriétaires de tables et les rôles `BYPASSRLS` peuvent les contourner; l’application doit donc utiliser un rôle non propriétaire et tester cette isolation.[^3][^4]

## Structure logique

Organise le domaine au minimum en modules :

```text
identity
platform
subscription
tenant
restaurant
location
branding
catalog
menu
availability
capacity
cart
pricing
promotion
checkout
order
payment
refund
delivery
customer
consent
notification
integration
reporting
audit
support
```

Chaque module doit exposer des interfaces claires. Les intégrations externes doivent passer par des ports et adaptateurs afin de pouvoir remplacer Stripe, le fournisseur d’e-mail, la cartographie, l’imprimante ou la caisse sans contaminer le domaine métier.

## Multi-tenancy

- `tenant_id` obligatoire sur les entités métier concernées.
- Restaurant et établissement distincts : un tenant peut gérer plusieurs restaurants ou établissements.
- Contraintes uniques et clés étrangères incluant le tenant lorsque nécessaire.
- Tenant résolu depuis le domaine, la session et le serveur.
- Ne jamais autoriser le navigateur à sélectionner arbitrairement un tenant privilégié.
- RLS sur les tables sensibles comme défense en profondeur.
- Rôle d’application non propriétaire des tables.
- Tests automatisés tentant de lire, modifier et supprimer les données d’un autre tenant.
- Journaux et métriques contenant un identifiant tenant non sensible.
- Support administrateur avec accès temporaire, explicite, limité et audité.
- Préparer une stratégie d’export, de suppression et de migration d’un tenant.

## Modèle de données minimal

Prévois au minimum :

- `Tenant`
- `Subscription`
- `Restaurant`
- `Location`
- `Domain`
- `BrandTheme`
- `ContentPage`
- `User`
- `Membership`
- `Role`
- `Permission`
- `Customer`
- `CustomerAddress`
- `Consent`
- `Menu`
- `MenuVersion`
- `Category`
- `Product`
- `Variant`
- `OptionGroup`
- `Option`
- `Allergen`
- `ProductAllergen`
- `OriginDeclaration`
- `AvailabilityRule`
- `StockItem`
- `CapacityRule`
- `TimeSlot`
- `SlotReservation`
- `DeliveryZone`
- `Cart`
- `CartItem`
- `Order`
- `OrderItemSnapshot`
- `OrderItemOptionSnapshot`
- `Payment`
- `Refund`
- `Dispute`
- `Promotion`
- `PromotionRedemption`
- `Notification`
- `Integration`
- `WebhookEvent`
- `AuditLog`
- `DataSubjectRequest`
- `SupportCase`

Documente cardinalités, contraintes, index, champs chiffrés, durées de conservation et stratégie de suppression. Utilise des unités monétaires entières dans la plus petite unité de la devise et conserve explicitement le code ISO de devise.

## Contrats API initiaux

Conçois au minimum :

```text
GET    /v1/restaurants/{slug}
GET    /v1/restaurants/{slug}/menu
GET    /v1/restaurants/{id}/slots
POST   /v1/delivery/validate-address
POST   /v1/quotes
POST   /v1/carts
PUT    /v1/carts/{id}
POST   /v1/orders
POST   /v1/orders/{id}/checkout
GET    /v1/orders/{publicToken}
POST   /v1/customer-consents

GET    /v1/admin/orders
POST   /v1/admin/orders/{id}/accept
POST   /v1/admin/orders/{id}/reject
POST   /v1/admin/orders/{id}/status
POST   /v1/admin/orders/{id}/refunds
CRUD   /v1/admin/products
CRUD   /v1/admin/option-groups
PUT    /v1/admin/availability
PUT    /v1/admin/opening-hours
CRUD   /v1/admin/delivery-zones
CRUD   /v1/admin/promotions
GET    /v1/admin/reports/sales
GET    /v1/admin/exports/orders
GET    /v1/admin/audit-logs

POST   /v1/webhooks/stripe
POST   /v1/webhooks/email
POST   /v1/integrations/{provider}/webhook
GET    /health/live
GET    /health/ready
GET    /metrics
```

Utilise des schémas de validation partagés lorsque c’est sûr, des erreurs structurées, des IDs de corrélation, une version d’API et une documentation OpenAPI testée.

## Paiements

### Modèle économique et légal

- Le restaurant vend le repas au client final.
- Le restaurant doit être le merchant of record lorsque la configuration PSP le permet.
- Le restaurant utilise son compte connecté.
- La plateforme facture séparément l’abonnement SaaS.
- Les frais PSP, remboursements, litiges et soldes négatifs doivent être attribués contractuellement et techniquement.
- Privilégie les direct charges Stripe Connect pour que le compte connecté soit vendeur et gère ses propres remboursements et litiges; Stripe documente que les direct charges peuvent placer le compte connecté comme merchant of record.[^5]
- Vérifie impérativement la disponibilité de TWINT, des direct charges et de chaque capacité Connect dans les pays ciblés avant implémentation définitive.

### Flux obligatoire

1. Le serveur recalcule le panier.
2. Il vérifie menu, disponibilité, horaires, promotion, zone et capacité.
3. Il crée une commande `PENDING_PAYMENT`.
4. Il réserve temporairement le créneau.
5. Il crée la session ou le PaymentIntent avec une clé d’idempotence.
6. Le client paie sur une interface hébergée ou sécurisée par Stripe.
7. Le retour navigateur n’est jamais la source de vérité.
8. Le webhook signé confirme le paiement.
9. Le système déduplique l’événement PSP.
10. La commande passe à `PAID` puis dans le flux d’acceptation.
11. Une tâche de rapprochement détecte tout paiement sans commande exploitable.
12. En cas de refus, un remboursement total est lancé.
13. Les remboursements partiels et complets sont suivis par webhook.
14. Un rapprochement compare chaque jour commandes, paiements, remboursements, frais et versements.

Stripe recommande les PaymentIntents et les clés d’idempotence pour éviter des créations en double. Les remboursements peuvent être complets ou partiels et doivent être suivis jusqu’à leur état final.[^6][^7]

### PCI

Utilise Stripe Checkout ou Elements afin que les données de carte ne transitent jamais par nos serveurs. Une intégration entièrement externalisée peut réduire le périmètre vers SAQ A, sans supprimer les obligations de sécurisation de la page et des scripts.[^8][^9]

## Sécurité

### Accès

- MFA ou passkey obligatoire pour propriétaire et manager.
- MFA fortement recommandé pour tous les employés.
- RBAC appliqué côté API.
- Principe du moindre privilège.
- Réauthentification pour remboursement important, export massif, modification bancaire ou changement de rôle critique.
- Révocation immédiate d’un employé.
- Sessions et refresh tokens sécurisés.
- Protection contre fixation et vol de session.

### Application

- Validation stricte des entrées.
- Encodage des sorties.
- Protection XSS, CSRF, injection, SSRF et traversée de chemin.
- Content Security Policy restrictive.
- Cookies `Secure`, `HttpOnly` et `SameSite` adaptés.
- Rate limiting par IP, compte, tenant et opération.
- Limites renforcées sur connexion, coupon, paiement, remboursement, suivi public et SMS.
- Tokens publics aléatoires et expirables.
- Signature, horodatage et anti-rejeu des webhooks.
- Idempotence des créations et mutations financières.
- Aucune donnée sensible dans les logs.
- Scan SAST, dépendances, secrets et images de conteneur.
- SBOM à chaque version de production.
- Correctifs de sécurité avec SLA interne.

L’audit doit couvrir au minimum les familles de risques OWASP API : autorisation au niveau objet, authentification, consommation non limitée, mauvaise configuration et consommation non sûre d’API tierces.[^10][^11]

### Sauvegardes

- Sauvegarde automatique chiffrée.
- Restauration temporelle PostgreSQL.
- Copie isolée ou immuable.
- Politique de rétention documentée.
- Test de restauration trimestriel.
- RPO et RTO définis.
- Procédure de restauration par environnement.
- Aucun backup considéré fiable sans test de restauration.

## Conformité

Cette section doit être validée par un juriste et une fiduciaire; ne présente jamais le cadrage technique comme un avis juridique.

### Suisse

Prévois :

- LPD suisse et protection des données dès la conception.
- Politique de confidentialité.
- Registre des traitements.
- Inventaire des sous-traitants.
- Contrats de sous-traitance.
- Processus d’accès, rectification, export, opposition et suppression.
- Durées de conservation.
- Processus de violation de données.
- Analyse des transferts internationaux.
- Gestion des cookies et technologies similaires.
- Identité complète du vendeur.
- Étapes de conclusion du contrat.
- Correction des erreurs avant l’envoi.
- Confirmation électronique immédiate.
- Prix total en CHF et coûts optionnels séparés.

Le SECO exige notamment l’identité et l’adresse du vendeur, l’explication des étapes du contrat, la possibilité de corriger les erreurs et la confirmation électronique immédiate de la commande. Pour une offre suisse, le prix effectivement payé doit être affiché en CHF avec les suppléments non optionnels inclus.[^12][^13]

### Denrées alimentaires

Prévois :

- Allergènes structurés.
- Origines requises.
- Possibilité d’obtenir l’information avant commande.
- Historique des déclarations.
- Avertissement sur les contaminations croisées.
- Validation humaine par le restaurant.
- Interdiction de générer automatiquement une information allergène non confirmée.

Le droit alimentaire suisse s’applique aussi aux aliments vendus en ligne.[^14]

### Union européenne

Prépare l’architecture pour :

- RGPD.
- Consentement valide pour les traitements non nécessaires.
- Droits des personnes.
- Minimisation des données.
- Privacy by design et by default.
- Registre et contrats de sous-traitance.
- Notification des violations lorsque requise.
- Gestion de la résidence et des transferts.
- TVA et facturation adaptées au pays.
- Règles de consommation et information alimentaire locales.

Ne lance pas « toute l’UE » d’un seul bloc. Exige une revue juridique, fiscale et opérationnelle par pays avant activation commerciale.

## PWA et UX mobile

- Manifest complet.
- Service worker versionné.
- Cache du shell et des médias statiques.
- Dernier menu consultable hors ligne avec avertissement clair.
- Brouillon de panier local.
- Aucune création finale de commande hors ligne.
- Gestion propre des mises à jour du service worker.
- Web Push après consentement.
- Installation proposée seulement après une interaction réussie.
- Tests réels sur iPhone/iPad Safari et Android Chrome.

Le Web Push sur iOS/iPadOS fonctionne pour les web apps ajoutées à l’écran d’accueil depuis iOS/iPadOS 16.4, avec permission demandée à la suite d’une interaction utilisateur. Certains navigateurs intégrés aux réseaux sociaux empêchent ou compliquent l’installation d’une PWA.[^15][^16]

### UX de commande

- Choix retrait/livraison immédiatement compréhensible.
- Délai, minimum et frais visibles avant le checkout.
- Barre de panier fixe sur mobile.
- Commande invité prioritaire.
- Peu de champs.
- Autofill et validation inline.
- Suppléments payants jamais présélectionnés.
- Total constamment visible.
- Messages d’erreur actionnables.
- Aucun changement silencieux de prix.
- Sauvegarde du panier lors des redirections de paiement.
- Alternatives en cas de rupture.
- Accessibilité clavier et lecteur d’écran.
- Cibles tactiles conformes à WCAG 2.2.

WCAG 2.2 fixe un minimum AA de 24 × 24 pixels CSS pour les cibles tactiles, sous réserve des exceptions prévues. Baymard estime l’abandon moyen de panier à environ 70% et met en avant la commande invité, la réduction des champs et la clarté des coûts parmi les leviers du checkout.[^17][^18]

## Intégrations

Construis d’abord des interfaces, puis les adaptateurs réellement justifiés par un pilote.

Priorité :

1. Stripe, Connect et TWINT.
2. E-mail transactionnel.
3. Web Push.
4. SMS de secours.
5. Validation d’adresse et cartographie.
6. Impression réseau.
7. Première caisse choisie à partir d’un restaurant réel.
8. Prestataire de livraison.
9. Comptabilité.
10. CRM et marketing consentis.

Ne choisis pas une caisse avant d’avoir un pilote. Prépare des contrats d’intégration pour :

- Synchronisation de menus.
- Transmission de commandes.
- Accusé de réception.
- Mise à jour de statut.
- Déduplication.
- Retry et dead-letter queue.
- Réconciliation manuelle.
- Mode dégradé.

Lightspeed propose des API de commande, mais l’accès et le périmètre dépendent du partenariat et de la gamme utilisée. Epson fournit des technologies ePOS pour piloter certaines imprimantes depuis des applications web.[^19][^20]

## Déploiement initial et auto-hébergement

### Production initiale

Privilégie des services managés dans une région suisse :

- Conteneurs applicatifs.
- PostgreSQL géré.
- Redis géré.
- Stockage objet.
- File d’attente.
- Coffre de secrets.
- CDN et WAF.
- Observabilité centralisée.

Compare Azure Switzerland North, AWS région Zurich et alternatives européennes/suisses. Décide sur la base des services disponibles, coûts, sauvegardes, résidence, réversibilité et compétences d’exploitation. Ne prétends pas qu’un service est hébergé en Suisse sans vérifier la région exacte de chaque composant et sous-traitant.

### Portabilité obligatoire

- Images OCI standard.
- Aucun stockage local persistant dans les conteneurs.
- PostgreSQL standard autant que possible.
- Stockage derrière une interface S3 compatible.
- Redis utilisé sans extensions propriétaires essentielles.
- Configuration par variables d’environnement et secrets externes.
- Infrastructure as Code.
- Migrations automatisées et réversibles.
- Export complet des données.
- Documentation de restauration sur une autre infrastructure.

### Auto-hébergement futur

Prépare deux profils :

```text
Développement : Docker Compose local
Production gérée : cloud suisse
Production auto-hébergée future : conteneurs + PostgreSQL + Redis + stockage objet + reverse proxy
```

L’auto-hébergement ne doit pas être annoncé commercialement avant d’avoir :

- Une procédure d’installation reproductible.
- Des mises à jour signées.
- Une politique de versions supportées.
- Des sauvegardes automatisées.
- Un monitoring.
- Un durcissement système.
- Une procédure de rotation des secrets.
- Une stratégie de haute disponibilité.
- Un responsable d’astreinte.
- Des tests de restauration et de reprise.

## Environnements et CI/CD

Crée au minimum :

- `development`
- `test`
- `staging`
- `production`

Chaque environnement possède :

- Ses secrets.
- Sa base.
- Ses comptes PSP.
- Ses domaines.
- Ses webhooks.
- Ses clés de notification.
- Ses données de test non issues de production.

Pipeline obligatoire :

1. Installation verrouillée des dépendances.
2. Vérification de format.
3. Lint.
4. Typecheck.
5. Tests unitaires.
6. Tests d’intégration.
7. Tests d’isolation multi-tenant.
8. Scan des secrets.
9. Scan des dépendances.
10. Build.
11. Tests end-to-end critiques.
12. Création de l’image.
13. Scan de l’image.
14. Génération SBOM.
15. Déploiement staging.
16. Smoke tests.
17. Validation humaine.
18. Déploiement production progressif.
19. Vérification post-déploiement.
20. Retour arrière automatique ou manuel documenté.

## Tests obligatoires

### Unitaires

- Pricing.
- Promotions.
- Taxes.
- Capacité.
- Machine à états.
- Permissions.
- Zones de livraison.
- Disponibilités.

### Intégration

- PostgreSQL réel en conteneur.
- Redis et file d’attente.
- Webhooks Stripe signés.
- Idempotence.
- Remboursements.
- Isolation multi-tenant.
- Migrations ascendantes et retour arrière lorsque possible.

### End-to-end

- Commande invité en retrait.
- Commande en livraison.
- Paiement réussi.
- Paiement échoué.
- Retour TWINT.
- Refus et remboursement.
- Rupture pendant le panier.
- Créneau devenu complet.
- Fermeture exceptionnelle.
- Utilisateur sans permission.
- Restaurant A tentant d’accéder au restaurant B.
- Rejeu d’un webhook.
- Panne temporaire d’un fournisseur.

### Non fonctionnels

- Charge aux heures de pointe.
- Accessibilité.
- Performance mobile.
- Restauration de sauvegarde.
- Reprise après panne.
- Test d’intrusion avant commercialisation.

## Observabilité

- Logs JSON corrélés.
- Traces OpenTelemetry.
- Métriques techniques et métier.
- Identifiants de corrélation commande, paiement, webhook et notification.
- Alertes sur taux d’échec de paiement, commandes payées non injectées, délais de traitement, saturation des créneaux, erreurs d’intégration et file bloquée.
- Tableau de santé par restaurant sans exposer de données sensibles.
- SLO documentés.
- Page de statut publique avant commercialisation large.

## Support opérationnel

Propose au lancement :

- Support standard en jours ouvrés.
- Permanence critique durant les principaux services.
- Monitoring automatisé continu.
- Niveaux d’incident P1 à P4.
- Procédure de mode dégradé.
- Support via ticket pour le normal.
- Canal urgent pour commande ou paiement bloqué.
- Accès support temporaire et audité.

Objectifs initiaux proposés :

- P1, plateforme ou paiements totalement indisponibles : prise en charge 15 à 30 minutes pendant la couverture critique.
- P2, un restaurant ne reçoit plus les commandes : moins d’une heure.
- P3, impression ou fonction secondaire défaillante : moins de quatre heures ouvrées.
- P4, contenu ou demande courante : un jour ouvré.

Présente ces objectifs comme une proposition commerciale à valider, pas comme un SLA contractuel déjà accepté.

## Modèle économique proposé

Prépare le produit pour :

- Frais de mise en service.
- Abonnement mensuel par établissement.
- Options premium.
- Facturation séparée des consommations SMS, cartographie ou intégrations coûteuses.
- Aucun pourcentage sur les commandes.

Hypothèse tarifaire initiale à tester :

- Essentiel : CHF 149/mois/site.
- Pro : CHF 249/mois/site.
- Premium : CHF 399–599/mois/site.
- Mise en service : CHF 1’500–3’500.
- Design exclusif : prestation séparée.
- Intégration POS : devis séparé.
- Frais PSP payés directement par le restaurant.

Ces prix sont des hypothèses commerciales. Crée un modèle de coûts permettant de recalculer la marge selon support, infrastructure, messages, cartographie, onboarding et développement spécifique.

## Feuille de route

### Phase 1 — Cadrage et validation

- Recherche utilisateur.
- Observation d’un service réel dès qu’un pilote est trouvé.
- Prototype.
- Architecture.
- Threat model.
- Validation juridique initiale.
- Backlog MVP.

### Phase 2 — Pilote exploitable

- Branding.
- Menu.
- Panier invité.
- Retrait.
- Livraison simple activable.
- Créneaux.
- Paiement.
- Commandes.
- Back-office.
- E-mail.
- Sécurité et audit.

### Phase 3 — Stabilisation SaaS

- Stripe Connect.
- Onboarding multi-restaurant.
- Facturation SaaS.
- Monitoring avancé.
- Support.
- Promotions.
- Impression.
- Web Push et SMS.

### Phase 4 — Commercialisation suisse

- Plusieurs thèmes.
- FR/EN stabilisés.
- Première intégration caisse.
- Contrats SaaS.
- Tests d’intrusion.
- Acquisition et onboarding standardisé.

### Phase 5 — Europe

- Sélection d’un premier pays.
- Revue légale et fiscale locale.
- EUR et TVA locale.
- Moyens de paiement locaux.
- Traduction supplémentaire si nécessaire.
- Hébergement et transferts réévalués.

## Estimation de délai

Le premier objectif doit être un pilote exploitable en environ 12 à 16 semaines pour une petite équipe expérimentée, sous réserve de disposer rapidement du restaurant pilote, du compte de paiement, du menu, de l’identité visuelle et des validations légales. Ne transforme pas cette estimation en promesse avant d’avoir découpé le backlog et mesuré la capacité réelle de l’équipe.

Si le délai doit être réduit, simplifie dans cet ordre :

1. Différer l’intégration POS.
2. Différer les comptes clients.
3. Limiter le nombre de thèmes.
4. Limiter la livraison à des zones simples.
5. Différer SMS et Web Push.

Ne simplifie jamais l’isolation multi-tenant, l’idempotence des paiements, la traçabilité, les sauvegardes ou la sécurité des accès.

# Orchestration obligatoire des modèles Claude

## Principe

- **Claude Opus 5.5 est le cerveau, l’architecte, l’arbitre et l’auditeur.**
- **Claude Sonnet 5 est le développeur principal.**
- Opus spécifie avant que Sonnet code.
- Sonnet teste avant qu’Opus audite.
- Un lot n’est pas terminé tant qu’Opus n’a pas validé les preuves de qualité.

Claude Code permet de définir le modèle d’un sous-agent par alias ou identifiant complet dans le frontmatter YAML. Les alias `opus` et `sonnet` pointent actuellement vers Opus 5.5 et Sonnet 5 sur l’API Anthropic; les versions peuvent différer selon le fournisseur, donc utilise les identifiants complets lorsque la reproductibilité est prioritaire.[^21][^1]

## Préparation Claude Code

1. Vérifie la version :

```bash
claude --version
claude update
```

Opus 5.5 nécessite Claude Code 2.1.280 ou ultérieur et Sonnet 5 nécessite la version 2.1.197 ou ultérieure.[^21]

2. Lance la conversation principale avec Opus :

```bash
claude --model claude-opus-5-5
```

Si l’identifiant complet n’est pas disponible chez le fournisseur configuré, utilise :

```bash
claude --model opus
```

3. N’utilise pas une variable globale forçant tous les sous-agents sur un même modèle, car elle empêcherait la séparation Opus/Sonnet.

4. Confirme le modèle réellement utilisé et les éventuelles substitutions de fournisseur avant chaque phase critique.

## Fichier principal `CLAUDE.md`

Crée un `CLAUDE.md` concis, idéalement inférieur à 200 lignes, contenant seulement :

- Vision produit.
- Décisions validées.
- Commandes de build et test.
- Architecture générale.
- Règles non négociables.
- Workflow Opus/Sonnet.
- Définition de terminé.
- Liens vers les documents spécialisés.

Place les règles détaillées dans :

```text
.claude/rules/architecture.md
.claude/rules/security.md
.claude/rules/testing.md
.claude/rules/database.md
.claude/rules/frontend.md
.claude/rules/backend.md
.claude/rules/payments.md
.claude/rules/privacy.md
.claude/rules/devops.md
```

Utilise le frontmatter `paths` pour charger les règles uniquement lorsqu’elles concernent les fichiers travaillés. Anthropic documente ce mécanisme pour limiter le bruit contextuel dans les grands projets.[^2]

## Sous-agent développeur Sonnet

Crée `.claude/agents/developer-sonnet.md` :

```md
---
name: developer-sonnet
description: Implémente les lots validés, écrit les tests et fournit les preuves de qualité. À utiliser après validation de la spécification par Opus.
tools: Read, Glob, Grep, Edit, Write, Bash
model: claude-sonnet-5
effort: high
permissionMode: default
maxTurns: 80
---

Tu es le développeur full-stack principal du projet.

Avant toute modification :
- Lis CLAUDE.md, les règles applicables, l’ADR et la spécification du lot.
- Inspecte les fichiers existants et les tests.
- Reformule le périmètre et les critères d’acceptation.
- N’apporte aucune modification structurelle non validée.

Pendant l’implémentation :
- Respecte TypeScript strict et les frontières de modules.
- Préserve les fonctionnalités existantes non concernées.
- N’accepte aucun calcul financier venant du client.
- Ajoute validation, autorisation, idempotence et audit lorsque requis.
- Écris ou adapte les tests avant de déclarer le lot terminé.
- Limite les changements au périmètre validé.

Avant restitution :
- Exécute format, lint, typecheck, tests et build.
- Inspecte le diff complet.
- Signale tout test non exécuté et sa raison.
- Liste les fichiers modifiés.
- Liste les migrations et effets de bord.
- Fournis les commandes et résultats utiles.
- Ne pousse pas en production et ne fusionne pas sans validation humaine.
```

Si le fournisseur ne reconnaît pas l’identifiant complet, remplace uniquement la ligne du modèle par :

```yaml
model: sonnet
```

## Sous-agent auditeur Opus

Crée `.claude/agents/auditor-opus.md` :

```md
---
name: auditor-opus
description: Audite les spécifications, diffs, migrations, sécurité, tests et conformité. À utiliser avant et après chaque lot critique.
tools: Read, Glob, Grep, Bash
model: claude-opus-5-5
effort: high
permissionMode: plan
maxTurns: 60
---

Tu es l’architecte et auditeur indépendant du projet.
Tu n’écris pas le code métier pendant l’audit.

Examine :
- Conformité au besoin et aux critères d’acceptation.
- Architecture et dépendances.
- Isolation multi-tenant.
- Authentification et autorisation.
- Calculs financiers.
- Paiements, webhooks et idempotence.
- Migrations, contraintes et intégrité.
- Données personnelles et journaux.
- Gestion des erreurs et modes dégradés.
- Tests manquants et régressions.
- Performance et observabilité.
- Réversibilité du déploiement.

Classe chaque constat : BLOCKER, HIGH, MEDIUM, LOW ou INFO.
Pour chaque constat, indique : preuve, impact, correctif attendu et test de vérification.
Termine par un verdict : REJECTED, CHANGES_REQUIRED ou APPROVED.
Ne valide jamais un lot sur la seule base d’une description; inspecte le diff et les preuves de test.
```

Si nécessaire, remplace le modèle complet par `opus`.

## Sous-agent sécurité Opus

Crée `.claude/agents/security-opus.md` :

```md
---
name: security-opus
description: Effectue les revues de menace et de sécurité sur les modules sensibles avant mise en production.
tools: Read, Glob, Grep, Bash
model: claude-opus-5-5
effort: high
permissionMode: plan
maxTurns: 60
---

Réalise une revue orientée OWASP ASVS et OWASP API Security.
Recherche particulièrement les défauts d’autorisation objet, l’escalade inter-tenant, les injections, les fuites de secrets, le rejeu de webhook, les doubles paiements, les remboursements abusifs, les données sensibles dans les logs et les mauvaises configurations.
Produis des constats prouvables et des tests de reproduction sûrs.
N’exécute aucune attaque destructive et ne modifie pas les données réelles.
```

## Cycle obligatoire par lot

Pour chaque fonctionnalité :

1. **Opus — analyse :** besoin, contraintes, dépendances, risques et métriques.
2. **Opus — spécification :** user stories, critères d’acceptation, contrat API, modèle de données et plan de test.
3. **Humain — validation :** approbation du périmètre si le lot est structurant.
4. **Sonnet — inspection :** lecture du dépôt et plan de modification.
5. **Sonnet — implémentation :** code, migrations, tests et documentation.
6. **Sonnet — vérification :** lint, typecheck, tests, build et inspection du diff.
7. **Opus — audit :** revue indépendante du diff et des preuves.
8. **Sonnet — corrections :** traitement de tous les points bloquants et élevés.
9. **Opus — contre-audit :** validation ou nouveau rejet.
10. **Humain — intégration :** fusion et déploiement selon le niveau de risque.

## Audits Opus obligatoires

Aucun des sujets suivants ne peut être validé uniquement par Sonnet :

- Architecture initiale.
- Modèle multi-tenant.
- Authentification et autorisations.
- Paiements et remboursements.
- Webhooks.
- Calcul de prix, taxes et promotions.
- Machine à états des commandes.
- Créneaux et capacité.
- Migrations PostgreSQL.
- Données personnelles et consentements.
- Export et suppression.
- Sauvegardes et restauration.
- Infrastructure de production.
- Intégrations POS, imprimante et livraison.
- Incident de sécurité.
- Mise en production majeure.

## Gestion du contexte

- Le fil principal Opus conserve la vision, les décisions et l’état du projet.
- Les recherches volumineuses et implémentations sont déléguées pour éviter de polluer le contexte principal.
- Chaque sous-agent reçoit une tâche étroite, les fichiers concernés et les critères d’acceptation.
- Les résultats sont synthétisés dans la documentation du dépôt.
- Ne compte pas uniquement sur la mémoire conversationnelle.
- Toute décision durable doit être écrite dans un ADR ou une spécification.
- Mets à jour `CLAUDE.md` lorsqu’une correction doit s’appliquer à toutes les sessions.

## Interdictions pour les agents

- Ne pas modifier directement `main`.
- Ne pas forcer un push.
- Ne pas réécrire l’historique partagé.
- Ne pas désactiver un test pour faire passer la CI.
- Ne pas réduire la couverture d’un module critique sans justification approuvée.
- Ne pas exécuter de migration destructive sur production.
- Ne pas utiliser de données personnelles réelles en test.
- Ne pas copier de secrets.
- Ne pas modifier les responsabilités financières sans ADR et validation juridique.
- Ne pas déclarer une intégration conforme sans test de bout en bout.
- Ne pas inventer le résultat d’une commande ou d’un test non exécuté.

## Définition de terminé

Un lot est terminé seulement si :

- Les critères d’acceptation sont satisfaits.
- Le comportement multilingue est testé lorsque concerné.
- Le typage strict réussit.
- Le lint réussit.
- Les tests unitaires réussissent.
- Les tests d’intégration concernés réussissent.
- Les tests end-to-end critiques réussissent.
- Le build de production réussit.
- Les migrations sont testées.
- Le rollback est documenté.
- L’isolation multi-tenant est prouvée.
- Les logs et métriques nécessaires existent.
- La documentation est à jour.
- Aucun secret n’est exposé.
- Aucun constat BLOCKER ou HIGH ne reste ouvert.
- L’auditeur Opus rend `APPROVED`.
- Un humain autorise la fusion ou la production.

# Première réponse attendue de Claude Code

Après réception de ce prompt, ne commence pas à coder l’application. Fournis exactement :

1. Une reformulation concise de la vision.
2. La liste des décisions considérées comme validées.
3. Les hypothèses restantes.
4. Les contradictions ou risques détectés.
5. Le périmètre MVP final recommandé.
6. Le diagramme logique de l’architecture.
7. Le découpage initial du monorepo.
8. Le modèle de données de premier niveau.
9. Les ADR à créer.
10. Le backlog ordonné des 30 premiers jours.
11. Les critères de passage au développement.
12. Les fichiers Claude Code à créer pour l’orchestration Opus/Sonnet.
13. Une estimation de charge par phase sous forme de fourchette.
14. Les décisions qui exigent encore une validation humaine.

Termine par la phrase :

**« Le cadrage est prêt pour validation. Aucun code métier ne sera produit avant ton accord explicite. »**

# Questions encore ouvertes

Ne bloque pas le cadrage si une hypothèse raisonnable suffit, mais signale l’impact de chaque réponse manquante :

- Budget disponible pour le pilote.
- Premier restaurant pilote.
- Pays européen visé après la Suisse.
- Première caisse à intégrer.
- Prestataire cloud initial.
- Fournisseur d’identité.
- Niveau exact de support du soir et du week-end.
- Seuils contractuels de remboursement par rôle.
- Besoin de paiement au retrait.
- Politique d’annulation client.
- Prestataire futur de livraison externe.
- Politique de rétention comptable et opérationnelle validée.

# Hypothèse de référence — restaurant standard lausannois

En l’absence de restaurant pilote confirmé, utilise comme référence provisoire un restaurant indépendant situé à Lausanne présentant les caractéristiques suivantes. Ces valeurs sont des hypothèses produit, pas des données statistiques sur tous les restaurants lausannois.

- Un établissement et une cuisine.
- Service midi et soir, six jours sur sept.
- 20 à 50 références vendables, réparties entre plats, accompagnements, desserts et boissons.
- Retrait et livraison interne activables séparément.
- Rayon de livraison initial de 3 à 5 km, remplacé ensuite par des zones ou polygones validés.
- Deux à six employés utilisant le back-office.
- Une tablette de service et une imprimante réseau.
- Pics d’activité de 11 h 30 à 13 h 30 et de 18 h 30 à 21 h 30.
- Entre 20 et 80 commandes numériques par jour comme hypothèse de dimensionnement fonctionnel, sans en faire une prévision commerciale.
- Commande moyenne composée de deux à six lignes.
- Français comme langue principale et anglais comme seconde langue.
- CHF comme devise.
- Paiement par TWINT et carte; paiement au retrait configurable mais désactivé par défaut.
- Menus, formules, variantes, suppléments, allergènes, ruptures et horaires exceptionnels.
- Livraison assurée par le restaurant lorsque ce canal est activé.
- Aucune intégration POS obligatoire pour le premier pilote; export CSV et impression servent de mode initial.

Conçois néanmoins le domaine sans dépendre de cette typologie : un café, une pizzeria, un traiteur, un fast-food ou un restaurant gastronomique doivent pouvoir configurer des menus et règles différents sans modification du cœur logiciel.

# Budget de réalisation validé

Le porteur du projet réalise lui-même la conception, le développement et la maintenance avec Claude. Considère donc le **coût de main-d’œuvre externe comme nul pour le MVP**, sans confondre gratuité du travail personnel et absence de coût total.

Le projet doit :

- Ne prévoir aucune agence ni développeur externe par défaut.
- Optimiser les dépenses d’abonnement Claude, d’hébergement, de domaine et de services transactionnels.
- Utiliser les offres gratuites ou peu coûteuses uniquement si elles respectent les exigences de sécurité, sauvegarde et portabilité.
- Afficher avant activation tout service générant un coût variable.
- Prévoir des plafonds de dépenses pour SMS, cartographie, e-mail, stockage et logs.
- Conserver un tableau mensuel `docs/finance/operating-costs.md` distinguant coût réel, coût gratuit temporaire, quota et prix après dépassement.
- Ne jamais choisir un composant uniquement parce qu’il est gratuit si son remplacement est difficile.
- Réserver un budget incompressible à la validation juridique, au test d’intrusion et au matériel pilote avant commercialisation, même si ces dépenses sont repoussées pendant le développement.

Le temps du porteur de projet doit être suivi en heures par lot afin de mesurer le coût économique réel et d’estimer correctement les futurs prix SaaS.

# Annulation, réclamation et remboursement

## Politique suisse initiale proposée

La législation suisse ne prévoit pas de droit général de révocation pour un achat en ligne; les conditions offertes au client doivent donc être définies clairement dans les CGV du restaurant. Applique la politique produit suivante par défaut, configurable par restaurant et soumise à validation juridique :[^22]

- Avant paiement : le client peut abandonner ou modifier librement son panier.
- Après paiement et avant acceptation : le client peut demander une annulation; si aucune préparation n’a commencé, remboursement total automatique ou validation rapide par le restaurant.
- Après acceptation mais avant `IN_PREPARATION` : annulation laissée au restaurant, avec remboursement total recommandé.
- À partir de `IN_PREPARATION` : aucune annulation garantie; le restaurant peut accorder un remboursement total, partiel, un avoir ou refuser avec motif.
- Si le restaurant refuse ou ne peut pas exécuter la commande : remboursement total, y compris les frais de livraison et le pourboire lié à la commande.
- Produit manquant ou erroné : remboursement du produit et des suppléments concernés; frais de livraison remboursables selon l’impact global.
- Commande entièrement inutilisable ou non livrée du fait du restaurant : remboursement total.
- Retard : aucune compensation automatique au MVP; geste commercial configurable et journalisé.
- Client absent au retrait : commande non remboursable par défaut après délai et tentatives de contact documentées.
- Adresse fausse ou inaccessible fournie par le client : nouvelle livraison ou remboursement non garanti; décision et preuve sont journalisées.
- Livraison impossible du fait du restaurant ou du livreur mandaté : remboursement total ou nouvelle livraison acceptée explicitement par le client.
- Suspicion allergène ou erreur de déclaration : arrêter la remise, rembourser intégralement, ouvrir un incident critique et conserver les preuves.

## Workflow

- Toute demande possède un motif normalisé, un commentaire et des pièces éventuelles.
- Les motifs incluent : erreur client, rupture, refus restaurant, retard, non-livraison, produit manquant, produit incorrect, qualité, allergène, fraude présumée et doublon.
- Le manager peut rembourser dans une limite configurable; au-delà, le propriétaire doit approuver.
- Le remboursement vers le moyen d’origine est privilégié.
- Un avoir ne peut remplacer un remboursement légalement ou contractuellement dû sans accord explicite du client.
- L’état financier et l’état opérationnel restent séparés.
- Chaque action enregistre auteur, date, montant, devise, motif, identifiant PSP et état final.
- Le client reçoit une confirmation et un délai estimatif non garanti par la plateforme.
- Les litiges PSP sont rattachés à la commande et à un dossier de preuve.

## Europe

Avant l’ouverture d’un pays de l’UE, vérifie les règles nationales transposant la directive sur les droits des consommateurs. La directive européenne prévoit un droit de rétractation général pour certains contrats à distance, assorti d’exceptions qu’il faut analyser pour les repas préparés, denrées périssables et services exécutés. Ne copie pas automatiquement la politique suisse en Europe.[^23][^24]

# Fiscalité, factures et justificatifs

## Modèle suisse initial

Les taux suisses actuellement publiés sont 8,1% au taux normal, 2,6% au taux réduit et 3,8% pour l’hébergement. Les denrées non alcoolisées à emporter ou livrées peuvent relever du taux réduit, tandis que les boissons alcoolisées et prestations de restauration relèvent du taux normal; la distinction doit être prouvée par des mesures organisationnelles et pièces justificatives.[^25][^26][^27][^28]

Le logiciel ne doit pas déduire la TVA uniquement à partir d’une catégorie de produit. Implémente :

- Un profil fiscal versionné par restaurant, établissement, pays et date d’effet.
- Un code de taxe sur chaque produit et frais.
- Des règles distinctes selon consommation sur place, retrait et livraison.
- Le code ISO de devise sur chaque prix et document.
- Les montants hors taxe, taxe et TTC en unités monétaires entières.
- Une ventilation par taux sur commande, remboursement, export et justificatif.
- Une taxe configurable pour les frais de livraison et autres frais.
- Les boissons alcoolisées séparées des denrées non alcoolisées.
- Une validation obligatoire par la fiduciaire du restaurant avant mise en ligne.
- Aucun changement rétroactif : les commandes conservent un snapshot des taux.

## Documents

- Envoyer automatiquement une confirmation de commande, pas nécessairement une facture fiscale définitive.
- Générer un reçu PDF sur demande ou automatiquement selon la configuration.
- Générer une facture conforme uniquement si les données du restaurant et les règles fiscales ont été validées.
- Numéroter les documents dans une séquence propre à l’entité juridique et à l’établissement selon validation fiduciaire.
- Produire un avoir ou document correctif lié au document original lors d’un remboursement.
- Inclure identité du vendeur, adresse, numéro TVA si applicable, date, numéro, lignes, taux, taxes, total, devise, moyen de paiement masqué et référence de commande.
- Conserver une version immuable du document émis.
- Permettre l’export comptable CSV; reporter les formats spécifiques aux logiciels comptables jusqu’au choix d’un pilote.
- Réconcilier séparément chiffre d’affaires, taxes, frais de livraison, pourboires, remises, remboursements, frais PSP et versements.

# Alcool — modèle prêt, activation interdite par défaut

Crée les champs et restrictions, mais garde la vente d’alcool désactivée jusqu’à validation de la licence, des règles cantonales et communales et du processus de contrôle d’âge.

## Données nécessaires

- `isAlcoholic`.
- `alcoholCategory`: fermenté, bière, vin, cidre, distillé, alcopop ou autre.
- `alcoholByVolume`.
- `minimumAge`.
- `licenseRequired` et référence de licence.
- Canaux autorisés.
- Horaires de vente et de remise.
- Restrictions par canton, commune, pays et établissement.
- Contrôle d’âge requis au checkout et à la remise.
- Texte d’avertissement versionné.
- Exclusion possible des promotions.
- Preuve d’instruction au livreur, sans conserver une copie de pièce d’identité au MVP.

Dans le canton de Vaud, une autorisation préalable est requise pour la vente d’alcool; la vente est interdite aux moins de 16 ans et celle des boissons distillées aux moins de 18 ans. À Lausanne, la livraison et la vente à l’emporter de bière et de boissons distillées sont interdites entre 20 h et 6 h, tandis que les pages communales indiquent une exception pour le vin et le cidre.[^29][^30][^31][^32]

## Règles produit

- Ne jamais considérer une simple case « j’ai l’âge légal » comme contrôle final suffisant.
- Vérification physique d’une pièce d’identité par le livreur ou le personnel en cas de doute.
- Refus de remise à une personne trop jeune ou en état d’ébriété.
- Aucun dépôt de la commande alcoolisée sans remise en main propre.
- Le checkout bloque automatiquement les articles interdits selon l’heure de remise prévue, pas seulement l’heure de commande.
- Les règles sont calculées selon l’établissement et l’adresse de vente/remise.
- La fonctionnalité nécessite un feature flag activé par la plateforme après contrôle documentaire.
- Les journaux conservent le résultat du contrôle et le motif du refus, jamais une photographie de la pièce au MVP.

# Pourboires

- Fonction activable par restaurant et canal.
- Désactivée par défaut jusqu’à validation comptable et sociale.
- Aucun montant présélectionné.
- Choix proposés configurables, avec option « aucun » aussi visible que les autres.
- Montant libre plafonné.
- Pourboire affiché séparément avant paiement.
- Affectation documentée : restaurant, équipe ou livreur.
- Aucun partage automatique complexe au MVP.
- Remboursement total du pourboire si la commande est refusée ou non exécutée.
- Pour remboursement partiel, conserver le pourboire sauf décision explicite ou réclamation.
- Export séparé pour la comptabilité et la paie.
- Snapshot de la règle d’affectation au moment de la commande.

# Onboarding restaurateur

## Parcours géré au lancement

L’onboarding n’est pas autonome au MVP. La plateforme accompagne chaque restaurant selon ce parcours :

1. Qualification du restaurant et de ses canaux.
2. Vérification de l’entité juridique, des licences et du signataire.
3. Création du tenant, restaurant et établissement.
4. Signature du contrat SaaS et du contrat de traitement des données.
5. Connexion ou création du compte de paiement.
6. Configuration du domaine et preuve de contrôle DNS.
7. Import ou saisie du menu.
8. Validation des prix, TVA, allergènes et origines par le restaurant.
9. Configuration du thème, des contenus et e-mails.
10. Horaires, fermetures, préparation, créneaux et capacités.
11. Zones, frais et règles de livraison.
12. Création des comptes employés et MFA.
13. Configuration tablette, son et imprimante.
14. Tests de commande, échec, refus et remboursement.
15. Formation du propriétaire et de l’équipe.
16. Signature d’une checklist de mise en ligne.
17. Ouverture contrôlée avec surveillance renforcée.
18. Revue après 7 et 30 jours.

Crée un état d’onboarding détaillé, des responsables, des preuves et des blocages. Aucun restaurant ne passe en production sans paiement fonctionnel, commande de bout en bout, remboursement de test, informations légales, menu validé et procédure de secours.

# Abonnement SaaS

## Politique initiale

- Aucun essai libre-service au lancement.
- Démonstration gratuite et proposition personnalisée.
- Frais de mise en service facturés à la signature, avec périmètre écrit.
- Abonnement mensuel payé d’avance par établissement.
- Engagement initial recommandé de 12 mois; option sans engagement à tarif supérieur.
- Paiement SaaS séparé des paiements de repas.
- Proratisation lors d’un ajout d’établissement; pas de proratisation automatique complexe pour les suppressions.
- Facture SaaS distincte de celles émises par les restaurants à leurs clients.

## Impayés

- Jour 0 : échec et notification au propriétaire.
- Jours 1 à 7 : relances automatiques et nouvelles tentatives.
- Jour 8 : avertissement de suspension.
- Jour 15 : passage en mode restreint empêchant les nouvelles commandes, sans supprimer les données.
- Après 30 jours : résiliation possible selon contrat.
- Les clients ne doivent jamais pouvoir payer si le restaurant ne peut plus recevoir la commande.
- Prévoir une levée manuelle de suspension en cas de litige légitime.

## Changements

- Upgrade immédiat avec proratisation.
- Downgrade à la prochaine échéance.
- Options consommées facturées à terme échu lorsque nécessaire.
- Fermeture saisonnière : formule pause à prix réduit conservant données et domaine, durée maximale configurable.
- Résiliation depuis le back-office, confirmée par un propriétaire avec MFA.
- Historique immuable des abonnements, factures, crédits et changements.

# Sortie et résiliation d’un restaurant

## Procédure

1. Vérifier l’identité et l’autorité du demandeur.
2. Enregistrer date et motif de résiliation.
3. Calculer la date de fin contractuelle.
4. Geler les changements risquant d’altérer l’export.
5. Exporter menus, commandes, documents, clients autorisés, consentements, statistiques et journaux contractuellement transmissibles.
6. Fournir des formats ouverts CSV, JSON et médias dans leur format d’origine.
7. Transférer ou restituer le domaine selon son propriétaire contractuel.
8. Désactiver nouvelles commandes à l’heure convenue.
9. Laisser un accès lecture seule pendant 30 jours par défaut.
10. Révoquer employés, clés API, OAuth, webhooks et accès support.
11. Déconnecter les intégrations et le compte PSP sans bloquer les litiges en cours.
12. Traiter remboursements et contestations encore ouverts.
13. Supprimer ou anonymiser les données non soumises à conservation.
14. Laisser expirer les sauvegardes selon le cycle documenté.
15. Produire une preuve de clôture et de suppression lorsque applicable.

La LPD n’impose pas une durée universelle pour toutes les données; la conservation doit être déterminée par catégorie et finalité. Ne promets jamais une suppression immédiate des sauvegardes si leur cycle technique ne le permet pas; documente plutôt l’inaccessibilité et l’expiration.[^33]

# Propriété intellectuelle et données

Applique ces principes contractuels proposés, à valider par un juriste :

- La plateforme conserve la propriété du code source, de l’architecture, du design system, des connecteurs génériques et des améliorations communes.
- Le restaurant reste propriétaire ou titulaire des droits sur sa marque, son logo, ses textes, ses photos et son menu.
- Le restaurant garantit disposer des droits nécessaires sur les médias fournis.
- Les données de commandes et de clientèle liées à l’activité du restaurant restent sous son contrôle selon les rôles LPD/RGPD définis.
- La plateforme ne réutilise pas les données client pour son propre marketing sans base juridique et consentement distincts.
- Les statistiques transversales ne sont utilisables qu’après anonymisation réelle.
- Un design exclusif payé par un restaurant peut lui être réservé visuellement, mais les composants techniques génériques restent réutilisables, sauf contrat contraire.
- Un connecteur financé par un client reste générique et réutilisable sauf clause d’exclusivité facturée.
- Le nom de domaine doit idéalement être enregistré au nom du restaurant; la plateforme reçoit seulement les droits techniques nécessaires.
- Les licences open source, polices, icônes et médias sont inventoriés dans un registre.
- L’auto-hébergement futur est un droit commercial séparé : licence, mises à jour, support, sécurité et accès au code doivent être contractuellement définis.
- Aucun client ne reçoit automatiquement le dépôt source complet avec un abonnement standard.

# Commandes spéciales et catalogue extensible

Prévois les structures de données, mais limite l’interface MVP.

## Activé au MVP

- Commande immédiate ou planifiée le jour même.
- Produits à prix fixe.
- Variantes.
- Groupes d’options.
- Menus/formules simples avec choix obligatoires.
- Notes client limitées et filtrées.
- Limite de quantité par produit et commande.
- Heure limite avant fermeture.
- Validation manuelle au-dessus d’un montant ou volume configurable.

## Modélisé mais désactivé

- Précommande plusieurs jours à l’avance.
- Catering et demande de devis.
- Produits vendus au poids.
- Consignes de cuisson structurées.
- Consigne d’emballage et retour.
- Commande à table par QR code.
- Bons cadeaux.
- Abonnements repas.
- Commande de groupe.

Évite un modèle de produit trop abstrait. Utilise des capacités activables et des types explicites plutôt qu’un moteur universel impossible à maintenir.

# Capacité de production

Le système doit évoluer au-delà d’un simple nombre de commandes par créneau.

## MVP

- Capacité maximale par créneau.
- Nombre maximal de commandes.
- Nombre maximal d’articles.
- Délai minimum de préparation.
- Temps tampon avant fermeture.
- Limite par canal.
- Limite par grande commande.
- Pause manuelle immédiate.
- Augmentation manuelle du délai annoncé.

## Modèle préparé pour la V2

- Points de charge par produit.
- Stations : chaud, froid, pizza, bar, emballage et livraison.
- Capacité par station et tranche horaire.
- Charge déjà acceptée.
- Temps de préparation dépendant des options.
- Répartition entre retrait et livraison.
- Mode dégradé réduisant automatiquement les créneaux.

Le moteur ne doit jamais promettre une heure uniquement à partir d’une moyenne historique. Il doit utiliser les horaires, la capacité configurée, les commandes acceptées et une marge opérationnelle. L’employé conserve toujours la possibilité de suspendre ou prolonger les délais.

# Adresses et livraison

## Données d’adresse

- Nom du destinataire.
- Rue et numéro.
- Complément.
- Code postal et localité.
- Bâtiment, entrée, étage, appartement et interphone.
- Téléphone.
- Instructions.
- Latitude, longitude et niveau de précision.
- Adresse normalisée et adresse saisie.
- Point de remise corrigé par le client.
- Statut de validation.

## Règles

- Autocompléter sans empêcher une saisie manuelle.
- Demander une confirmation cartographique lorsque la précision est insuffisante.
- Calculer l’éligibilité avec le point géographique et une zone versionnée.
- Refuser une modification d’adresse après paiement si elle change zone, frais ou taxes; créer plutôt une procédure de correction contrôlée.
- Journaliser toute modification faite par le restaurant.
- Pour hôtel, hôpital, campus ou entreprise, demander un point de rencontre.
- Définir un comportement explicite pour une adresse à la frontière d’une zone.
- Conserver le snapshot de la zone et des frais dans la commande.
- Ne pas garantir un itinéraire ou délai à partir d’une simple distance à vol d’oiseau.
- Prévoir un mode manuel si le fournisseur cartographique est indisponible.

# Identité client, fidélité et propriété des contacts

- Utiliser une identité technique globale uniquement pour l’authentification et la sécurité.
- Isoler par tenant le profil commercial, l’historique exploitable, les préférences et les consentements.
- Un restaurant ne voit jamais l’activité d’un client chez un autre restaurant.
- Le consentement marketing est recueilli séparément pour chaque restaurant.
- La plateforme ne bénéficie pas automatiquement du consentement donné au restaurant.
- La commande invité reste possible.
- La fusion de comptes nécessite vérification de l’identité et journalisation.
- L’export du restaurant contient uniquement les données qu’il est autorisé à traiter.
- La fidélité V2 fonctionne par restaurant ou groupe explicitement configuré, jamais globalement par défaut.
- Les récompenses possèdent une date, une origine, un solde, une expiration et un journal immuable.
- Aucun profilage transversal ni recommandation entre enseignes au MVP.

La LPD impose la protection des données dès la conception et par défaut, notamment la minimisation et la suppression ou anonymisation lorsqu’elles sont appropriées.[^34]

# Indicateurs de succès

## Pilote produit

Mesure et affiche au minimum :

- Taux de sessions atteignant le panier.
- Taux de paniers atteignant le paiement.
- Taux de commandes payées.
- Taux d’échec technique du paiement, séparé des refus bancaires.
- Temps médian pour passer une commande.
- Délai entre webhook de paiement et affichage au restaurant.
- Taux de commandes acceptées.
- Taux de refus et motifs.
- Taux d’annulation et remboursement.
- Écart entre heure promise et heure prête/livrée.
- Commandes nécessitant une intervention support.
- Disponibilité pendant les heures de service.
- Échecs d’impression et de notification.

## Seuils de validation proposés

Ces seuils sont des objectifs internes à tester, pas des garanties commerciales :

- 100 commandes réelles minimum ou quatre semaines de pilote.
- Zéro doublon de commande payée.
- Zéro fuite inter-tenant.
- 99% des webhooks de paiement traités ou repris automatiquement en moins de 60 secondes.
- 95% des commandes payées visibles au restaurant en moins de 10 secondes en fonctionnement normal.
- Moins de 2% d’erreurs opérationnelles attribuables au logiciel.
- Moins de 2 tickets de support pour 100 commandes après la période d’apprentissage.
- 90% des clients testés terminent sans assistance.
- Personnel autonome après moins d’une heure de formation.
- Restauration de sauvegarde réussie avant ouverture commerciale.
- Remboursement complet et partiel vérifiés de bout en bout.
- Le restaurateur confirme par écrit l’utilité et sa volonté de payer le tarif proposé.

## Viabilité SaaS

- Revenu mensuel récurrent par établissement.
- Coût cloud par restaurant et par commande.
- Coût des fournisseurs variables.
- Temps d’onboarding.
- Temps de support mensuel par restaurant.
- Marge contributive.
- Taux de résiliation.
- Délai de récupération des frais d’acquisition et de mise en service.

Ne collecte pas d’analytics non nécessaires avant d’avoir défini finalité, base juridique, durée et consentement éventuel.

# Gouvernance des agents IA

Les instructions textuelles orientent Claude, mais les interdictions critiques doivent aussi être imposées par permissions, hooks, protections de branche et CI. `CLAUDE.md` est chargé comme contexte et non comme mécanisme d’application forcée; Anthropic recommande des hooks lorsqu’une action doit être bloquée indépendamment de la décision du modèle.[^2]

## Approbation humaine obligatoire

- Choix ou changement d’architecture majeure.
- Ajout d’une dépendance de production.
- Modification d’un contrat API public.
- Migration destructive.
- Modification du modèle de tenancy.
- Règle fiscale ou légale.
- Calcul de prix ou de taxe.
- Paiement, remboursement ou transfert.
- Gestion d’allergènes.
- Changement de permissions.
- Secret ou configuration de production.
- Déploiement de production.
- Suppression ou export massif de données.
- Activation de l’alcool.

## Contrôles techniques

- Branche `main` protégée.
- Pull request obligatoire.
- CI obligatoire avant fusion.
- Reviews distinctes Sonnet puis Opus pour les modules critiques.
- `PreToolUse` hooks pour bloquer commandes destructives, lecture des secrets, push forcé et accès production non autorisé.
- Identités et secrets de développement séparés de la production.
- Aucun agent ne possède par défaut les droits d’administration cloud ou PSP en production.
- Commandes autorisées par liste pour les tâches automatisées.
- Journalisation des actions agentiques importantes.
- Diff affiché avant toute écriture sensible.
- Données synthétiques en développement; aucune copie brute de production.
- Un résultat de test n’est accepté que s’il provient d’une commande réellement exécutée et dont la sortie est enregistrée.
- Interdiction de désactiver un contrôle pour obtenir une CI verte.
- Interdiction de générer ou déduire des allergènes sans validation humaine.

## Responsabilité des modèles

- Opus propose et audite; il ne constitue ni un juriste, ni une fiduciaire, ni un pentester humain.
- Sonnet implémente seulement un lot spécifié.
- Les deux modèles doivent signaler les incertitudes et conflits.
- Aucun modèle ne peut s’auto-approuver sur un lot critique.
- Un audit externe de sécurité et une validation juridique restent des conditions de commercialisation, même si le développement est réalisé sans prestataire.

# Décisions finales ajoutées

Considère désormais comme validé :

- Développement effectué personnellement avec Claude, sans budget de main-d’œuvre externe au MVP.
- Hypothèse de travail fondée sur un restaurant indépendant standard de Lausanne jusqu’à l’arrivée d’un pilote réel.
- Politique d’annulation progressive selon l’état de préparation.
- Fiscalité configurable et validée par une fiduciaire; aucune règle fiscale codée en dur comme vérité universelle.
- Alcool modélisé mais désactivé, sous feature flag et contrôle documentaire.
- Pourboire optionnel, non présélectionné et désactivé jusqu’à validation comptable.
- Onboarding accompagné, pas de self-service au lancement.
- Abonnement mensuel d’avance avec frais de mise en service et procédure d’impayé.
- Sortie réversible avec export ouvert et suppression planifiée.
- Code de plateforme conservé par l’éditeur; marque et contenus conservés par le restaurant.
- Commandes spéciales avancées modélisées mais non activées au MVP.
- Capacité MVP simple, évolution prévue vers points de charge et stations.
- Validation d’adresse combinant fournisseur cartographique et confirmation humaine.
- Identité technique globale, données commerciales et consentements isolés par restaurant.
- Pilote validé par métriques techniques, opérationnelles et commerciales.
- Actions IA contraintes par permissions, hooks, CI et validation humaine.

# Attitude attendue

- Réponds en français.
- Sois direct, concret et orienté décision.
- Distingue faits, hypothèses, estimations et recommandations.
- Privilégie la solution la plus simple qui reste robuste.
- Refuse la complexité sans valeur démontrée.
- Explique brièvement les arbitrages structurants.
- Pose une question seulement si son absence change la sécurité, le coût ou l’architecture.
- Ne prétends jamais avoir vérifié une information sans preuve.
- Ne masque aucun échec de test, limite technique ou dépendance externe.
- Garde le produit utilisable par du personnel de restauration en plein service : peu d’étapes, états évidents, alertes fiables et mode dégradé documenté.

***

## Commande de départ recommandée

Après avoir placé ce prompt dans le dépôt, démarrer Claude Code ainsi :

```bash
claude update
claude --model claude-opus-5-5
```

Puis transmettre :

```text
Lis intégralement le prompt maître et exécute uniquement l’étape zéro. Crée les fichiers d’orchestration Claude Code et les livrables de cadrage, mais aucun code métier. Utilise Opus pour l’analyse et l’audit. Prépare le sous-agent Sonnet pour l’implémentation future. Arrête-toi au point de validation humaine demandé.
```

Le mode spécial `opusplan` peut aussi employer Opus pendant la planification puis Sonnet pendant l’exécution. Pour ce projet, les sous-agents explicitement configurés restent préférables, car ils rendent l’audit Opus indépendant, répétable et visible dans le dépôt.[^21]

---

## References

1. [Create custom subagents - Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents) - Create and use specialized AI subagents in Claude Code for task-specific workflows and improved cont...

2. [How Claude remembers your project - Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code/memory) - Use CLAUDE.md files when you want to guide Claude's behavior. Auto memory lets Claude learn from you...

3. [5.8. Row Security Policies](https://www.postgresql.org/docs/12/ddl-rowsecurity.html) - 5.8. Row Security Policies In addition to the SQL-standard privilege system available through GRANT,...

4. [Documentation | NestJS - A progressive Node.js framework](https://docs.nestjs.com/applications/architecture) - Nest is a framework for building efficient, scalable Node.js server-side applications. It uses progr...

5. [Migrate to a supported Connect configuration - Stripe Documentation](https://docs.stripe.com/connect/configuration-migration-guide) - Change your payments to direct charges. Doing so makes your connected accounts the merchant of recor...

6. [API Payment Intents | Documentation Stripe](https://docs.stripe.com/payments/payment-intents?locale=fr-FR) - Découvrez comment créer un PaymentIntent pour accepter des paiements via Stripe.

7. [Refund and cancel payments - Stripe Documentation](https://docs.stripe.com/refunds?locale=en-GB)

8. [What is PCI DSS compliance? - Stripe](https://stripe.com/guides/pci-compliance) - PCI DSS sets the minimum standard for data security. Follow our step-by-step guide to validating and...

9. [Important Updates Announced for Merchants Validating to Self ...](https://blog.pcisecuritystandards.org/important-updates-announced-for-merchants-validating-to-self-assessment-questionnaire-a) - SAQ A includes only those PCI DSS requirements applicable to merchants with account data functions c...

10. [2023 OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x00-header/) - OWASP API Security Top 10 2023 edition.

11. [OWASP Top 10 API Security Risks – 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) - APIs tend to expose endpoints that handle object identifiers, creating a wide attack surface of Obje...

12. [FAQ relatives à l'indication des prix](https://www.seco.admin.ch/fr/faq-oip) - Cette page recense les réponses aux questions les plus fréquentes concernant l'indication des prix

13. [Avant l'achat et conclusion du contrat](https://www.seco.admin.ch/fr/avant-l-achat-et-conclusion-du-contrat) - Quelles précautions est-il conseillé de prendre avant tout achat en ligne afin d’éviter de mauvaises...

14. [Achat d'aliments en ligne](https://www.blv.admin.ch/fr/achat-aliments-en-ligne) - En Suisse, le commerce en ligne est régi par la législation sur les denrées alimentaires. Les consom...

15. [Progressive Web Apps - web.dev](https://web.dev/learn/pwa/progressive-web-apps) - Caution: On both Android and iOS, users can't install PWAs from many in-app browsers, such as Facebo...

16. [Web Push for Web Apps on iOS and iPadOS - WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) - With iOS and iPadOS 16.4 beta 1 comes support for Web Push for Home Screen web apps, Badging API, Ma...

17. [50 Cart Abandonment Rate Statistics 2026 – Cart & Checkout](https://baymard.com/lists/cart-abandonment-rate) - Based on the data we collected, we've calculated the average cart abandonment rate of 70.22%. This v...

18. [Web Content Accessibility Guidelines (WCAG) 2.2 - W3C](https://www.w3.org/TR/WCAG22/) - 8 Target Size (Minimum). Understanding Target Size (Minimum) | How to Meet Target Size (Minimum). (L...

19. [Online Ordering API - Lightspeed Restaurant (U-Series)](https://api-docs.upserve.com/olo/)

20. [Point of Sale Solutions](https://www.epson.com.au/microsite/pos_solutions/technology.asp) - Epson offers the application developer many choices for printer and peripheral control. As a leader ...

21. [Model configuration - Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code/model-config) - Subagent or teammate override: Claude Code runs the subagent or teammate on a fallback model rather ...

22. [Problèmes après l'achat - seco.admin.ch](https://www.seco.admin.ch/fr/problemes-apres-lachat) - Quels sont les problèmes potentiels après un achat en ligne et quels droits ont les consommateurs po...

23. [Directive - 2011/83 - EN - EUR-Lex - European Union](https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=celex:32011L0083)

24. [02011L0083-20220528 - EN - EUR-Lex - Europa.eu](https://eur-lex.europa.eu/eli/dir/2011/83/2022-05-28/eng)

25. [Swiss VAT rates](https://www.estv.admin.ch/en/vat-rates-switzerland) - Here you will find information on VAT rates.

26. [Taux de TVA applicables en Suisse](https://www.estv.admin.ch/fr/taux-de-la-tva-suisse) - Taux de TVA actuellement en vigueur · Taux normal : 8,1 % · Taux réduit : 2,6 % · Taux spécial pour ...

27. [[PDF] Ordonnance régissant la taxe sur la valeur ajoutée* 641.201](https://www.estv.admin.ch/dam/fr/sd-web/HuVIXVE869tR/stp-themen-mwstv-mit-aenderungen-ab-2025-fr.pdf) - d'une prestation de la restauration et une livraison ou une vente à l'emporter constitue par exemple...

28. [Ordonnance régissant la taxe sur la valeur ajoutée](https://www.estv.admin.ch/dam/fr/sd-web/ZCfvcCGIDszz/mwst-publ-mwstv-aenderungen-2025-fr.pdf)

29. [Vente de boissons alcooliques | État de Vaud](https://www.vd.ch/economie/police-cantonale-du-commerce/informations-relatives-aux-autres-activites-reglementees/vente-de-boissons-alcooliques) - La livraison et la vente à l'emporter de boissons alcooliques distillées, ainsi que de la bière, son...

30. [Feuille info : Achats-tests d'alcool par des jeunes mineurs ...](https://www.vd.ch/fileadmin/user_upload/accueil/fichiers_pdf/2025_novembre_actus/1126-Feuille_info_-_Achats_tests_alcool.pdf)

31. [Vente au détail de boissons alcooliques - Ville de Lausanne](https://www.lausanne.ch/prestations/economie/vente-alcool-general/vente-au-detail-boissons-alcooliques.html) - Horaires. La livraison et la vente à l'emporter de boissons alcooliques distillées, ainsi que de la ...

32. [Horaires - Ville de Lausanne](https://www.lausanne.ch/vie-pratique/economie-et-commerces/etablissements-commerces-et-entreprises/etablissements/horaires.html) - La loi sur les auberges et les débits de boissons (LADB) et le règlement municipal sur les établisse...

33. [Questions fréquentes concernant la protection des données - EDÖB](https://www.edoeb.admin.ch/fr/faq-protection-des-donnees) - De A à Z

34. [La nouvelle loi fédérale sur la protection des données du ... - EDÖB](https://www.edoeb.admin.ch/fr/la-nouvelle-loi-federale-sur-la-protection-des-donnees-du-point-de-vue-du-pfpdt) - 05.03.2021 / mise à jour le 27.10.2022 - Le secteur privé et les autorités fédérales devront adapter...

