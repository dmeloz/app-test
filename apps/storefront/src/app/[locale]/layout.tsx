import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isSupportedLocale, SUPPORTED_LOCALES } from "../../i18n/dictionary";

export function generateStaticParams(): Array<{ locale: string }> {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Restaurant — commande en ligne",
};

interface LocaleLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

// Root layout de l'App Router (aucun `app/layout.tsx` séparé, cf. ADR 0010 et modèle
// « app-dir-i18n-routing » de Next.js) : `<html>`/`<body>` sont posés ici, une fois.
export default async function LocaleLayout({ children, params }: LocaleLayoutProps): Promise<ReactNode> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
