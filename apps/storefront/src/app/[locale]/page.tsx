import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { HomeScreen } from "../../components/HomeScreen";
import { getDictionary, isSupportedLocale } from "../../i18n/dictionary";
import { localize } from "../../mock/localize";
import { restaurant } from "../../mock/restaurant";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

// Écran 1 (spec P01 §2) : accueil du restaurant fictif — statut ouvert/fermé, délai estimé, choix
// Retrait/Livraison mis en avant, adresse et horaires.
export default async function HomePage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return (
    <HomeScreen
      locale={locale}
      dictionary={dictionary.home}
      restaurant={restaurant}
      tagline={localize(restaurant.tagline, locale)}
      openingHours={localize(restaurant.openingHours, locale)}
    />
  );
}
