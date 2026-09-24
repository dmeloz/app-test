# Points de passage (gates)

## Gate 0 → 1 : passage du cadrage au développement

Conditions (toutes requises) :

- [ ] Le porteur a relu et validé explicitement `docs/product/scope-mvp.md`.
- [ ] ADR 0001 à 0010 et 0013 à 0015 passés de `Proposé` à `Accepté` (ou amendés).
- [ ] Décisions humaines listées dans `docs/product/open-decisions.md` § « Bloquantes pour le lot 0 » tranchées.
- [ ] Backlog des 30 premiers jours (`docs/product/backlog.md`) accepté.
- [ ] Fichiers d'orchestration Claude Code présents et hooks testés (`.claude/`).
- [ ] Dépôt protégé : `main` protégée, PR obligatoire, CI obligatoire (à configurer par l'humain sur GitHub).

Ne débloque que le **lot L00 (socle technique)**. Chaque lot suivant a sa propre validation de spec.

## Gate avant le lot paiement (L08)

- [ ] Vérification écrite (documentation Stripe + compte test CH) : TWINT disponible sur les comptes
      connectés suisses en direct charges ; type de compte connecté retenu ; responsabilité des soldes
      négatifs et litiges.
- [ ] ADR 0005 accepté après cette vérification.

## Gate avant staging

- [ ] ADR 0012 (hébergeur) accepté, régions de chaque composant et sous-traitant vérifiées.
- [ ] ADR 0011 (domaines/TLS) accepté.

## Gate avant pilote réel

- [ ] Restaurant pilote signé ; menu, prix, TVA, allergènes validés par le restaurant et sa fiduciaire.
- [ ] Pages légales et CGV validées par un juriste.
- [ ] Commande, échec, refus, remboursement complet et partiel testés de bout en bout en staging.
- [ ] Restauration de sauvegarde testée.
- [ ] Procédure de mode dégradé et astreinte définies.

## Gate avant commercialisation

- [ ] Test d'intrusion externe, validation juridique, contrats SaaS et DPA, page de statut.
