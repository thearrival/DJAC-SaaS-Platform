/**
 * Ensures sslmode=no-verify in PostgreSQL connection strings.
 *
 * pg driver v8+ aliases sslmode=require/prefer/verify-ca to verify-full,
 * which rejects Supabase's self-signed certificates. Using no-verify
 * keeps SSL encryption while skipping certificate chain validation.
 */
export function fixSslMode(url: string): string {
  if (!url) return url;
  if (url.includes("sslmode")) {
    return url.replace(/sslmode=\w+/g, "sslmode=no-verify");
  }
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + "sslmode=no-verify";
}
