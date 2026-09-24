import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { getDictionary, isSupportedLocale, SUPPORTED_LOCALES } from "../../i18n/dictionary";

export function generateStaticParams(): Array<{ locale: string }> {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface LocaleLayoutParams {
  readonly params: Promise<{ locale: string }>;
}

// L4 (audit-1.md) : le titre de la page ne doit pas être codé en dur — il vient du même
// dictionnaire i18n que le contenu de la page (`../../i18n/dictionary`), par locale. `metadata`
// (export statique) ne peut pas dépendre de `params` : `generateMetadata` est la forme dynamique
// requise pour un titre qui varie par route `[locale]`.
export async function generateMetadata({ params }: LocaleLayoutParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  return { title: getDictionary(locale).title };
}

interface LocaleLayoutProps extends LocaleLayoutParams {
  readonly children: ReactNode;
}

// Root layout de l'App Router (aucun `app/layout.tsx` séparé, cf. ADR 0010 et modèle
// « app-dir-i18n-routing » de Next.js) : `<html>`/`<body>` sont posés ici, une fois.
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<ReactNode> {
  // M1 (audit-1.md) : la CSP à nonce (`src/proxy.ts`) exige un rendu dynamique par requête — sans
  // ceci, la page reste prégénérée au build (aucune requête, donc aucun nonce disponible), et Next
  // ne peut pas injecter le nonce dans ses propres scripts inline (doc Next 16, « Static vs Dynamic
  // Rendering with CSP », « Forcing dynamic rendering »).
  await connection();

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
