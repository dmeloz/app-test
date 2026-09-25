import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ServiceBoardScreen } from "../../components/ServiceBoardScreen";
import { getDictionary, isSupportedLocale } from "../../i18n/dictionary";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

// Écran 4 (spec P01 §2) : tableau de service, seul écran du back-office pour la maquette P01.
export default async function HomePage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return <ServiceBoardScreen locale={locale} dictionary={dictionary.board} />;
}
