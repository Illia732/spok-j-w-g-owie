// src/app/page.tsx - POPRAWIONA WERSJA
'use client'
import { useAuth } from '@/components/providers/auth-provider'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="text-sm font-medium text-blue-500">Architektura Uważności</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Spokój w Głowie
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Dołącz do tysięcy użytkowników którzy już odkryli siłę codziennej uważności i samoobserwacji.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg hover:bg-blue-700 transition-colors"
            >
              Rozpocznij Podróż
            </Link>
            <Link 
              href="/auth/login" 
              className="border border-blue-600 text-blue-600 px-8 py-4 rounded-full text-lg hover:bg-blue-50 transition-colors"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}