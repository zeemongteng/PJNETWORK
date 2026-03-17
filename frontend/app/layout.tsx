import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const dmMono = DM_Mono({ 
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'Void Protocol Demo | GBNL Network',
  description: 'Data Sharding Security Model - Demonstrating secure fragmentation and reassembly for tactical communications',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0a0a14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
