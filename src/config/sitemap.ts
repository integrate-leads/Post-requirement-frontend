/** Canonical site origin for sitemap `<loc>` URLs. */
export const SITE_ORIGIN = 'https://integrateleads.com';

/** Update when URLs or content meaningfully change (ISO 8601). */
export const SITEMAP_LASTMOD = '2026-03-31T12:00:00+00:00';

export type SitemapChangefreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export type SitemapEntry = {
  /** Path only, e.g. `/jobs` or `/` */
  path: string;
  changefreq: SitemapChangefreq;
  /** 0.0–1.0 */
  priority: string;
};

/** Public routes (matches PublicLayout; excludes /super-admin per robots.txt). */
export const SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/jobs', changefreq: 'daily', priority: '0.9' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.9' },
  { path: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms-and-conditions', changefreq: 'monthly', priority: '0.5' },
  { path: '/unsubscribe', changefreq: 'yearly', priority: '0.3' },
  { path: '/recruiter/login', changefreq: 'monthly', priority: '0.7' },
  { path: '/recruiter/signup', changefreq: 'monthly', priority: '0.7' },
  { path: '/recruiter/forgot-password', changefreq: 'yearly', priority: '0.4' },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function locForPath(path: string): string {
  if (path === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path}`;
}

/** Full sitemap document (same data as `public/sitemap.xml` when synced by Vite). */
export function buildSitemapXml(): string {
  const urlBlocks = SITEMAP_ENTRIES.map(
    (e) =>
      `  <url>
    <loc>${escapeXml(locForPath(e.path))}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
  <!-- Public marketing, legal, recruiter auth -->
${urlBlocks}

  <!--
    Not listed: /jobs/{id} (dynamic); /super-admin/* (robots disallow).
  -->
</urlset>
`;
}
