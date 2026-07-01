import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/dashboard'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
