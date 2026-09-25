import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { DemoBanner, ThemeStyle } from "@app/ui";
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
//
// M1 (audit-2.md) : ce fichier n'appelle plus `notFound()` lui-même (ni ici, ni dans le composant de
// layout ci-dessous) — un segment invalide reste de la responsabilité de `page.tsx` (seule source de
// vérité désormais). Voir `app/not-found.tsx`.
//
// P01 : le titre devient le nom du restaurant de démonstration (`dictionary.siteTitle`), identique
// sur toutes les pages — pas de contenu métier dans les métadonnées.
export async function generateMetadata({ params }: LocaleLayoutParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return { title: "404 — Page introuvable / Page not found" };
  }
  return { title: getDictionary(locale).siteTitle };
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

  // `locale` peut être non supporté ici (ex. `/xx`) : `page.tsx` lève `notFound()` dans ce cas (voir
  // commentaire ci-dessus) — l'attribut `lang` reste alors la valeur brute du segment, sans
  // conséquence puisque la page effectivement affichée est `app/not-found.tsx`.
  const { locale } = await params;

  // P01 : le nonce posé par `src/proxy.ts` (en-tête `x-nonce` de la requête, voir ce fichier) sert
  // aussi à injecter la feuille de style du thème de démonstration via <style nonce=...> — jamais un
  // attribut `style=""` en ligne (non couvert par un nonce CSP, `.claude/rules/security.md`).
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? "";

  const bannerText = isSupportedLocale(locale)
    ? getDictionary(locale).banner
    : getDictionary("fr").banner;

  return (
    <html lang={locale}>
      <head>
        <ThemeStyle nonce={nonce} />
      </head>
      <body>
        <DemoBanner text={bannerText} />
        {children}
      </body>
    </html>
  );
}
