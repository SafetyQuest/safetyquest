// apps/web/app/robots.ts
import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Public surface: the landing page and the sign-in page.
        allow: '/',
        // Everything behind authentication. These are already gated by
        // middleware; listing them keeps crawlers from wasting requests on
        // redirects to /login, which is the pattern that made a brand-new
        // domain look like a credential-harvesting site in the first place.
        disallow: ['/admin', '/learn', '/api', '/auth'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
