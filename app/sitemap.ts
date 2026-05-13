import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.doorly.com.ar'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}
