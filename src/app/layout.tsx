import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { BlockProvider } from '@/components/providers/block-provider'
import { ClientLayout } from '@/components/client-layout'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Unfog-go - Czysty umysł, lepsze życie',
  description: 'Dołącz do użytkowników, którzy doznali uczucia czystego umysłu.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
