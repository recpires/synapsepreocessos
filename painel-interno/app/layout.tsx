import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FeedbackHost from '@/components/Feedback'
import { SCRIPT_ANTI_FLASH } from '@/components/ui'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Painel Interno — Synapse Code',
  description: 'Gestão financeira e operacional interna',
  applicationName: 'Synapse Painel',
  appleWebApp: {
    capable: true,
    title: 'Synapse',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Antes da primeira pintura, senão a tela pisca no tema errado. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ANTI_FLASH }} />
      </head>
      <body className={inter.className}>
        {children}
        <FeedbackHost />
      </body>
    </html>
  )
}
