// Fixture (N9, audit-2.md) : packages/domain n'utilise jamais le type import("...") (TSImportType),
// qui contourne la liste d'autorisation puisqu'il n'est pas capté par ImportExpression.
// eslint-disable-next-line no-restricted-syntax
export type Unused = import("pg").Client;
