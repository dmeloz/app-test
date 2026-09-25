import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { TrackingScreen } from "../../../components/TrackingScreen";
import { getDictionary, isSupportedLocale } from "../../../i18n/dictionary";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function TrackingPage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return <TrackingScreen locale={locale} dictionary={dictionary.tracking} />;
}
