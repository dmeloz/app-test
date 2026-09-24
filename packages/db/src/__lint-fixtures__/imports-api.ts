// Fixture (H1) : packages/db → apps/api, interdit par `import-x/no-restricted-paths` (ADR 0001,
// "un paquet n'importe pas une app").
// eslint-disable-next-line import-x/no-restricted-paths
export { CORRELATION_ID_HEADER } from "../../../../apps/api/src/common/correlation/correlation";
