# ADR 0011 — Domaines personnalisés et TLS

- **Statut** : Proposé — mise en œuvre après pilote · **Date** : 2026-09-24

## Contexte
Chaque restaurant doit pouvoir utiliser son domaine. Cela exige preuve de contrôle DNS et émission
automatique de certificats.

## Options
1. Pilote sur sous-domaine `<slug>.<plateforme>` (certificat wildcard) ; domaines perso ensuite via
   reverse proxy à TLS « à la demande » (ex. Caddy on-demand TLS avec endpoint d'autorisation) ou via la
   fonctionnalité de domaines personnalisés du CDN/hébergeur retenu.
2. Domaines perso dès le pilote.

## Décision proposée
Option 1. Table `domain` prévue dès L01 ; preuve TXT ; revérification périodique ; désactivation si perte
de contrôle. Choix du mécanisme TLS lié à l'ADR 0012.

## Risques
Abus d'émission de certificats → autorisation limitée aux domaines vérifiés ; limites de l'autorité de
certification ; domaine enregistré au nom du restaurant (recommandé).

## Réversibilité
Élevée : la résolution par `Host` est indépendante du mécanisme TLS.
