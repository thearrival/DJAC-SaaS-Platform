/**
 * Re-export of the canonical jurisdiction constants. The definitions live in
 * shared/jurisdictions.ts so the client and server import the same lists
 * (client: `@shared/jurisdictions`; server: this module, unchanged paths).
 */

export * from "../../shared/jurisdictions";
