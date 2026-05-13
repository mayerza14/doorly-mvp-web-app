import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Almacenamiento y Estacionamiento Privado en Argentina | Doorly',
  description: 'Encontrá espacios privados para guardar tus cosas o estacionar cerca tuyo. Reservá online y pagá con Mercado Pago.',
  metadataBase: new URL('https://www.doorly.com.ar'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Almacenamiento y Estacionamiento Privado en Argentina | Doorly',
    description: 'Encontrá espacios privados para guardar tus cosas o estacionar cerca tuyo. Reservá online y pagá con Mercado Pago.',
    url: 'https://www.doorly.com.ar',
    siteName: 'Doorly',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Doorly - Almacenamiento y Estacionamiento Privado',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Almacenamiento y Estacionamiento Privado en Argentina | Doorly',
    description: 'Encontrá espacios privados para guardar tus cosas o estacionar cerca tuyo. Reservá online y pagá con Mercado Pago.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
