import type { Metadata } from "next";
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
//
// M1 (audit-2.md) : ce fichier n'appelle plus `notFound()` lui-même (ni ici, ni dans le composant de
// layout ci-dessous) — un segment invalide reste de la responsabilité de `page.tsx` (seule source de
// vérité désormais). Un layout qui lève `notFound()` avant de rendre ses enfants court-circuite la
// limite `not-found.tsx` du segment (elle enveloppe les enfants du layout, pas le layout
// lui-même) : l'erreur remonte alors à la limite racine, rendue sans notre nonce CSP (constaté par
// `e2e/tests/not-found.spec.ts` : « Refused to apply inline style »). Voir `app/not-found.tsx`.
//
// L-b (audit-3.md) : le titre reste bilingue pour un segment `[locale]` non supporté (ex. `/xx`),
// cohérent avec le titre de `app/not-found.tsx` / `app/global-not-found.tsx` (métadonnées HTML —
// pas de contenu dupliqué dans le dictionnaire i18n, cf. commentaire de ces fichiers).
export async function generateMetadata({ params }: LocaleLayoutParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return { title: "404 — Page introuvable / Page not found" };
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

  // `locale` peut être non supporté ici (ex. `/xx`) : `page.tsx` lève `notFound()` dans ce cas (voir
  // commentaire ci-dessus) — l'attribut `lang` reste alors la valeur brute du segment, sans
  // conséquence puisque la page effectivement affichée est `app/not-found.tsx`.
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
