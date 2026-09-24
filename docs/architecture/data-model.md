# Modèle de données — premier niveau

> Statut : PROPOSÉ. Détail colonne par colonne produit dans la spec de chaque lot.
> Conventions (`.claude/rules/database.md`) : PK `id uuid` (v7) ; `tenant_id uuid NOT NULL` sur toute
> table scoped (**T**) ; RLS forcée sur les tables marquées **RLS** ; `created_at`, `updated_at timestamptz`;
> montants `*_amount bigint` + `currency char(3)` ; taux en points de base ; tables **AO** = append-only.
> Rétention : proposition à valider (juriste/fiduciaire) — voir `docs/compliance/privacy-and-legal.md`.

## Vue d'ensemble des relations

```text
tenant 1─* restaurant 1─* location
tenant 1─1 subscription            restaurant 1─* domain        restaurant 1─* brand_theme (versions)
tenant 1─* membership *─1 platform_user        membership *─* role *─* permission
restaurant 1─1 payment_account (Stripe connecté)
restaurant 1─* menu 1─* menu_version ; menu_version 1─* category 1─* product 1─* variant
product *─* option_group 1─* option ; product *─* allergen (product_allergen) ; product 1─* origin_declaration
location 1─* opening_hours / closure / availability_rule / capacity_rule / delivery_zone ; location 1─* time_slot 1─* slot_reservation
restaurant 1─* customer 1─* customer_address ; customer 1─* consent
location 1─* cart 1─* cart_item
location 1─* order 1─* order_item_snapshot 1─* order_item_option_snapshot ; order 1─* order_transition
order 1─* payment 1─* refund ; payment 1─* dispute ; order 0─1 promotion_redemption *─1 promotion
tenant 1─* notification, outbox_message, audit_log, data_subject_request, support_case, integration
webhook_event (global, rattaché ensuite à tenant/objet)
```

## Plateforme, tenancy, identité

| Table | Portée | Champs clés | Contraintes / index | Conservation |
|---|---|---|---|---|
| `tenant` | global | `legal_name`, `status` (onboarding/active/restricted/terminating/closed), `country`, `default_currency` | | durée du contrat + archives |
| `subscription` | T | `plan`, `status`, `period_start/end`, `setup_fee_amount`, `monthly_amount`, `currency`, `stripe_customer_id` | 1 active par tenant (index partiel) | 10 ans (pièces comptables plateforme) |
| `restaurant` | T, RLS | `slug` (unique global), `legal_entity_name`, `legal_address`, `vat_number`, `default_locale`, `locales[]`, `status`, `features jsonb` (flags validés) | unique (`slug`) | contrat |
| `location` | T, RLS | `restaurant_id`, `name`, `address`, `geo point`, `timezone`, `pickup_enabled`, `delivery_enabled`, `auto_accept`, `paused_until`, `prep_min_minutes` | FK (`tenant_id`,`restaurant_id`) | contrat |
| `domain` | global | `hostname` (unique), `restaurant_id`, `tenant_id`, `kind` (platform_subdomain/custom), `verification_token`, `verified_at`, `tls_status` | unique (`hostname`) | contrat |
| `brand_theme` | T, RLS | `restaurant_id`, `version`, `tokens jsonb` (validé par schéma), `logo_asset_id`, `status` (draft/published), `contrast_report jsonb` | unique (`restaurant_id`,`version`) | versions : contrat |
| `content_page` | T, RLS | `restaurant_id`, `kind` (home/legal/privacy/terms/custom), `locale`, `body` (Markdown assaini), `version` | unique (`restaurant_id`,`kind`,`locale`,`version`) | versions CGV : 10 ans |
| `platform_user` | global | `oidc_subject` (unique), `email` (chiffré au repos applicatif), `display_name`, `status` | | compte + 1 an |
| `membership` | T, RLS | `user_id`, `restaurant_id?` / `location_id?` (portée), `role_id`, `status`, `revoked_at` | unique (`tenant_id`,`user_id`,`scope`) | + 1 an après révocation |
| `role` / `permission` / `role_permission` | global (rôles système) + T (rôles personnalisés plus tard) | rôles : owner, manager, staff, driver, accountant ; permission nommée `order.accept`, `refund.create`… | | — |
| `refund_limit` | T, RLS | `role_id`, `max_amount_per_order`, `currency` | | — |
| `support_access_grant` | T | `operator_id`, `reason`, `scope`, `expires_at`, `approved_by` | AO | 2 ans |
| `feature_flag` | global | `key`, `restaurant_id?`, `enabled`, `evidence_ref` (ex. licence alcool) | | — |

## Catalogue et menu

| Table | Portée | Champs clés | Notes |
|---|---|---|---|
| `menu` | T, RLS | `restaurant_id`, `name`, `current_version_id` | |
| `menu_version` | T, RLS, AO après publication | `menu_id`, `number`, `status` (draft/scheduled/published/archived), `published_at`, `published_by`, `publish_at?` | Une version publiée est immuable ; édition = nouvelle version |
| `category` | T, RLS | `menu_version_id`, `position`, `name i18n jsonb` | |
| `product` | T, RLS | `menu_version_id`, `category_id`, `sku_ref` (stable entre versions), `name/description i18n`, `image_asset_id`, `base_price_amount`, `currency`, `tax_code`, `max_qty_per_order`, `is_alcoholic`, `alcohol_category`, `abv_bp`, `min_age`, `kind` (standard/bundle; poids/catering modélisés désactivés) | |
| `variant` | T, RLS | `product_id`, `name i18n`, `price_amount`, `position`, `is_default` | |
| `option_group` | T, RLS | `menu_version_id`, `name i18n`, `min_select`, `max_select`, `kind` (choice/extra/removal) | CHECK `0 ≤ min ≤ max` |
| `product_option_group` | T, RLS | `product_id`, `option_group_id`, `position` | |
| `option` | T, RLS | `option_group_id`, `name i18n`, `price_delta_amount`, `preselected` | CHECK : `preselected = false` si `price_delta_amount > 0` |
| `allergen` | global | code des 14 allergènes réglementaires + libellés i18n | référentiel |
| `product_allergen` | T, RLS | `product_id`, `allergen_code`, `presence` (contains/may_contain), `validated_by`, `validated_at` | Non publiable sans validation humaine |
| `origin_declaration` | T, RLS | `product_id`, `ingredient` (viande/poisson…), `origin_country`, `production_method?`, `validated_by/at` | |
| `stock_item` | T, RLS | `location_id`, `sku_ref` ou `option_ref`, `out_of_stock`, `until?` | rupture en un geste, par établissement |
| `availability_rule` | T, RLS | `location_id`, cible (catégorie/produit), `channels[]`, `days_of_week`, `start_time`, `end_time` | |

## Horaires, capacité, livraison

| Table | Portée | Champs clés | Notes |
|---|---|---|---|
| `opening_hours` | T, RLS | `location_id`, `day_of_week`, `open_time`, `close_time`, `channel?` | |
| `closure` | T, RLS | `location_id`, `starts_at`, `ends_at`, `reason` | fermetures exceptionnelles |
| `capacity_rule` | T, RLS | `location_id`, `channel`, `slot_minutes`, `max_orders`, `max_items`, `buffer_before_close_min`, `large_order_items_threshold` | V2 : `load_points`, `station` |
| `time_slot` | T, RLS | `location_id`, `channel`, `starts_at`, `ends_at`, `max_orders`, `max_items`, `reserved_orders`, `reserved_items` | Généré à la demande ; CHECK `reserved_* ≤ max_*` ; unique (`location_id`,`channel`,`starts_at`) |
| `slot_reservation` | T, RLS | `time_slot_id`, `order_id`, `items`, `status` (held/confirmed/released), `expires_at` | Atomique avec l'incrément (ADR 0008) |
| `delivery_zone` | T, RLS | `location_id`, `version`, `kind` (radius/postcode/polygon), `radius_m?`, `postcodes[]?`, `polygon geometry?`, `min_order_amount`, `fee_amount`, `free_above_amount`, `currency`, `active` | Version snapshotée dans la commande |

## Clients et consentements

| Table | Portée | Champs clés | Conservation (proposée) |
|---|---|---|---|
| `customer` | T, RLS | `restaurant_id`, `email` (chiffré + hash de recherche), `phone` (chiffré), `first_name`, `platform_user_id?` | 3 ans après dernière commande, puis anonymisation |
| `customer_address` | T, RLS | `customer_id`, champs structurés (rue, n°, complément, NPA, localité, bâtiment, étage, interphone), `raw_input`, `normalized`, `geo`, `precision`, `validation_status` | idem |
| `consent` | T, RLS, AO | `customer_id`, `restaurant_id`, `purpose` (marketing_email, push…), `granted`, `text_version`, `source`, `ip_hash` | durée de la relation + 3 ans (preuve) |
| `data_subject_request` | T, RLS | `kind` (access/rectify/export/object/delete), `status`, `due_at`, `handled_by` | 3 ans |

## Panier, commande, paiement

| Table | Portée | Champs clés | Notes |
|---|---|---|---|
| `cart` | T, RLS | `location_id`, `channel`, `public_token_hash`, `expires_at` | 7 jours |
| `cart_item` | T, RLS | `cart_id`, `product_sku_ref`, `variant_id`, `options jsonb`, `qty` | Aucun prix stocké ; recalcul à chaque devis |
| `order` | T, RLS | `location_id`, `number` (lisible, séquence par établissement/jour), `public_token_hash`, `channel`, `op_status`, `fin_status`, `menu_version_id`, `requested_slot`, `promised_at`, `customer_snapshot jsonb` (chiffré), `address_snapshot jsonb` (chiffré), `zone_snapshot jsonb`, `tax_profile_snapshot jsonb`, `subtotal/discount/delivery_fee/tip/tax/total_amount`, `currency`, `terms_version`, `idempotency_key`, `customer_note`, `internal_note` | unique (`tenant_id`,`idempotency_key`) ; index (`location_id`,`op_status`,`promised_at`) ; 10 ans (pièce comptable du restaurant, à valider) |
| `order_item_snapshot` | T, RLS, AO | `order_id`, `sku_ref`, `name i18n`, `variant_name`, `unit_price_amount`, `qty`, `tax_code`, `tax_rate_bp`, `line_net/tax/gross_amount`, `allergens jsonb` | Immuable |
| `order_item_option_snapshot` | T, RLS, AO | `order_item_id`, `group_name`, `option_name`, `price_delta_amount` | Immuable |
| `order_transition` | T, RLS, AO | `order_id`, `machine` (op/fin), `from`, `to`, `actor_type`, `actor_id`, `reason`, `at` | |
| `payment` | T, RLS | `order_id`, `provider`, `stripe_account_id`, `payment_intent_id` (unique), `checkout_session_id`, `method` (card/twint), `amount`, `currency`, `status`, `fee_amount?`, `idempotency_key` | |
| `refund` | T, RLS | `payment_id`, `amount`, `currency`, `reason_code`, `comment`, `requested_by`, `approved_by?`, `provider_refund_id` (unique), `status`, `idempotency_key` | CHECK somme ≤ montant payé (vérifiée en transaction) |
| `dispute` | T, RLS | `payment_id`, `provider_dispute_id`, `status`, `amount`, `evidence_due_by`, `evidence_ref` | |
| `promotion` / `promotion_redemption` | T, RLS | code (unique par restaurant, insensible à la casse), `kind` (fixed/percent), `value`, `valid_from/to`, `min_amount`, `channels[]`, `global_limit`, `per_customer_limit`, `active` / `promotion_id`, `order_id`, `customer_id?` | après pilote |
| `tax_profile` | T, RLS | `location_id`, `country`, `valid_from`, `rules jsonb` (code de taxe × canal → taux bp), `validated_by`, `validated_at` | versionné, jamais modifié rétroactivement |

## Asynchrone, intégrations, audit

| Table | Portée | Champs clés | Notes |
|---|---|---|---|
| `outbox_message` | T | `topic`, `payload jsonb` (sans PII inutile), `dedup_key` (unique), `status`, `attempts`, `next_attempt_at`, `last_error` | Dead-letter = `status='dead'` |
| `notification` | T, RLS | `channel` (email/push/sms), `template`, `locale`, `recipient_hash`, `status`, `provider_message_id`, `order_id?` | journal d'envoi, 1 an |
| `integration` | T, RLS | `kind` (pos/printer/delivery/accounting), `provider`, `config` (secrets dans le coffre, référence seulement), `status`, `last_seen_at` | |
| `webhook_event` | global puis T | `provider`, `provider_event_id` (unique par provider), `type`, `received_at`, `signature_valid`, `processed_at`, `status`, `payload` (chiffré, 90 j) | Déduplication avant traitement |
| `audit_log` | T, AO | `actor_type`, `actor_id`, `action`, `target_type`, `target_id`, `diff jsonb` (minimal, sans secret), `correlation_id`, `ip_hash`, `at` | 2 ans (proposé) ; partitionnement mensuel plus tard |
| `support_case` | T, RLS | `order_id?`, `priority` (P1–P4), `status`, `summary` (sans PII), `opened_by` | 3 ans |
| `idempotency_key` | T | `key`, `route`, `request_hash`, `response jsonb`, `expires_at` | 24–72 h |
| `onboarding_step` | T | `step`, `status`, `owner`, `evidence_ref`, `blocked_reason` | |

## Champs chiffrés (au niveau applicatif, clé par environnement dans le coffre)

E-mail et téléphone clients, snapshots client/adresse des commandes, payload des webhooks, e-mail du
personnel. Recherche par hash HMAC. Rotation de clé documentée (`docs/security/security-baseline.md`).

## Stratégie de suppression

- Tenant résilié : export → lecture seule 30 j → suppression des données sans obligation de conservation →
  anonymisation des commandes conservées (snapshots client vidés, adresse réduite au NPA).
- Client (demande de suppression) : anonymisation du profil et des snapshots de ses commandes, conservation
  des montants et lignes pour la comptabilité du restaurant.
- Sauvegardes : expiration selon leur cycle (35 j PITR + mensuelles 12 mois, proposé) ; pas de réécriture.
