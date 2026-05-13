import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://www.doorly.com.ar'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/buscar`,                  changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/faq`,                     changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/terminos`,                changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacidad`,              changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/cookies`,                 changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/contenido-prohibido`,     changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/protocolo-bienes`,        changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/reembolsos`,              changeFrequency: 'monthly', priority: 0.3 },
  ]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .in('status', ['approved', 'active'])

  const dynamicRoutes: MetadataRoute.Sitemap = (listings ?? []).map((listing) => ({
    url: `${BASE_URL}/espacios/${listing.id}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...dynamicRoutes]
}
