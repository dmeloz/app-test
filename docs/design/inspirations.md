# Inspirations visuelles (références, pas des spécifications)

> Les références sont décrites plutôt que copiées : les captures de tiers ne sont pas commitées (droits
> d'auteur, dépôt public). Toute reprise passe par nos design tokens (ADR 0015) et les règles de
> `.claude/rules/frontend.md`.

## R1 — « Dashboard V3 » (Code XR, vidéo réseau social, partagée par le porteur le 2026-09-24)

### Ce que montre la référence
- Barre de navigation supérieure en **pilules** (Home, Projects, Invoices, Settings), onglet actif plein et contrasté.
- **Cartes arrondies** (rayon ~16–24 px), fond clair légèrement teinté, ombres très douces, beaucoup d'air.
- **Cartes de statut en couleurs pastel** (jaune, bleu, rose) avec barre de progression, échéance
  (« 2 Days Left ») et avatars de l'équipe.
- Barre latérale d'icônes verticale, compacte, sombre.
- Colonnes de contenu : informations détaillées, calendrier avec jours colorés, boîte de réception.
- Code : cartes de statistiques (`StatsCard` : titre, valeur, variation en %, icône, dégradé), effet
  « glass », animation au survol (framer-motion), icônes lucide-react.

### À reprendre (utile pour le back-office et la maquette P01)
| Élément | Où chez nous | Adaptation |
|---|---|---|
| Colonnes de cartes à statut coloré | Tableau de service : Nouvelles / En préparation / Prêtes | Couleur = **état de la commande**, jamais seule (texte + icône aussi, daltonisme) ; tokens sémantiques `--status-new`, `--status-preparing`, `--status-ready` |
| Barre de progression + échéance | Carte de commande : temps restant avant l'heure promise | « Prête dans 8 min » ; passe en alerte (rouge) si retard |
| Cartes de statistiques (valeur + variation) | Statistiques essentielles (L13) : CA du jour, commandes, panier moyen, taux de refus | Montants CHF formatés `Intl`, variation vs même jour semaine précédente |
| Navigation en pilules | Back-office : Service · Menu · Horaires · Équipe · Stats | Cibles ≥ 44 px pour tablette |
| Barre latérale d'icônes | Navigation secondaire sur tablette paysage | Libellés visibles au focus / lecteur d'écran |
| Calendrier à jours colorés | Horaires et fermetures exceptionnelles (L03) | Fermeture = couleur + motif/texte |
| Beaucoup d'air, rayons généreux | Thème par défaut du back-office | Via tokens `--radius-*`, `--space-*` |

### À éviter ou à adapter
- **Effet « glass » / transparence** : risque de contraste insuffisant (WCAG AA exigé, contrôle
  automatique ADR 0015) → fonds opaques par défaut.
- **Animations au survol** : inutiles sur tablette tactile en plein service et coûteuses ; seulement des
  transitions courtes, désactivées si `prefers-reduced-motion`.
- **Texte petit et gris clair** (lisibilité en cuisine, écran éloigné) → tailles plus grandes sur le
  tableau de service.
- **Couleurs Tailwind codées en dur** (`text-emerald-400`…) → interdit : uniquement des tokens.
- **Dépendances `framer-motion` et `lucide-react`** : non installées. Toute ajout de dépendance de
  production = validation humaine. Pour les icônes, un jeu d'icônes SVG libre (ex. lucide) est plausible
  au lot P01/L05 si justifié ; les animations se font d'abord en CSS.
- **Données personnelles affichées** (e-mail, téléphone en clair sur un profil) → minimisation : pas
  d'affichage non nécessaire au service.

### Utilisation prévue
- **P01 (maquette)** : tableau de service et cartes de commande inspirés de R1, avec les adaptations ci-dessus.
- **L05 / L09 / L13** : thème par défaut du back-office, cartes de statistiques.
