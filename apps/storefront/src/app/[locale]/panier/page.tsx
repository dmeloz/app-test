import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CartScreen } from "../../../components/CartScreen";
import { getDictionary, isSupportedLocale } from "../../../i18n/dictionary";
import { menu } from "../../../mock/menu";
import { slots } from "../../../mock/slots";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function CartPage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return <CartScreen locale={locale} dictionary={dictionary.cart} menu={menu} slots={slots} />;
}
