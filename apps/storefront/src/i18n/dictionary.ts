// Dictionnaire minimal FR/EN pour le lot L00 (i18n complet prévu au lot L05, `packages/i18n`).
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

interface Dictionary {
  readonly title: string;
  readonly description: string;
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  fr: {
    title: "Bientôt disponible",
    description: "Le site de commande de ce restaurant sera bientôt en ligne.",
  },
  en: {
    title: "Coming soon",
    description: "This restaurant's ordering site will be online soon.",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
