import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { MenuScreen } from "../../../components/MenuScreen";
import { getDictionary, isSupportedLocale } from "../../../i18n/dictionary";
import { menu } from "../../../mock/menu";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function MenuPage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return <MenuScreen locale={locale} dictionary={dictionary.menu} menu={menu} />;
}
