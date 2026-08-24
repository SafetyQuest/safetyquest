// apps/web/lib/site.ts

/**
 * Canonical public origin, used for metadataBase, robots.txt and sitemap.xml.
 *
 * The app is served on three hostnames (safety-quest.com, www.safety-quest.com and
 * the default *.azurewebsites.net). Search engines need one canonical origin, and
 * this is it. Runtime redirect handling deliberately does NOT use this value — see
 * lib/auth/safeRedirect.ts, which resolves against the origin the visitor actually
 * arrived on so that every bound hostname keeps working.
 */
export const SITE_URL = (
  process.env.NEXTAUTH_URL || 'https://safety-quest.com'
).replace(/\/+$/, '')

export const SUPPORT_EMAIL = 'adnan.anwar@total-logix.com'
export const OPERATOR = 'Totalogix (SMC-Private) Limited'
