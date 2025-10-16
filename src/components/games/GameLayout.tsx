'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GameLayoutProps {
  children: ReactNode
  showBackButton?: boolean
}

export const GameLayout: React.FC<GameLayoutProps> = ({ 
  children, 
  showBackButton = true 
}) => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-cyan-50/30">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Left - Back Button */}
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="rounded-xl border-gray-200 hover:border-gray-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Wróć
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="rounded-xl border-gray-200 hover:border-gray-300"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>

            {/* Center - Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎮</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Gry Relaksacyjne
              </span>
            </div>

            {/* Right - Spacer for balance */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/60 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>© 2024 Spokój w Głowie</span>
              <span>•</span>
              <span>Terapie Potwierdzone Naukowe</span>
            </div>
            <div className="flex items-center gap-6">
              <span>🧠 Mindfulness</span>
              <span>💆 Relaksacja</span>
              <span>🎯 Koncentracja</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}