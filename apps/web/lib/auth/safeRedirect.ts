// apps/web/lib/auth/safeRedirect.ts

export const DEFAULT_POST_LOGIN_PATH = '/learn/dashboard'

/**
 * Normalize an untrusted `callbackUrl` into a safe, same-origin relative path.
 *
 * Why this exists
 * ---------------
 * `?callbackUrl=` on /login is produced by next-auth's `withAuth` middleware, not by
 * our own code. next-auth normally validates it internally, but the login page calls
 * `signIn(..., { redirect: false })` and performs the redirect itself with
 * `router.push()`, which bypasses that validation. Without this helper,
 * `/login?callbackUrl=https://evil.example/` sends a user who authenticated on the
 * real site straight to an attacker-controlled page.
 *
 * How it works
 * ------------
 * We never navigate to an absolute URL. We resolve the input, keep only
 * `pathname + search + hash`, and discard the origin entirely. The result is
 * same-origin by construction, so escaping the origin is not merely rejected —
 * it is impossible.
 *
 * This is deliberately chosen over comparing origins:
 *
 *  - The app is served on three hostnames (safety-quest.com, www.safety-quest.com,
 *    and the default *.azurewebsites.net). A strict origin comparison would reject a
 *    callbackUrl whose host is any bound hostname other than the one the visitor
 *    happens to be on, silently degrading deep-linking for those visitors.
 *  - It also does not matter whether next-auth emits the callbackUrl as an absolute
 *    URL or a relative path — both produce the same result here. No assumption about
 *    the library's emission format is baked in.
 *
 * The worst an attacker achieves is choosing an internal path the visitor could have
 * navigated to directly anyway.
 *
 * Every rejection falls back to `fallback` (default: the learner dashboard). This
 * never throws and never surfaces an error to the user.
 *
 * @param raw           Untrusted value, typically from `?callbackUrl=`.
 * @param currentOrigin Origin to resolve relative inputs against — pass
 *                      `window.location.origin`, which is whichever bound hostname
 *                      the visitor actually arrived on.
 * @param fallback      Path used when `raw` is missing or unusable.
 */
export function toSafeInternalPath(
  raw: string | null | undefined,
  currentOrigin: string,
  fallback: string = DEFAULT_POST_LOGIN_PATH
): string {
  if (!raw) return fallback

  const value = raw.trim()
  if (!value) return fallback

  // Control characters and whitespace can be stripped by browsers to smuggle a
  // scheme past naive checks (e.g. "java\nscript:").
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback

  try {
    const url = new URL(value, currentOrigin)

    // Anything that is not plain http(s) — javascript:, data:, mailto: — is rejected.
    // These parse successfully, so the protocol must be checked explicitly.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback

    // Origin is intentionally discarded here; only the path survives.
    const path = `${url.pathname}${url.search}${url.hash}`

    // "//evil.example" would resolve to an external origin, but its pathname is "/",
    // so it lands on the dashboard rather than off-site. Guard the shape anyway.
    if (!path.startsWith('/') || path.startsWith('//')) return fallback

    return path
  } catch {
    return fallback
  }
}
