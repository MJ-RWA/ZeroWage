import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { WalletProvider } from '@/lib/wallet-context'

export const metadata: Metadata = {
  title: 'ZeroWage — Pay your team. Prove it cryptographically.',
  description:
    'Generate Groth16 zero-knowledge proofs for every payroll run while keeping salaries private on Stellar.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0A0B0D',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background font-sans antialiased overflow-x-hidden">
        <WalletProvider>
        {children}
        </WalletProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
