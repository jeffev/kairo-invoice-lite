/** Only allow same-site relative paths, to avoid open redirects via ?next=. */
export function safeRedirect(path: string | null | undefined, fallback = "/dashboard") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
