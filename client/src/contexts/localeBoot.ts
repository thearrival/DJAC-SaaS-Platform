// Small holder so main.tsx can preload the active locale catalog before the
// first render, avoiding a flash of English for non-English users.
export let preloadedCatalog: Record<string, string> | null = null;

export function setPreloadedCatalog(catalog: Record<string, string>): void {
  preloadedCatalog = catalog;
}
