// Fixture (H1) : fichier `.js` réel, cible d'un import cross-app depuis `apps/api` — reproduit le
// bug original où un import résolu vers un `.js` n'était pas reconnu par la règle de frontières
// (résolveur absent, voir audit-1.md constat H1).
export const targetValue = 1;
