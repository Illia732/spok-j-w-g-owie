'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, User, Menu, Sparkles } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo - lewa strona */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Spokój
              </span>
            </div>
          </div>

          {/* Desktop Navigation - środek */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Dashboard
            </a>
            <a href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Zaloguj się
            </a>
            <a href="/auth/register" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Zarejestruj się
            </a>
          </nav>

          {/* Right side - actions */}
          <div className="flex items-center gap-3">
            
            {/* Notification bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-xs text-white items-center justify-center">
                  3
                </span>
              </span>
            </Button>

            {/* User avatar */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </Button>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-3 space-y-3">
              <a href="/" className="block text-sm font-medium text-gray-900 hover:text-blue-600 py-2">
                Dashboard
              </a>
              <a href="/auth/login" className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2">
                Zaloguj się
              </a>
              <a href="/auth/register" className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2">
                Zarejestruj się
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}