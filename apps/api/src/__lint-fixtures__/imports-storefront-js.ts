// Fixture (H1) : api → storefront, via un fichier `.js` réel — reproduit le cas où l'ancien
// résolveur (sans `eslint-import-resolver-typescript`) ignorait silencieusement les imports
// résolus vers un `.js` (audit-1.md, constat H1). Interdit par `import-x/no-restricted-paths`.
// eslint-disable-next-line import-x/no-restricted-paths
export { targetValue } from "../../../storefront/src/__lint-fixtures__/target.js";
