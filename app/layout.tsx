import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next Generation Cup — Teranga Agency',
  description: 'Plateforme officielle de gestion de la Next Generation Cup présentée par Teranga Agency.',
  icons: {
    icon: [
      {
        url: '/logo-next-gen-cup.jpg',
      },
      {
        url: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon.ico',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        url: '/logo-next-gen-cup.jpg',
      },
    ],
    shortcut: '/logo-next-gen-cup.jpg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="light">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
