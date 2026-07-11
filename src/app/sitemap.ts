import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/onboarding`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/blog/are-ai-dating-photos-allowed`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/blog/how-to-make-ai-photos-look-real`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/blog/3-photos-every-man-needs`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/affiliate`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date(), priority: 0.4 },
    { url: `${base}/terms`, lastModified: new Date(), priority: 0.4 },
  ]
}
