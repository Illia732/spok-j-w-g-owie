// src/app/dashboard/page.tsx - UPROSZCZONA WERSJA
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, Zap, Brain, Award, 
  Heart, BarChart3, Plus, Edit3,
  Maximize2, Minimize2, Sparkles,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Proste importy - bez Firestore
import { useAuth } from '@/components/providers/auth-provider'

// Types
interface Widget {
  id: string
  type: WidgetType
  enabled: boolean
  size: 'small' | 'medium' | 'large'
  position: number
}

type WidgetType = 'mood-today' | 'trend' | 'streak' | 'ai-insights' | 'tools' | 'stats'

interface UserData {
  uid: string
  firstName: string
  lastName: string
  level: number
  xp: number
  streak: number
  currentMood?: number
  moodEntries: any[]
  createdAt: Date
}

// Demo Data - ZAMIast Firestore
const DEMO_USER_DATA: UserData = {
  uid: 'demo-user',
  firstName: 'Gość',
  lastName: 'Demo',
  level: 3,
  xp: 450,
  streak: 7,
  currentMood: 75,
  moodEntries: [
    { 
      id: '1',
      mood: 75, 
      timestamp: new Date(), 
      note: 'Dzień dobry! Cieszę się, że testujesz tę aplikację. To dane demonstracyjne pokazujące jak będzie wyglądał Twój dashboard.' 
    },
    { 
      id: '2',
      mood: 60, 
      timestamp: new Date(Date.now() - 86400000), 
      note: 'Spokojny dzień pracy' 
    },
    { 
      id: '3',
      mood: 80, 
      timestamp: new Date(Date.now() - 172800000), 
      note: 'Świetny nastrój po spotkaniu z przyjaciółmi!' 
    },
    { 
      id: '4',
      mood: 55, 
      timestamp: new Date(Date.now() - 259200000), 
      note: 'Trochę zmęczony, ale ogólnie ok' 
    },
    { 
      id: '5',
      mood: 90, 
      timestamp: new Date(Date.now() - 345600000), 
      note: 'Niesamowity dzień! Udało mi się zrealizować wszystkie cele.' 
    },
    { 
      id: '6',
      mood: 70, 
      timestamp: new Date(Date.now() - 432000000), 
      note: 'Stabilny dzień' 
    },
    { 
      id: '7',
      mood: 65, 
      timestamp: new Date(Date.now() - 518400000), 
      note: 'Poranny trening dodał mi energii' 
    },
  ],
  createdAt: new Date()
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: '1', type: 'mood-today', enabled: true, size: 'large', position: 0 },
  { id: '2', type: 'trend', enabled: true, size: 'large', position: 1 },
  { id: '3', type: 'streak', enabled: true, size: 'medium', position: 2 },
  { id: '4', type: 'ai-insights', enabled: true, size: 'medium', position: 3 },
  { id: '5', type: 'tools', enabled: true, size: 'small', position: 4 },
  { id: '6', type: 'stats', enabled: true, size: 'small', position: 5 },
]

const WIDGET_CONFIG = {
  'mood-today': { 
    name: 'Twój Nastrój', 
    icon: Heart, 
    description: 'Jak się dziś czujesz?',
    defaultSize: 'large' as const,
    gradient: 'from-pink-500 to-rose-500',
    color: 'text-pink-500'
  },
  'trend': { 
    name: 'Trend Nastroju', 
    icon: TrendingUp, 
    description: 'Twoja 7-dniowa podróż',
    defaultSize: 'large' as const,
    gradient: 'from-blue-500 to-cyan-500',
    color: 'text-blue-500'
  },
  'streak': { 
    name: 'Seria Dni', 
    icon: Award, 
    description: 'Buduj nawyk',
    defaultSize: 'medium' as const,
    gradient: 'from-amber-500 to-orange-500',
    color: 'text-amber-500'
  },
  'ai-insights': { 
    name: 'AI Insights', 
    icon: Brain, 
    description: 'Spersonalizowane wskazówki',
    defaultSize: 'medium' as const,
    gradient: 'from-purple-500 to-indigo-500',
    color: 'text-purple-500'
  },
  'tools': { 
    name: 'Szybkie Narzędzia', 
    icon: Zap, 
    description: 'Natychmiastowa ulga',
    defaultSize: 'small' as const,
    gradient: 'from-green-500 to-emerald-500',
    color: 'text-green-500'
  },
  'stats': { 
    name: 'Twoje Statystyki', 
    icon: BarChart3, 
    description: 'Postępy i wyniki',
    defaultSize: 'small' as const,
    gradient: 'from-slate-600 to-slate-700',
    color: 'text-slate-600'
  }
} as const

export default function PremiumDashboard() {
  const { user: authUser, loading } = useAuth()
  const [user, setUser] = useState<UserData | null>(null)
  const [moodEntries, setMoodEntries] = useState<any[]>([])
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS)
  const [todayEntry, setTodayEntry] = useState<any>(null)
  const [streakData, setStreakData] = useState({ 
    currentStreak: 0, 
    longestStreak: 0, 
    perfectMonth: false 
  })
  const [isMobile, setIsMobile] = useState(false)

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // PROSTE ŁADOWANIE DANYCH - BEZ FIRESTORE
  useEffect(() => {
    if (loading) return

    // Zawsze używaj danych demo dla testów
    const userData = DEMO_USER_DATA
    setUser(userData)
    setMoodEntries(userData.moodEntries)
    
    // Oblicz streak z danych demo
    const streak = calculateStreakFromEntries(userData.moodEntries)
    setStreakData(streak)
    
    // Znajdź dzisiejszy wpis
    const today = findTodayEntry(userData.moodEntries)
    setTodayEntry(today)

    console.log('✅ Dashboard loaded with demo data')
  }, [loading])

  // Memoized calculations
  const stats = useMemo(() => {
    if (!moodEntries.length) return { averageMood: 50, trend: 0, consistency: 75 }
    return calculateStats(moodEntries)
  }, [moodEntries])

  const enabledWidgets = useMemo(() => 
    widgets.filter(w => w.enabled).sort((a, b) => a.position - b.position),
    [widgets]
  )

  // Grid system
  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        columns: 2,
        large: "col-span-2 min-h-[300px]",
        medium: "col-span-2 min-h-[220px]", 
        small: "col-span-1 min-h-[180px]"
      }
    } else {
      return {
        columns: 4,
        large: "col-span-2 min-h-[360px]",
        medium: "col-span-1 min-h-[280px]",
        small: "col-span-1 min-h-[200px]"
      }
    }
  }, [isMobile])

  const getGridClass = useCallback((size: Widget['size']) => {
    return cn("transition-all duration-500", gridConfig[size])
  }, [gridConfig])

  const renderWidget = useCallback((widget: Widget) => {
    const props = { isMobile, className: "h-full" }
    
    switch (widget.type) {
      case 'mood-today':
        return <MoodTodayWidget {...props} todayEntry={todayEntry} />
      case 'trend':
        return <TrendWidget {...props} moodEntries={moodEntries} stats={stats} />
      case 'streak':
        return <StreakWidget {...props} streakData={streakData} />
      case 'ai-insights':
        return <AIInsightsWidget {...props} todayEntry={todayEntry} />
      case 'tools':
        return <ToolsWidget {...props} />
      case 'stats':
        return <StatsWidget {...props} user={user} stats={stats} moodEntries={moodEntries} />
      default:
        return <PlaceholderWidget {...props} />
    }
  }, [todayEntry, moodEntries, stats, streakData, user, isMobile])

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Demo Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-800">Tryb demonstracyjny 🚀</p>
              <p className="text-blue-700 text-sm">
                {authUser 
                  ? `Witaj ${authUser.displayName || authUser.email}! Oto podgląd Twojego przyszłego dashboardu.` 
                  : 'Przeglądasz demo aplikacji. Zaloguj się, aby zapisywać swoje dane.'
                }
              </p>
            </div>
            {!authUser && (
              <Link href="/auth/login">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Zaloguj się
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Witaj, {user?.firstName || 'Przyjacielu'}! 👋
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Jak dziś się miewasz? Pamiętaj o swoim codziennym wpisie.
              </p>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="hidden lg:flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Poziom {user?.level || 1}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Insights */}
        <QuickInsights stats={stats} streakData={streakData} moodEntries={moodEntries} isMobile={isMobile} />

        {/* Main Grid */}
        <motion.div
          layout
          className={cn(
            "grid gap-6 auto-rows-min w-full",
            isMobile ? "gap-4" : "gap-6"
          )}
          style={{ gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(0, 1fr))` }}
        >
          <AnimatePresence mode="popLayout">
            {enabledWidgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: 0,
                  transition: { 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }
                }}
                whileHover={{ y: -4 }}
                className={getGridClass(widget.size)}
              >
                {renderWidget(widget)}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

// 🔥 QUICK INSIGHTS - GENIALNE STATYSTYKI
function QuickInsights({ stats, streakData, moodEntries, isMobile }: any) {
  const insights = [
    {
      value: streakData.currentStreak,
      label: "Dni Streak",
      icon: "🔥",
      trend: streakData.currentStreak > 0 ? "positive" : "neutral",
      description: "Twoja codzienna seria"
    },
    {
      value: moodEntries.length,
      label: "Wpisów",
      icon: "📊",
      trend: "neutral",
      description: "Łączna liczba"
    },
    {
      value: `${stats.consistency}%`,
      label: "Konsystencja",
      icon: "🎯",
      trend: stats.consistency > 70 ? "positive" : "neutral",
      description: "Regularność wpisów"
    },
    ...(isMobile ? [] : [{
      value: `${stats.averageMood}%`,
      label: "Średni Nastrój",
      icon: "💖",
      trend: "positive",
      description: "Ostatnie 7 dni"
    }])
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn(
        "grid mb-8",
        isMobile ? "grid-cols-3 gap-3" : "grid-cols-4 gap-4"
      )}
    >
      {insights.map((insight, index) => (
        <motion.div
          key={insight.label}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60",
            "transition-all duration-300 hover:shadow-lg hover:border-slate-300"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{insight.icon}</span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              insight.trend === "positive" ? "bg-green-400" : "bg-blue-400"
            )} />
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-800">{insight.value}</div>
            <div className="text-sm font-semibold text-slate-600">{insight.label}</div>
            <div className="text-xs text-slate-500">{insight.description}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// 🔥 MOOD TODAY WIDGET - GENIALNY
function MoodTodayWidget({ todayEntry, isMobile, className }: any) {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false)
  
  const getMoodConfig = (mood: number) => {
    const configs = [
      { emoji: '😔', label: 'Bardzo niski', gradient: 'from-slate-400 to-slate-500', bg: 'bg-slate-100', color: 'text-slate-600' },
      { emoji: '😐', label: 'Niski', gradient: 'from-blue-400 to-blue-500', bg: 'bg-blue-100', color: 'text-blue-600' },
      { emoji: '🙂', label: 'Neutralny', gradient: 'from-green-400 to-green-500', bg: 'bg-green-100', color: 'text-green-600' },
      { emoji: '😊', label: 'Wysoki', gradient: 'from-purple-400 to-purple-500', bg: 'bg-purple-100', color: 'text-purple-600' },
      { emoji: '🤩', label: 'Bardzo wysoki', gradient: 'from-amber-400 to-amber-500', bg: 'bg-amber-100', color: 'text-amber-600' }
    ]
    return configs[Math.floor((mood - 1) / 20)] || configs[2]
  }

  const moodConfig = todayEntry ? getMoodConfig(todayEntry.mood) : getMoodConfig(50)

  return (
    <Card className={cn(
      className,
      "relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80",
      "hover:shadow-2xl transition-all duration-500"
    )}>
      {/* Animated Background */}
      <div className={cn(
        "absolute inset-0 opacity-[0.02]",
        `bg-gradient-to-br ${moodConfig.gradient}`
      )} />
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl shadow-lg",
              `bg-gradient-to-br ${moodConfig.gradient}`
            )}>
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">Twój Nastrój</div>
              <div className="text-sm text-slate-600">Jak się dziś czujesz?</div>
            </div>
          </div>
          
          {todayEntry?.note && !isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNoteExpanded(!isNoteExpanded)}
              className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100/50"
            >
              {isNoteExpanded ? (
                <Minimize2 className="h-4 w-4 text-slate-500" />
              ) : (
                <Maximize2 className="h-4 w-4 text-slate-500" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10">
        {todayEntry ? (
          <div className="space-y-6">
            {/* Mood Display */}
            <motion.div 
              className="text-center space-y-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.div
                className={cn(
                  "text-6xl mb-2 cursor-pointer",
                  isMobile ? "text-5xl" : "text-7xl"
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {moodConfig.emoji}
              </motion.div>
              
              <div className="space-y-2">
                <div className={cn(
                  "text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                  moodConfig.gradient,
                  isMobile ? "text-3xl" : "text-4xl"
                )}>
                  {todayEntry.mood}%
                </div>
                <div className={cn(
                  "text-lg font-semibold px-6 py-2 rounded-full inline-block border-2",
                  moodConfig.bg,
                  moodConfig.color,
                  "border-current/20"
                )}>
                  {moodConfig.label}
                </div>
              </div>
            </motion.div>

            {/* Note Section */}
            {todayEntry.note && (
              <motion.div 
                layout
                className={cn(
                  "rounded-xl border-2 transition-all duration-500 overflow-hidden",
                  "bg-white/50 backdrop-blur-sm",
                  isNoteExpanded ? "border-slate-300" : "border-slate-200",
                  !isMobile && "cursor-pointer hover:border-slate-300"
                )}
                onClick={() => !isMobile && setIsNoteExpanded(!isNoteExpanded)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Edit3 className="h-4 w-4 text-slate-600" />
                    <span className="font-semibold text-slate-700">Twoja notatka</span>
                    {!isMobile && (
                      <span className="text-xs text-slate-500 ml-auto">
                        {isNoteExpanded ? 'Kliknij aby zwinąć' : 'Kliknij aby rozwinąć'}
                      </span>
                    )}
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ 
                      maxHeight: isNoteExpanded ? 200 : (isMobile ? 60 : 80),
                      opacity: isNoteExpanded ? 1 : 0.8
                    }}
                    className="text-slate-600 leading-relaxed overflow-y-auto transition-all duration-500"
                  >
                    {todayEntry.note}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-2")}>
              <Link href="/mood" className="block">
                <Button 
                  variant="outline"
                  className={cn(
                    "w-full h-12 rounded-xl border-2 border-slate-300 bg-white/80",
                    "hover:bg-white hover:border-slate-400 hover:shadow-lg transition-all duration-300"
                  )}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edytuj Wpis
                </Button>
              </Link>
              <Link href="/ai" className="block">
                <Button 
                  className={cn(
                    "w-full h-12 rounded-xl text-white shadow-lg",
                    `bg-gradient-to-r ${moodConfig.gradient}`,
                    "hover:shadow-xl hover:scale-105 transition-all duration-300"
                  )}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Analiza AI
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div 
            className="text-center py-8 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📊
            </motion.div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-800">Brak dzisiejszego wpisu</h3>
              <p className="text-slate-600 text-lg">
                Zacznij swoją podróż do lepszego samopoczucia
              </p>
            </div>
            
            <Link href="/mood" className="block">
              <Button 
                className={cn(
                  "w-full h-14 rounded-xl text-white shadow-xl text-lg font-semibold",
                  "bg-gradient-to-r from-blue-500 to-purple-500",
                  "hover:shadow-2xl hover:scale-105 transition-all duration-300"
                )}
              >
                <Plus className="mr-3 h-5 w-5" />
                Dodaj Pierwszy Wpis
              </Button>
            </Link>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// 🔥 TREND WIDGET - GENIALNY (Z PROSTYM WYKRESEM)
function TrendWidget({ moodEntries, stats, isMobile, className }: any) {
  // Simple chart data calculation
  const chartData = useMemo(() => {
    const days = ['N', 'P', 'W', 'Ś', 'C', 'P', 'S']
    return days.map((day, index) => {
      const mood = moodEntries[index]?.mood || Math.floor(Math.random() * 30) + 60
      return { day, mood }
    })
  }, [moodEntries])

  return (
    <Card className={cn(
      className,
      "relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80",
      "hover:shadow-2xl transition-all duration-500"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">Trend Nastroju</div>
            <div className="text-sm text-slate-600">Twoja 7-dniowa podróż</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Simple Chart */}
        <div className={cn("w-full", isMobile ? "h-32" : "h-40")}>
          <div className="w-full h-full flex items-end justify-between px-2 gap-1">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div className="text-xs text-slate-500 font-medium">{data.day}</div>
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{ height: `${data.mood}%` }}
                />
                <div className="text-xs text-slate-600 font-semibold">
                  {data.mood}%
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: `${stats.trend > 0 ? '+' : ''}${stats.trend}%`, label: 'Trend', color: 'text-blue-500' },
            { value: `${stats.averageMood}%`, label: 'Średnia', color: 'text-purple-500' },
            { value: moodEntries.length, label: 'Wpisy', color: 'text-green-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              className="text-center p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/60"
            >
              <div className={cn("text-xl font-black", stat.color)}>{stat.value}</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Insight */}
        <motion.div 
          className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-blue-700">Analiza Trendu</span>
          </div>
          <p className="text-blue-600 text-sm leading-relaxed">
            {stats.trend > 5 
              ? "🎉 Twój nastrój wyraźnie się poprawia! Kontynuuj swoje dobre praktyki!" 
              : stats.trend < -5 
              ? "💭 Zauważyliśmy spadek w Twoim nastroju. Może to dobry moment na relaks?" 
              : "✨ Twój nastrój utrzymuje stabilny poziom. To świetny znak równowagi!"}
          </p>
        </motion.div>

        <Link href="/analytics">
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-slate-300 bg-white/80 hover:bg-white hover:border-slate-400 hover:shadow-lg transition-all duration-300"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Pełna Analiza
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// 🔥 STREAK WIDGET - GENIALNY
function StreakWidget({ streakData, isMobile, className }: any) {
  const progress = Math.min((streakData.currentStreak / 30) * 100, 100)
  
  return (
    <Card className={cn(
      className,
      "relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80",
      "hover:shadow-2xl transition-all duration-500"
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl shadow-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">Seria Dni</div>
            <div className="text-sm text-slate-600">Buduj swój nawyk</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        {/* Main Streak Display */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <motion.div
            className="text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"
            animate={{ 
              scale: [1, 1.1, 1],
              transition: { duration: 2, repeat: Infinity }
            }}
          >
            {streakData.currentStreak}
          </motion.div>
          <div className="text-lg font-semibold text-slate-700">dni z rzędu</div>
        </motion.div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>Twój cel: 30 dni</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-black text-amber-600">{streakData.longestStreak}</div>
            <div className="text-xs font-semibold text-amber-700">Rekord</div>
          </motion.div>
          <motion.div 
            className="text-center p-3 rounded-xl bg-slate-100 border border-slate-200"
            whileHover={{ scale: 1.05 }}
          >
            <div className={cn(
              "text-2xl font-black",
              streakData.perfectMonth ? 'text-green-500' : 'text-slate-400'
            )}>
              {streakData.perfectMonth ? '✓' : '−'}
            </div>
            <div className="text-xs font-semibold text-slate-600">Miesiąc</div>
          </motion.div>
        </div>

        <Link href="/mood">
          <Button 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Kontynuuj Serię
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// 🔥 AI INSIGHTS WIDGET - GENIALNY
function AIInsightsWidget({ todayEntry, isMobile, className }: any) {
  return (
    <Card className={cn(
      className,
      "relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80",
      "hover:shadow-2xl transition-all duration-500"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl shadow-lg bg-gradient-to-br from-purple-500 to-indigo-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">AI Insights</div>
            <div className="text-sm text-slate-600">Spersonalizowane wskazówki</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <motion.div 
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ 
              scale: [1, 1.2, 1],
              transition: { duration: 3, repeat: Infinity }
            }}
          >
            🧠
          </motion.div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Inteligentne Wsparcie</h3>
          <p className="text-slate-600 leading-relaxed">
            Nasza AI analizuje Twój nastrój i dostarcza spersonalizowane wskazówki 
            dla lepszego samopoczucia.
          </p>
        </motion.div>

        <Link href="/ai">
          <Button 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Otwórz Asystenta AI
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// 🔥 TOOLS WIDGET - GENIALNY
function ToolsWidget({ isMobile, className }: any) {
  const tools = [
    { icon: "🧘", label: "Oddech", description: "4-7-8 Technika", url: '/meditation?type=breathing', color: 'from-green-500 to-emerald-500' },
    { icon: "📝", label: "Notatnik", description: "Myśli", url: '/journal', color: 'from-blue-500 to-cyan-500' },
    { icon: "🎵", label: "Dźwięki", description: "Relaks", url: '/sounds', color: 'from-purple-500 to-pink-500' },
    { icon: "💭", label: "Medytacja", description: "5 minut", url: '/meditation', color: 'from-orange-500 to-red-500' },
  ]

  return (
    <Card className={cn(
      className,
      "relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80",
      "hover:shadow-2xl transition-all duration-500"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">Szybkie Narzędzia</div>
            <div className="text-sm text-slate-600">Natychmiastowa ulga</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-2")}>
          {tools.map((tool, index) => (
            <motion.button
              key={tool.label}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = tool.url}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200/60",
                "bg-white/80 backdrop-blur-sm hover:border-slate-300 hover:shadow-lg transition-all duration-300"
              )}
            >
              <div className={cn(
                "text-2xl mb-2 p-2 rounded-lg bg-gradient-to-br",
                tool.color
              )}>
                {tool.icon}
              </div>
              <div className="font-semibold text-slate-800 text-sm mb-1">{tool.label}</div>
              <div className="text-xs text-slate-600">{tool.description}</div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 🔥 STATS WIDGET - GENIALNY
function StatsWidget({ user, stats, moodEntries, isMobile, className }: any) {
  const statItems = [
    { label: "Poziom", value: user?.level || 1, icon: "⭐", color: "text-amber-500" },
    { label: "XP", value: user?.xp || 0, icon: "⚡", color: "text-yellow-500" },
    { label: "Wpisy", value: moodEntries.length, icon: "📊", color: "text-blue-500" },
    { label: "Konsystencja", value: `${stats.consistency}%`, icon: "🎯", color: "text-green-500" },
  ]

  return (
    <Card className={cn(
      className,
      "relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80",
      "hover:shadow-2xl transition-all duration-500"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl shadow-lg bg-gradient-to-br from-slate-600 to-slate-700">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">Twoje Statystyki</div>
            <div className="text-sm text-slate-600">Postępy i wyniki</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/60 hover:bg-white/80 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className={cn("font-black text-lg", item.color)}>
                {item.value}
              </span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 🔥 PLACEHOLDER WIDGET
function PlaceholderWidget({ className }: any) {
  return (
    <Card className={cn(className, "border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80")}>
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-2">🎨</div>
          <div className="font-semibold">Wkrótce więcej!</div>
        </div>
      </CardContent>
    </Card>
  )
}

// 🔥 LOADING SCREEN - GENIALNY
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <div className="text-center space-y-6">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-2xl"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Przygotowujemy Twój Dashboard
          </h2>
          <p className="text-slate-600 text-lg">
            Tworzymy spersonalizowane doświadczenie...
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function calculateStats(entries: any[]) {
  if (!entries.length) return { averageMood: 50, trend: 0, consistency: 75 }
  
  const last7Days = entries.slice(0, 7)
  const averageMood = Math.round(last7Days.reduce((sum, entry) => sum + entry.mood, 0) / last7Days.length)
  
  let trend = 0
  if (entries.length >= 2) {
    trend = entries[0].mood - entries[1].mood
  }
  
  const consistency = Math.max(0, 100 - Math.round(Math.random() * 30))
  
  return { averageMood, trend, consistency }
}

function findTodayEntry(entries: any[]) {
  if (!entries || !Array.isArray(entries)) return null
  
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  
  return entries.find((entry) => {
    if (!entry || !entry.timestamp) return false
    
    try {
      const entryDate = new Date(entry.timestamp)
      if (isNaN(entryDate.getTime())) return false
      
      const entryDateString = entryDate.toISOString().split('T')[0]
      return entryDateString === todayString
    } catch (error) {
      return false
    }
  })
}

function calculateStreakFromEntries(entries: any[]) {
  if (!entries.length) return { currentStreak: 0, longestStreak: 0, perfectMonth: false }
  
  // Simple streak calculation for demo
  let currentStreak = 0
  const today = new Date()
  
  for (let i = 0; i < entries.length; i++) {
    const entryDate = new Date(entries[i].timestamp)
    const diffTime = today.getTime() - entryDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === i) {
      currentStreak++
    } else {
      break
    }
  }
  
  return {
    currentStreak: Math.max(currentStreak, 7), // Demo shows 7 days streak
    longestStreak: 12, // Demo value
    perfectMonth: currentStreak >= 30
  }
}