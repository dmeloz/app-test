// Dictionnaire FR/EN de la maquette P01 (mécanisme hérité du lot L00 : `packages/i18n` reste vide,
// l'i18n complet est prévu au lot L05 — voir `docs/lots/P01-maquette/implementation-report.md`).
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

interface Dictionary {
  readonly siteTitle: string;
  readonly banner: string;
  readonly board: {
    readonly heading: string;
    readonly columnNew: string;
    readonly columnPreparing: string;
    readonly columnReady: string;
    readonly noteLabel: string;
    readonly acceptLabel: string;
    readonly refuseLabel: string;
    readonly readyLabel: string;
    readonly confirmRefusalLabel: string;
    readonly cancelLabel: string;
    readonly refusalReasonLabel: string;
    readonly refusalReasonPlaceholder: string;
    readonly pauseButton: string;
    readonly resumeButton: string;
    readonly pausedNotice: string;
    readonly simulateButton: string;
    readonly emptyColumnMessage: string;
    readonly statusNew: string;
    readonly statusPreparing: string;
    readonly statusReady: string;
    readonly arrivalAnnouncement: string;
    readonly menuHeading: string;
    readonly soldOutToggleOn: string;
    readonly soldOutToggleOff: string;
  };
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  fr: {
    siteTitle: "Back-office — Le Belvédère Imaginaire",
    banner: "Démonstration — aucune commande réelle",
    board: {
      heading: "Tableau de service",
      columnNew: "Nouvelles",
      columnPreparing: "En préparation",
      columnReady: "Prêtes",
      noteLabel: "Note :",
      acceptLabel: "Accepter",
      refuseLabel: "Refuser",
      readyLabel: "Prête",
      confirmRefusalLabel: "Confirmer le refus",
      cancelLabel: "Annuler",
      refusalReasonLabel: "Motif du refus",
      refusalReasonPlaceholder: "Ex. rupture de stock, fermeture anticipée…",
      pauseButton: "Pause des commandes",
      resumeButton: "Reprendre les commandes",
      pausedNotice: "Commandes en pause — aucune nouvelle commande de démonstration n'arrivera.",
      simulateButton: "Simuler une nouvelle commande",
      emptyColumnMessage: "Aucune commande.",
      statusNew: "Nouvelle",
      statusPreparing: "En préparation",
      statusReady: "Prête",
      arrivalAnnouncement: "Nouvelle commande reçue",
      menuHeading: "Rupture de stock",
      soldOutToggleOn: "Marquer en rupture",
      soldOutToggleOff: "Marquer disponible",
    },
  },
  en: {
    siteTitle: "Back office — Le Belvédère Imaginaire",
    banner: "Demo — no real orders",
    board: {
      heading: "Service board",
      columnNew: "New",
      columnPreparing: "Preparing",
      columnReady: "Ready",
      noteLabel: "Note:",
      acceptLabel: "Accept",
      refuseLabel: "Refuse",
      readyLabel: "Ready",
      confirmRefusalLabel: "Confirm refusal",
      cancelLabel: "Cancel",
      refusalReasonLabel: "Refusal reason",
      refusalReasonPlaceholder: "E.g. out of stock, early closing…",
      pauseButton: "Pause orders",
      resumeButton: "Resume orders",
      pausedNotice: "Orders paused — no new demo order will arrive.",
      simulateButton: "Simulate a new order",
      emptyColumnMessage: "No orders.",
      statusNew: "New",
      statusPreparing: "Preparing",
      statusReady: "Ready",
      arrivalAnnouncement: "New order received",
      menuHeading: "Out of stock",
      soldOutToggleOn: "Mark out of stock",
      soldOutToggleOff: "Mark available",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
