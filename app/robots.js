const SITE_URL = 'https://kdkamato.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/home',
          '/login',
          '/progress',
          '/program',
          '/physical-consult',
          '/api/'
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
