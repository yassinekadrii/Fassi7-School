import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/portal/', '/api/'],
      },
    ],
    sitemap: 'https://fassi7.com/sitemap.xml',
  };
}
