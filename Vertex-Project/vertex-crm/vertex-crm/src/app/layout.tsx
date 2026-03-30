import type { Metadata } from 'next'
import { Instrument_Sans } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
})

export const metadata: Metadata = {
  title: 'Vertex AI Marketing CRM',
  description: 'AI-powered CRM for Vertex AI Marketing — Lead Intelligence, Email Automation, and Scoping Call Scheduling',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${instrumentSans.variable} font-sans antialiased bg-[#09090f] text-slate-200`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
