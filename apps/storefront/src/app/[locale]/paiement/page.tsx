import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PaymentScreen } from "../../../components/PaymentScreen";
import { getDictionary, isSupportedLocale } from "../../../i18n/dictionary";
import { menu } from "../../../mock/menu";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function PaymentPage({ params }: PageProps): Promise<ReactElement> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);

  return <PaymentScreen locale={locale} dictionary={dictionary.payment} menu={menu} />;
}
