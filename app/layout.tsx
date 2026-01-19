import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Opt Art Flowers',
  description: 'A beautiful landing page with blooming flowers optical art effect',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
