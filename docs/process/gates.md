# Points de passage (gates)

## Gate 0 → 1 : passage du cadrage au développement

Conditions (toutes requises) :

- [x] Le porteur a relu et validé explicitement `docs/product/scope-mvp.md` (2026-09-24).
- [x] ADR 0001–0004, 0006–0008, 0010, 0013–0015 acceptés (2026-09-24). 0005 et 0009 restent soumis à leurs propres gates (L08, L02).
- [x] Décisions D1 à D6 tranchées selon les recommandations (2026-09-24).
- [x] Backlog des 30 premiers jours accepté (2026-09-24).
- [x] Fichiers d'orchestration Claude Code présents et hooks testés (`.claude/hooks/test-guards.sh`, 31/31).
- [ ] Dépôt protégé : `main` protégée, PR obligatoire, CI obligatoire (à configurer par l'humain sur GitHub — **non confirmé**, requis avant la première fusion).

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
