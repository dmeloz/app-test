// Dictionnaire FR/EN de la maquette P01 (mécanisme hérité du lot L00 : `packages/i18n` reste vide,
// l'i18n complet est prévu au lot L05 — voir `docs/lots/P01-maquette/implementation-report.md` pour
// la justification de ce choix). Aucun texte affiché par `apps/storefront` n'est codé en dur ailleurs
// que dans ce fichier.
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

interface Dictionary {
  readonly siteTitle: string;
  readonly banner: string;
  readonly localeSwitchLabel: string;
  readonly home: {
    readonly heading: string;
    readonly statusOpen: string;
    readonly statusClosed: string;
    readonly estimatedDelayPrefix: string;
    readonly estimatedDelaySuffix: string;
    readonly channelHeading: string;
    readonly channelPickup: string;
    readonly channelDelivery: string;
    readonly addressLabel: string;
    readonly hoursLabel: string;
    readonly seeMenu: string;
  };
  readonly menu: {
    readonly heading: string;
    readonly allergensLabel: string;
    readonly soldOutLabel: string;
    readonly addToCart: string;
    readonly includedChoice: string;
    readonly requiredHint: string;
    readonly optionalHint: string;
    readonly selectionError: string;
    readonly cartRegionLabel: string;
    readonly goToCart: string;
    readonly addedAnnouncement: string;
  };
  readonly cart: {
    readonly heading: string;
    readonly emptyMessage: string;
    readonly removeLine: string;
    readonly totalLabel: string;
    readonly slotHeading: string;
    readonly asapLabel: string;
    readonly slotUnavailable: string;
    readonly guestHeading: string;
    readonly guestName: string;
    readonly guestPhone: string;
    readonly guestNote: string;
    readonly payButton: string;
    readonly missingChannelWarning: string;
  };
  readonly payment: {
    readonly heading: string;
    readonly notice: string;
    readonly totalLabel: string;
    readonly confirmButton: string;
  };
  readonly tracking: {
    readonly heading: string;
    readonly orderNumberLabel: string;
    readonly stepAccepted: string;
    readonly stepPreparing: string;
    readonly stepReady: string;
    readonly advanceButton: string;
    readonly readyMessage: string;
    readonly noOrderMessage: string;
    readonly backToHome: string;
  };
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  fr: {
    siteTitle: "Le Belvédère Imaginaire",
    banner: "Démonstration — aucune commande réelle",
    localeSwitchLabel: "Changer de langue",
    home: {
      heading: "Le Belvédère Imaginaire",
      statusOpen: "Ouvert",
      statusClosed: "Fermé",
      estimatedDelayPrefix: "Délai estimé : environ",
      estimatedDelaySuffix: "min",
      channelHeading: "Comment souhaitez-vous être servi ?",
      channelPickup: "Retrait",
      channelDelivery: "Livraison",
      addressLabel: "Adresse",
      hoursLabel: "Horaires",
      seeMenu: "Voir le menu",
    },
    menu: {
      heading: "Menu",
      allergensLabel: "Allergènes",
      soldOutLabel: "Rupture de stock",
      addToCart: "Ajouter au panier",
      includedChoice: "inclus",
      requiredHint: "Obligatoire — choisissez 1",
      optionalHint: "Facultatif — jusqu'à 2 choix",
      selectionError: "Sélection incomplète : faites un choix avant d'ajouter au panier.",
      cartRegionLabel: "Panier",
      goToCart: "Voir le panier",
      addedAnnouncement: "ajouté au panier",
    },
    cart: {
      heading: "Panier et créneau",
      emptyMessage: "Votre panier de démonstration est vide.",
      removeLine: "Retirer",
      totalLabel: "Total",
      slotHeading: "Créneau",
      asapLabel: "Dès que possible",
      slotUnavailable: "Complet",
      guestHeading: "Vos coordonnées (démonstration)",
      guestName: "Nom",
      guestPhone: "Téléphone",
      guestNote: "Note pour le restaurant",
      payButton: "Payer",
      missingChannelWarning: "Choisissez Retrait ou Livraison sur l'accueil avant de continuer.",
    },
    payment: {
      heading: "Paiement simulé — démonstration",
      notice:
        "Ceci est une démonstration : aucun paiement réel n'est effectué, aucune carte n'est demandée.",
      totalLabel: "Montant (démonstration)",
      confirmButton: "Confirmer le paiement (démonstration)",
    },
    tracking: {
      heading: "Suivi de commande",
      orderNumberLabel: "Commande",
      stepAccepted: "Acceptée",
      stepPreparing: "En préparation",
      stepReady: "Prête",
      advanceButton: "Avancer la commande (démonstration)",
      readyMessage: "Votre commande de démonstration est prête.",
      noOrderMessage: "Aucune commande de démonstration en cours.",
      backToHome: "Retour à l'accueil",
    },
  },
  en: {
    siteTitle: "Le Belvédère Imaginaire",
    banner: "Demo — no real orders",
    localeSwitchLabel: "Switch language",
    home: {
      heading: "Le Belvédère Imaginaire",
      statusOpen: "Open",
      statusClosed: "Closed",
      estimatedDelayPrefix: "Estimated delay: about",
      estimatedDelaySuffix: "min",
      channelHeading: "How would you like to be served?",
      channelPickup: "Pickup",
      channelDelivery: "Delivery",
      addressLabel: "Address",
      hoursLabel: "Opening hours",
      seeMenu: "See menu",
    },
    menu: {
      heading: "Menu",
      allergensLabel: "Allergens",
      soldOutLabel: "Sold out",
      addToCart: "Add to cart",
      includedChoice: "included",
      requiredHint: "Required — choose 1",
      optionalHint: "Optional — up to 2 choices",
      selectionError: "Incomplete selection: make a choice before adding to cart.",
      cartRegionLabel: "Cart",
      goToCart: "View cart",
      addedAnnouncement: "added to cart",
    },
    cart: {
      heading: "Cart and time slot",
      emptyMessage: "Your demo cart is empty.",
      removeLine: "Remove",
      totalLabel: "Total",
      slotHeading: "Time slot",
      asapLabel: "As soon as possible",
      slotUnavailable: "Full",
      guestHeading: "Your details (demo)",
      guestName: "Name",
      guestPhone: "Phone",
      guestNote: "Note for the restaurant",
      payButton: "Pay",
      missingChannelWarning: "Choose Pickup or Delivery on the home page before continuing.",
    },
    payment: {
      heading: "Simulated payment — demo",
      notice: "This is a demo: no real payment is made, no card details are requested.",
      totalLabel: "Amount (demo)",
      confirmButton: "Confirm payment (demo)",
    },
    tracking: {
      heading: "Order tracking",
      orderNumberLabel: "Order",
      stepAccepted: "Accepted",
      stepPreparing: "Preparing",
      stepReady: "Ready",
      advanceButton: "Advance order (demo)",
      readyMessage: "Your demo order is ready.",
      noOrderMessage: "No demo order in progress.",
      backToHome: "Back to home",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
