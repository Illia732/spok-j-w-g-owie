'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  LogOut, User, Sparkles, Menu, X, Home, BarChart3, 
  MapPin, Users, BookOpen, FileText, Gamepad, MoreHorizontal,
  Heart, Brain, Zap
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// 🎯 INTELIGENTNA KONFIGURACJA NAWIGACJI - PRIORYTET UX
const NAVIGATION_CONFIG = {
  // 🥇 PIERWSZY POZIOM - 4 NAJCZĘŚCIEJ UŻYWANE (zawsze widoczne)
  primary: [
    { 
      href: '/dashboard', 
      icon: Home, 
      label: 'Dashboard', 
      description: 'Strona główna',
      color: 'blue',
      essential: true
    },
    { 
      href: '/mood', 
      icon: BarChart3, 
      label: 'Nastrój', 
      description: 'Śledź swój nastrój',
      color: 'purple',
      essential: true
    },
    { 
      href: '/games', 
      icon: Gamepad, 
      label: 'Gry', 
      description: 'Relaks i odprężenie',
      color: 'cyan',
      essential: true
    },
    { 
      href: '/articles', 
      icon: BookOpen, 
      label: 'Artykuły', 
      description: 'Baza wiedzy',
      color: 'amber',
      essential: true
    }
  ],
  
  // 🥈 DRUGI POZIOM - WAŻNE ALE RZADZIEJ UŻYWANE (w menu)
  secondary: [
    { 
      href: '/ai', 
      icon: Sparkles, 
      label: 'Pomoc AI', 
      description: 'Wsparcie sztucznej inteligencji',
      color: 'indigo'
    },
    { 
      href: '/dashboard/friends', 
      icon: Users, 
      label: 'Znajomi', 
      description: 'Twoja społeczność',
      color: 'orange'
    },
    { 
      href: '/map', 
      icon: MapPin, 
      label: 'Mapa Wsparcia', 
      description: 'Miejsca pomocy w okolicy',
      color: 'green'
    }
  ],
  
  // 🥉 TRZECI POZIOM - ADMIN I KONTO (oddzielna sekcja)
  tertiary: [
    { 
      href: '/admin/articles', 
      icon: FileText, 
      label: 'Panel Admina', 
      description: 'Zarządzanie treścią',
      color: 'emerald',
      adminOnly: true
    },
    { 
      href: '/dashboard/profile', 
      icon: User, 
      label: 'Mój Profil', 
      description: 'Ustawienia konta',
      color: 'rose'
    }
  ]
}

// 🎨 SYSTEM KOLORÓW - KONSYSTENTNY I DOSTĘPNY
const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    active: 'bg-blue-500',
    hover: 'hover:border-blue-300',
    icon: 'text-blue-600'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    active: 'bg-purple-500',
    hover: 'hover:border-purple-300',
    icon: 'text-purple-600'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    active: 'bg-amber-500',
    hover: 'hover:border-amber-300',
    icon: 'text-amber-600'
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    active: 'bg-cyan-500',
    hover: 'hover:border-cyan-300',
    icon: 'text-cyan-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    active: 'bg-indigo-500',
    hover: 'hover:border-indigo-300',
    icon: 'text-indigo-600'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    active: 'bg-orange-500',
    hover: 'hover:border-orange-300',
    icon: 'text-orange-600'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    active: 'bg-green-500',
    hover: 'hover:border-green-300',
    icon: 'text-green-600'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    active: 'bg-emerald-500',
    hover: 'hover:border-emerald-300',
    icon: 'text-emerald-600'
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    active: 'bg-rose-500',
    hover: 'hover:border-rose-300',
    icon: 'text-rose-600'
  }
}

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // 📱 INTELIGENTNE WYKRYWANIE EKRANU
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    
    checkMobile()
    handleScroll()
    
    window.addEventListener('resize', checkMobile, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 🎯 AUTOMATYCZNE ZAMYKANIE MENU
  useEffect(() => {
    setIsMenuOpen(false)
    setIsMoreMenuOpen(false)
  }, [pathname])

  // 🖱️ ZAMYKANIE PO KLIKNIĘCIU NA ZEWNĄTRZ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 🔐 OBSŁUGA WYLOGOWANIA
  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Błąd wylogowania:', error)
      router.push('/')
    }
  }

  // 🎯 SPRAWDZANIE AKTYWNEJ ŚCIEŻKI
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  // 🎨 POBERANIE KONFIGURACJI KOLORU
  const getColorConfig = (color: string) => {
    return COLOR_SCHEMES[color as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.blue
  }

  // 🎪 FILTROWANIE ELEMENTÓW NAWIGACJI
  const getFilteredNavigation = () => {
    const filteredSecondary = NAVIGATION_CONFIG.secondary.filter(item => 
      !item.adminOnly || (item.adminOnly && user?.role === 'admin')
    )
    
    const filteredTertiary = NAVIGATION_CONFIG.tertiary.filter(item => 
      !item.adminOnly || (item.adminOnly && user?.role === 'admin')
    )

    return {
      primary: NAVIGATION_CONFIG.primary,
      secondary: filteredSecondary,
      tertiary: filteredTertiary
    }
  }

  const { primary, secondary, tertiary } = getFilteredNavigation()

  // 🎪 RENDEROWANIE PRZYCISKU NAWIGACJI
  const NavButton = ({ item, compact = false, inMenu = false }: { 
    item: any; 
    compact?: boolean; 
    inMenu?: boolean 
  }) => {
    const config = getColorConfig(item.color)
    const isActive = isActiveRoute(item.href)
    const Icon = item.icon

    return (
      <Link 
        href={item.href}
        className={cn(
          "flex items-center transition-all duration-200 border group/nav-item relative",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          compact 
            ? cn(
                "px-3 py-2 rounded-lg text-sm min-w-[auto]",
                isActive
                  ? `${config.bg} ${config.border} ${config.text} shadow-sm`
                  : "bg-white/80 border-gray-100 text-gray-600 hover:border-gray-200"
              )
            : cn(
                "px-4 py-3 rounded-xl w-full",
                isActive
                  ? `${config.bg} ${config.border} ${config.text} shadow-sm`
                  : "bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-200"
              )
        )}
        onClick={() => {
          setIsMenuOpen(false)
          setIsMoreMenuOpen(false)
        }}
      >
        <Icon className={cn(
          "transition-transform duration-200 flex-shrink-0",
          compact ? "h-4 w-4" : "h-5 w-5",
          isActive ? `scale-110 ${config.icon}` : "text-gray-500 group-hover/nav-item:scale-110"
        )} />
        
        <div className={cn(
          "flex-1 min-w-0",
          compact ? "ml-2 hidden xl:block" : "ml-3"
        )}>
          <span className={cn(
            "font-medium block",
            compact ? "text-sm" : "text-base"
          )}>
            {item.label}
          </span>
          {!compact && (
            <span className="text-sm text-gray-500 mt-0.5 block">
              {item.description}
            </span>
          )}
        </div>

        {/* AKTYWNY WSKAŹNIK */}
        {isActive && compact && (
          <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 ${config.active} rounded-full`} />
        )}
        {isActive && !compact && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.active} ml-auto`} />
        )}
      </Link>
    )
  }

  return (
    <>
      <header 
        className={cn(
          "border-b bg-white/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300",
          isScrolled 
            ? "border-gray-100/80 shadow-sm" 
            : "border-transparent"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* 🎪 LOGO - OPTYMALNE DLA WSZYSTKICH EKRANÓW */}
            <Link 
              href={user ? "/dashboard" : "/"} 
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                  "bg-gradient-to-br from-gray-900 to-gray-800 group-hover:from-gray-800 group-hover:to-gray-700"
                )}>
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  Unfog-go
                </span>
                <span className="text-xs text-gray-500 leading-tight hidden sm:block">
                  Czysty umysł, lepsze życie
                </span>
              </div>
            </Link>

            {/* 🖥️ NAWIGACJA DESKTOP - INTELIGENTNA HIERARCHIA */}
            {!isMobile && (
              <nav className="flex items-center gap-2" ref={menuRef}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : user ? (
                  <>
                    {/* 🥇 PIERWSZY POZIOM - 4 NAJCZĘSTSZE */}
                    <div className="flex items-center gap-2">
                      {primary.map((item) => (
                        <NavButton key={item.href} item={item} compact />
                      ))}
                    </div>

                    {/* 🥈 DRUGI POZIOM - MENU "WIĘCEJ" */}
                    {secondary.length > 0 && (
                      <div className="relative" ref={moreMenuRef}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                          className={cn(
                            "px-3 py-2 rounded-lg border-gray-200 transition-all duration-200",
                            isMoreMenuOpen && "bg-gray-50 border-gray-300"
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {/* MENU ROZWIJANE */}
                        {isMoreMenuOpen && (
                          <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200 shadow-xl shadow-black/10 py-2 animate-in slide-in-from-top duration-200 z-50">
                            <div className="px-3 py-2 border-b border-gray-100">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Więcej funkcji
                              </span>
                            </div>
                            <div className="p-2 space-y-1">
                              {secondary.map((item) => (
                                <NavButton key={item.href} item={item} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 🥉 TRZECI POZIOM - KONTO I ADMIN */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-2">
                      {tertiary.map((item) => (
                        <NavButton key={item.href} item={item} compact />
                      ))}
                      
                      {/* WYLOGOWANIE */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleLogout}
                        className="rounded-lg border-gray-200 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  // 🚀 NAWIGACJA DLA NIEZALOGOWANYCH
                  <div className="flex items-center gap-3">
                    <Link href="/auth/login">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-lg border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        Zaloguj się
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button 
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Rozpocznij podróż
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            )}

            {/* 📱 PRZYCISK MENU MOBILE */}
            {isMobile && (
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    "border-gray-200 hover:border-gray-300",
                    isMenuOpen && "bg-gray-100 border-gray-300"
                  )}
                >
                  {isMenuOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 📱 MENU MOBILE - OPTYMALIZOWANE UX */}
        {isMobile && isMenuOpen && (
          <div 
            ref={menuRef}
            className="lg:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-gray-100 shadow-xl animate-in slide-in-from-top duration-200 max-h-[80vh] overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : user ? (
                <div className="space-y-3">
                  {/* SEKCJA GŁÓWNA */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                      Główne
                    </h3>
                    <div className="space-y-1">
                      {primary.map((item) => (
                        <NavButton key={item.href} item={item} inMenu />
                      ))}
                    </div>
                  </div>

                  {/* SEKCJA DODATKOWA */}
                  {secondary.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                        Więcej
                      </h3>
                      <div className="space-y-1">
                        {secondary.map((item) => (
                          <NavButton key={item.href} item={item} inMenu />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEKCJA KONTA */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                      Konto
                    </h3>
                    <div className="space-y-1">
                      {tertiary.map((item) => (
                        <NavButton key={item.href} item={item} inMenu />
                      ))}
                      
                      {/* WYLOGOWANIE */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          setTimeout(handleLogout, 150)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-600 hover:bg-red-50 transition-all duration-200 border border-transparent hover:border-red-200"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Wyloguj się</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // 🎪 MENU DLA NIEZALOGOWANYCH
                <div className="space-y-3">
                  <Link 
                    href="/auth/login"
                    className="flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 font-medium transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Zaloguj się
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 font-medium transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Rozpocznij podróż
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* OVERLAY DLA MENU MOBILE */}
      {isMobile && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}