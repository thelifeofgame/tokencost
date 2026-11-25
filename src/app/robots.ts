import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*?*model=*',
          '/*?*ctx=*',
          '/*?*tokens=*',
          '/*?*reqs=*',
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://tokencostsai.com/sitemap.xml',
    host: 'https://tokencostsai.com',
  };
}
