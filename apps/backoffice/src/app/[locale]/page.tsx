import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { getDictionary, isSupportedLocale } from "../../i18n/dictionary";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return (
    <main>
      <h1>{dictionary.title}</h1>
      <p>{dictionary.description}</p>
    </main>
  );
}
