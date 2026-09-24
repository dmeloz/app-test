# Modèle de coûts et de marge (hypothèses à tester)

## Prix hypothétiques (prompt maître — non validés par le marché)

Essentiel CHF 149 · Pro CHF 249 · Premium CHF 399–599 (par mois et par site) · mise en service
CHF 1'500–3'500 · design exclusif et intégration POS sur devis · frais PSP payés par le restaurant.

## Marge contributive par établissement et par mois

```text
Marge = Abonnement
      − Infrastructure allouée (fixe mutualisé / nb établissements + variable par commande)
      − Services variables (e-mails, géocodage, SMS, stockage, logs)
      − Support (heures × coût horaire du porteur)
      − Amortissement de l'onboarding (heures × coût horaire − frais de mise en service) / durée d'engagement
      − Développement spécifique amorti
```

Variables à mesurer pendant le pilote : commandes/jour, e-mails/commande, géocodages/commande, heures de
support/mois, heures d'onboarding, coût d'infrastructure réel. Un tableur de calcul sera créé quand les
premiers coûts réels seront connus (aucun chiffre inventé ici).
