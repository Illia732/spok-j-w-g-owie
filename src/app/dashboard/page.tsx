'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Heart, TrendingUp, Users, Brain, Gamepad2, BookOpen, 
  MapPin, Calendar, Wind, Palette, Zap, Award,
  Flame, Target, Activity, Loader2, Crown, Sparkles,
  TrendingDown, Minus, Trophy, Star, Gift, CheckCircle,
  Lightbulb, BarChart3, Timer, Smile, Frown, Meh,
  ArrowRight, History as HistoryIcon, TrendingUp as TrendingUpIcon
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { StatsService } from '@/lib/stats-service'
import { XPService } from '@/lib/xp-service'
import Link from 'next/link'

interface MoodEntry {
  timestamp: Date
  mood: number
  note?: string
  date?: string
}

interface UserProfile {
  uid: string
  displayName: string
  email: string
  firstName: string
  lastName: string
  bio: string
  streak: number
  level: number
  xp: number
  currentMood: number
  currentMask: string
  moodEntries: MoodEntry[]
  friends: string[]
  unlockedMasks: string[]
  role: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  unlocked: boolean
  progress: number
  maxProgress: number
}

export default function PremiumDashboard() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [xpStats, setXpStats] = useState<any>(null)

  const convertMoodEntries = (entries: any[]): MoodEntry[] => {
    if (!Array.isArray(entries)) return []
    
    return entries.map(entry => ({
      timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.date || entry.timestamp),
      mood: entry.mood || 50,
      note: entry.note || undefined,
      date: entry.date
    }))
  }

  const stats = user 
    ? StatsService.calculateAllStats(convertMoodEntries(user.moodEntries || []))
    : StatsService.calculateAllStats([])

  const achievements: Achievement[] = [
    {
      id: 'first_entry',
      title: 'Pierwszy Krok',
      description: 'Dodaj pierwszy wpis nastroju',
      icon: Star,
      unlocked: stats.totalEntries >= 1,
      progress: Math.min(stats.totalEntries, 1),
      maxProgress: 1
    },
    {
      id: 'week_streak',
      title: 'Tygodniowa Passa',
      description: '7 dni z rzędu',
      icon: Flame,
      unlocked: stats.currentStreak >= 7,
      progress: Math.min(stats.currentStreak, 7),
      maxProgress: 7
    },
    {
      id: 'month_streak',
      title: 'Miesiąc Mocy',
      description: '30 dni z rzędu',
      icon: Trophy,
      unlocked: stats.currentStreak >= 30,
      progress: Math.min(stats.currentStreak, 30),
      maxProgress: 30
    },
    {
      id: 'hundred_entries',
      title: 'Setka!',
      description: '100 wpisów',
      icon: Target,
      unlocked: stats.totalEntries >= 100,
      progress: Math.min(stats.totalEntries, 100),
      maxProgress: 100
    }
  ]

  const motivationalQuotes = [
    { text: "Każdy dzień to nowa szansa na lepsze jutro", emoji: "🌅" },
    { text: "Twoje zdrowie psychiczne jest priorytetem", emoji: "💚" },
    { text: "Małe kroki prowadzą do wielkich zmian", emoji: "🚶" },
    { text: "Jesteś silniejszy niż myślisz", emoji: "💪" },
    { text: "Dziś jest dobry dzień, żeby być dobrym dla siebie", emoji: "✨" },
    { text: "Postęp to postęp, bez względu na tempo", emoji: "🎯" },
    { text: "Pamiętaj - nie jesteś sam w tej podróży", emoji: "🤝" }
  ]

  const [dailyQuote] = useState(() => {
    const today = new Date().getDate()
    return motivationalQuotes[today % motivationalQuotes.length]
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false)
        setUser(null)
        setAuthUser(null)
        return
      }

      setAuthUser(firebaseUser)

      try {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          
          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: userData?.displayName || '',
            email: userData?.email || firebaseUser.email || '',
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            bio: userData?.bio || '',
            streak: userData?.streak || 0,
            level: userData?.level || 1,
            xp: userData?.xp || 0,
            currentMood: userData?.currentMood || 50,
            currentMask: userData?.currentMask || 'calm',
            moodEntries: Array.isArray(userData?.moodEntries) ? userData.moodEntries : [],
            friends: Array.isArray(userData?.friends) ? userData.friends : [],
            unlockedMasks: Array.isArray(userData?.unlockedMasks) ? userData.unlockedMasks : [],
            role: userData?.role || 'user'
          }
          
          setUser(userProfile)

          // 📊 POBIERZ STATYSTYKI XP
          const xpData = await XPService.getXPStats(firebaseUser.uid)
          setXpStats(xpData)

          const lastReward = localStorage.getItem(`lastReward_${firebaseUser.uid}`)
          const today = new Date().toDateString()
          if (lastReward !== today && stats.hasTodayEntry) {
            setShowReward(true)
            localStorage.setItem(`lastReward_${firebaseUser.uid}`, today)
          }
        }
        
      } catch (error) {
        console.error('❌ Błąd pobierania danych użytkownika:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-lg opacity-30" />
            <div className="relative w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ładowanie dashboard...</h2>
          <p className="text-gray-600">Przygotowujemy Twoją przestrzeń</p>
        </div>
      </div>
    )
  }

  const DemoBanner = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-lg"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-900">Tryb Demo</p>
          <p className="text-sm text-amber-700">Zaloguj się, aby zapisać swoje postępy</p>
        </div>
      </div>
    </motion.div>
  )

  const DashboardHeader = () => {
    const levelInfo = user ? XPService.getLevelInfo(user.xp) : XPService.getLevelInfo(0)

    return (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl p-6 lg:p-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-md opacity-60" />
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold border-3 border-white shadow-xl">
                {levelInfo.currentLevel}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Witaj, {user?.firstName || 'Gość'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Wspaniale, że tu jesteś. Jak się dziś czujesz?</p>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-gray-900">Poziom {levelInfo.currentLevel}</span>
                  </div>
                  <Link href="/dashboard/xp-history">
                    <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      Historia XP
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
                <div className="relative">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelInfo.xpProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600 font-medium">{levelInfo.currentXP} XP</span>
                    <span className="text-xs text-gray-500">{levelInfo.xpToNextLevel} XP do poziomu {levelInfo.currentLevel + 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const MotivationalQuote = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/60 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-bold text-gray-900">Myśl Dnia</h3>
        </div>
        <p className="text-lg text-gray-700 italic">
          "{dailyQuote.text}" <span className="text-2xl">{dailyQuote.emoji}</span>
        </p>
      </div>
    </motion.div>
  )

  const XPStatsSection = () => {
    if (!xpStats) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <TrendingUpIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Twoje XP</h2>
              <p className="text-sm text-gray-600">Śledź swój postęp</p>
            </div>
          </div>
          <Link href="/dashboard/xp-history">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg text-sm font-medium">
              <HistoryIcon className="h-4 w-4" />
              Pełna historia
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/60 p-5 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-blue-700 font-medium">Łączne XP</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{xpStats.totalXP}</p>
            <p className="text-xs text-blue-600 mt-1">Poziom {xpStats.level}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/60 p-5 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-green-700 font-medium">Ten tydzień</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{xpStats.xpThisWeek}</p>
            <p className="text-xs text-green-600 mt-1">+{xpStats.xpThisWeek} XP</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200/60 p-5 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-purple-700 font-medium">Ten miesiąc</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{xpStats.xpThisMonth}</p>
            <p className="text-xs text-purple-600 mt-1">+{xpStats.xpThisMonth} XP</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 p-5 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-amber-700 font-medium">Top źródło</span>
            </div>
            <p className="text-sm font-bold text-amber-900 line-clamp-2">
              {xpStats.topSource ? XPService.getSourceDescription(xpStats.topSource) : 'Brak danych'}
            </p>
            <p className="text-xs text-amber-600 mt-1">Najczęstsze</p>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const QuickInsights = () => {
    const getTrendIcon = () => {
      switch (stats.moodTrend) {
        case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
        case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
        default: return <Minus className="h-4 w-4 text-gray-600" />
      }
    }

    const getTrendColor = () => {
      switch (stats.moodTrend) {
        case 'up': return 'text-green-600'
        case 'down': return 'text-red-600'
        default: return 'text-gray-600'
      }
    }

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
          >
            {stats.currentStreak > 0 && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-2xl" />
            )}
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Passa</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 relative z-10">{stats.currentStreak}</p>
            <div className="flex items-center gap-2 mt-1 relative z-10">
              <p className="text-xs text-gray-500">dni z rzędu</p>
              <div className="flex-1 border-t border-gray-200" />
              <Trophy className="h-3 w-3 text-amber-500" />
              <p className="text-xs text-amber-600 font-medium">{stats.longestStreak}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Średni nastrój</span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-gray-900">{stats.averageMood}</p>
              {stats.averageMood >= 70 && <Smile className="h-6 w-6 text-green-500" />}
              {stats.averageMood >= 40 && stats.averageMood < 70 && <Meh className="h-6 w-6 text-yellow-500" />}
              {stats.averageMood < 40 && <Frown className="h-6 w-6 text-red-500" />}
            </div>
            <p className={`text-xs mt-1 font-medium ${getTrendColor()}`}>
              {stats.moodTrend === 'up' && '↗ Poprawia się'}
              {stats.moodTrend === 'down' && '↘ Wymaga uwagi'}
              {stats.moodTrend === 'stable' && '→ Stabilny'}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Konsystencja</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.consistency}%</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.consistency}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.last30DaysEntries} z 30 dni</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Wpisy</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEntries}</p>
            <div className="flex items-center gap-2 mt-1">
              {stats.hasTodayEntry ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-green-600 font-medium">Dodano dzisiaj</p>
                </>
              ) : (
                <>
                  <Timer className="h-4 w-4 text-orange-500" />
                  <p className="text-xs text-orange-600 font-medium">Dodaj wpis dziś!</p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const AchievementsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Osiągnięcia</h2>
          <p className="text-sm text-gray-600">
            {achievements.filter(a => a.unlocked).length} z {achievements.length} odblokowanych
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className={`p-4 rounded-2xl border-2 transition-all ${
              achievement.unlocked
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-lg'
                : 'bg-white/50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                  : 'bg-gray-300'
              }`}>
                <achievement.icon className={`h-5 w-5 ${
                  achievement.unlocked ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <h3 className={`font-bold ${
                achievement.unlocked ? 'text-amber-900' : 'text-gray-500'
              }`}>
                {achievement.title}
              </h3>
            </div>
            <p className={`text-sm mb-2 ${
              achievement.unlocked ? 'text-amber-700' : 'text-gray-500'
            }`}>
              {achievement.description}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                className={`h-full rounded-full ${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gray-400'
                }`}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {achievement.progress}/{achievement.maxProgress}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )

  const DailyRewardModal = () => (
    <AnimatePresence>
      {showReward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowReward(false)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="inline-block mb-4"
              >
                <Gift className="h-20 w-20 text-purple-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Dzienna Nagroda! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                Otrzymujesz +10 XP za dzisiejszy wpis!
              </p>
              <button
                onClick={() => setShowReward(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Odbierz nagrodę!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const quickAccessItems = [
    { icon: Heart, label: 'Nastrój', description: 'Dodaj wpis nastroju', href: '/mood', gradient: 'from-pink-500 to-rose-500', color: 'text-pink-600' },
    { icon: TrendingUp, label: 'Analiza', description: 'Zobacz trendy nastroju', href: '/mood/history', gradient: 'from-blue-500 to-cyan-500', color: 'text-blue-600' },
    { icon: Brain, label: 'AI Asystent', description: 'Porozmawiaj z AI', href: '/ai', gradient: 'from-purple-500 to-indigo-500', color: 'text-purple-600' },
    { icon: Gamepad2, label: 'Gry Relaksacyjne', description: 'Ćwiczenia oddechowe', href: '/games', gradient: 'from-green-500 to-emerald-500', color: 'text-green-600' },
    { icon: Wind, label: 'Oddychanie', description: 'Technika 4-7-8', href: '/games/breathing', gradient: 'from-cyan-500 to-blue-500', color: 'text-cyan-600' },
    { icon: Palette, label: 'Harmonia Kolorów', description: 'Dopasuj kolory', href: '/games/colors', gradient: 'from-pink-500 to-purple-500', color: 'text-pink-600' },
    { icon: Users, label: 'Znajomi', description: 'Twoja społeczność', href: '/dashboard/friends', gradient: 'from-indigo-500 to-purple-500', color: 'text-indigo-600' },
    { icon: BookOpen, label: 'Artykuły', description: 'Baza wiedzy', href: '/articles', gradient: 'from-amber-500 to-orange-500', color: 'text-amber-600' },
    { icon: MapPin, label: 'Mapa Wsparcia', description: 'Miejsca pomocy', href: '/map', gradient: 'from-emerald-500 to-green-500', color: 'text-emerald-600' },
    { icon: Calendar, label: 'Kalendarz', description: 'Historia nastrojów', href: '/mood/history', gradient: 'from-blue-500 to-indigo-500', color: 'text-blue-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {!authUser && <DemoBanner />}
        <DashboardHeader />
        <MotivationalQuote />
        <XPStatsSection />
        <QuickInsights />
        <AchievementsSection />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Szybki Dostęp</h2>
              <p className="text-sm text-gray-600">Wszystkie funkcje w jednym miejscu</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {quickAccessItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5 transition-all duration-300 hover:shadow-xl hover:border-gray-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className={`relative mb-3 p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>

                <div className="relative space-y-1">
                  <h3 className={`font-bold text-gray-900 text-sm line-clamp-1 ${item.color} group-hover:scale-105 transition-transform`}>
                    {item.label}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gray-300/50 transition-colors duration-300" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        <DailyRewardModal />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
