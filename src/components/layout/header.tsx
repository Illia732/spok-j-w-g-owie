'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User, Sparkles, Menu, X, Home, BarChart3, Heart, MapPin, Users, BookOpen, Shield, FileText, Gamepad } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Konfiguracja 8 UNIKALNYCH kolorów dla każdej sekcji
const SECTION_CONFIG = {
  dashboard: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    activeDot: 'bg-blue-500',
    hover: 'hover:border-blue-300',
    iconColor: 'text-blue-600'
  },
  mood: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    activeDot: 'bg-purple-500',
    hover: 'hover:border-purple-300',
    iconColor: 'text-purple-600'
  },
  articles: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    activeDot: 'bg-amber-500',
    hover: 'hover:border-amber-300',
    iconColor: 'text-amber-600'
  },
  adminArticles: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    activeDot: 'bg-emerald-500',
    hover: 'hover:border-emerald-300',
    iconColor: 'text-emerald-600'
  },
  map: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    activeDot: 'bg-green-500',
    hover: 'hover:border-green-300',
    iconColor: 'text-green-600'
  },
  friends: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    activeDot: 'bg-orange-500',
    hover: 'hover:border-orange-300',
    iconColor: 'text-orange-600'
  },
  ai: {
    bg: 'bg-gradient-to-r from-indigo-50 to-purple-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    activeDot: 'bg-indigo-500',
    hover: 'hover:border-indigo-300',
    iconColor: 'text-indigo-600'
  },
  profile: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    activeDot: 'bg-rose-500',
    hover: 'hover:border-rose-300',
    iconColor: 'text-rose-600'
  },
  games: {
    bg: 'bg-gradient-to-r from-cyan-50 to-blue-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    activeDot: 'bg-cyan-500',
    hover: 'hover:border-cyan-300',
    iconColor: 'text-cyan-600'
  }
}

// Konfiguracja nawigacji
const NAV_ITEMS = [
  { 
    href: '/dashboard', 
    icon: Home, 
    label: 'Dashboard', 
    section: 'dashboard',
    description: 'Strona główna'
  },
  { 
    href: '/mood', 
    icon: BarChart3, 
    label: 'Nastrój', 
    section: 'mood',
    description: 'Dziennik nastroju'
  },
  { 
    href: '/games', 
    icon: Gamepad, 
    label: 'Gry', 
    section: 'games',
    description: 'Gry relaksacyjne'
  },
  { 
    href: '/articles', 
    icon: BookOpen, 
    label: 'Artykuły', 
    section: 'articles',
    description: 'Baza wiedzy'
  },
  { 
    href: '/admin/articles', 
    icon: FileText, 
    label: 'Artykuły Admina', 
    section: 'adminArticles',
    description: 'Zarządzanie artykułami',
    adminOnly: true
  },
  { 
    href: '/map', 
    icon: MapPin, 
    label: 'Lista Wsparcia', 
    section: 'map',
    description: 'Miejsca pomocy'
  },
  { 
    href: '/dashboard/friends', 
    icon: Users, 
    label: 'Przyjaciele', 
    section: 'friends',
    description: 'Twoje kontakty'
  },
  { 
    href: '/ai', 
    icon: Sparkles, 
    label: 'Pomoc AI', 
    section: 'ai',
    description: 'Wsparcie AI'
  },
  { 
    href: '/dashboard/profile', 
    icon: User, 
    label: 'Profil', 
    section: 'profile',
    description: 'Twoje konto'
  }
]

export default function Header({ onClick }: { onClick?: () => void }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sprawdz scroll i rozmiar ekranu
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    
    checkMobile()
    handleScroll()
    
    window.addEventListener('resize', checkMobile)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Zamknij menu po zmianie na desktop lub route
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname, isMobile])

  // Zamknij menu po kliknięciu na zewnątrz
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Błąd wylogowania:', error)
      router.push('/')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActiveRoute = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/')
  }

  const getSectionConfig = (section: string) => {
    return SECTION_CONFIG[section as keyof typeof SECTION_CONFIG] || SECTION_CONFIG.dashboard
  }

  // Filtrowanie elementów nawigacji
  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.adminOnly || (item.adminOnly && user?.role === 'admin')
  )

  return (
    <>
      <header 
        className={cn(
          "border-b bg-white/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-500 ease-out",
          isScrolled 
            ? "border-gray-100/80 shadow-sm shadow-black/5" 
            : "border-transparent"
        )}
        onClick={onClick}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo z micro-interactions */}
            <Link 
              href={user ? "/dashboard" : "/"} 
              className="flex items-center gap-3 group flex-shrink-0 relative"
            >
              {/* Animated logo container */}
              <div className="relative">
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-500 group-hover:shadow-md",
                  "bg-gradient-to-br from-gray-900 to-gray-800 group-hover:from-gray-800 group-hover:to-gray-700"
                )}>
                  {/* Animated logo icon */}
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-white to-white/80 rounded-lg transition-transform duration-300 group-hover:scale-110"/>
                  
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent"/>
                </div>
                
                {/* Hover pulse effect */}
                <div className="absolute inset-0 rounded-xl bg-gray-900/20 scale-0 group-hover:scale-100 transition-transform duration-500 opacity-0 group-hover:opacity-100"/>
              </div>
              
              {/* Text container */}
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-semibold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  Spokój w Głowie
                </span>
                <span className="text-xs text-gray-500 leading-tight hidden sm:block transition-opacity duration-300 group-hover:opacity-80">
                  Architektura Uważności
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2" ref={menuRef}>
              {loading ? (
                // Skeleton loading z lepszą animacją
                <div className="flex items-center gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-24 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              ) : user ? (
                <div className="flex items-center gap-2">
                  {filteredNavItems.map((item) => {
                    const config = getSectionConfig(item.section)
                    const isActive = isActiveRoute(item.href)
                    
                    return (
                      <div key={item.href} className="relative group">
                        <Link 
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 border",
                            "relative overflow-hidden group/nav-item",
                            isActive
                              ? `${config.bg} ${config.border} ${config.text} shadow-sm`
                              : "bg-white/80 border-gray-100 text-gray-700 hover:border-gray-200 hover:shadow-sm"
                          )}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            isActive ? `scale-110 ${config.iconColor}` : "text-gray-600 group-hover/nav-item:scale-110 group-hover/nav-item:text-gray-700"
                          )} />
                          <span className="text-sm font-medium">{item.label}</span>
                          
                          {/* Active indicator */}
                          {isActive && (
                            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 ${config.activeDot} rounded-full`} />
                          )}

                          {/* Hover gradient effect for AI section */}
                          {item.section === 'ai' && !isActive && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover/nav-item:opacity-100" />
                          )}
                        </Link>
                        
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg z-50">
                          {item.description}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                      </div>
                    )
                  })}

                  {/* User Menu z avatar */}
                  <div className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLogout}
                      className={cn(
                        "rounded-xl transition-all duration-300 relative overflow-hidden group",
                        "border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-sm"
                      )}
                    >
                      <LogOut className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110"/>
                      <span className="text-sm font-medium">Wyloguj</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/login">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-sm"
                    >
                      Zaloguj się
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button 
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      Rozpocznij podróż
                    </Button>
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button z lepszą animacją */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMenu}
                className={cn(
                  "p-2 rounded-xl transition-all duration-300 relative",
                  "hover:bg-gray-100 border border-transparent hover:border-gray-200",
                  isMenuOpen && "bg-gray-100 border-gray-200"
                )}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 transition-transform duration-300 rotate-90 scale-110" />
                ) : (
                  <Menu className="h-5 w-5 transition-transform duration-300" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Mobile Menu */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl shadow-black/10 animate-in slide-in-from-top duration-300"
          >
            <div className="container mx-auto px-4 py-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i}
                      className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              ) : user ? (
                <div className="space-y-2">
                  {filteredNavItems.map((item) => {
                    const config = getSectionConfig(item.section)
                    const isActive = isActiveRoute(item.href)
                    
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 w-full group",
                          "border-2 backdrop-blur-sm",
                          isActive
                            ? `${config.bg} ${config.border} ${config.text} shadow-sm`
                            : "bg-white/80 border-gray-100 text-gray-700 hover:border-gray-200 hover:shadow-sm"
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 transition-transform duration-300",
                          isActive ? `scale-110 ${config.iconColor}` : "text-gray-600 group-hover:scale-110 group-hover:text-gray-700"
                        )} />
                        <div className="flex-1">
                          <span className="text-base font-medium block">{item.label}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{item.description}</span>
                        </div>
                        
                        {/* Active dot */}
                        {isActive && (
                          <div className={`w-2 h-2 rounded-full ${config.activeDot}`} />
                        )}
                      </Link>
                    )
                  })}
                  
                  {/* Logout button */}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-4 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 transition-all duration-300 mt-4"
                    onClick={() => {
                      setIsMenuOpen(false)
                      setTimeout(handleLogout, 200)
                    }}
                  >
                    <LogOut className="h-5 w-5"/>
                    <span className="text-base font-medium">Wyloguj</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link 
                    href="/auth/login"
                    className={cn(
                      "flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-300 w-full",
                      "border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm font-medium"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Zaloguj się
                  </Link>
                  <Link 
                    href="/auth/register"
                    className={cn(
                      "flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-300 w-full",
                      "bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 shadow-sm hover:shadow-md font-medium"
                    )}
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

      {/* Premium Overlay dla mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}