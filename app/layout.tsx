import type { Metadata } from 'next'
import '@fontsource-variable/montserrat'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Branding Lab by CJE Media',
  description: 'Where creativity meets strategy.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
