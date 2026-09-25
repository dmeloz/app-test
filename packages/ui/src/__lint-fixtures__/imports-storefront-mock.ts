// Fixture (AC-P01-11) : packages/ui → apps/storefront/src/mock, interdit par
// `import-x/no-restricted-paths` (ADR 0001 : un paquet n'importe pas une app — couvre aussi, en
// particulier, les données fictives de démonstration du lot P01).
// eslint-disable-next-line import-x/no-restricted-paths
export type { MockProduct } from "../../../../apps/storefront/src/mock/types";
