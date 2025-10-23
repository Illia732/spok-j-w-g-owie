'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  ArrowLeft, TrendingUp, Calendar, Zap, Star, Trophy,
  Flame, Heart, Gamepad2, BookOpen, Users, Target,
  Crown, Sparkles, BarChart3, Award, Loader2,
  ChevronDown, ChevronUp, Filter, Download, Link as LinkIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { XPService, XPSource } from '@/lib/xp-service'
import Link from 'next/link'

interface XPTransaction {
  userId: string
  amount: number
  source: XPSource
  timestamp: any
  description: string
}

const sourceIcons: Record<XPSource, any> = {
  [XPSource.MOOD_ENTRY]: Heart,
  [XPSource.FIRST_MOOD]: Sparkles,
  [XPSource.BREATHING_EXERCISE]: Gamepad2,
  [XPSource.COLOR_HARMONY]: Award,
  [XPSource.COLOR_HARMONY_ZEN]: Award,
  [XPSource.COLOR_HARMONY_CHILL]: Award,
  [XPSource.COLOR_HARMONY_FLOW]: Award,
  [XPSource.ARTICLE_READ]: BookOpen,
  [XPSource.FRIEND_ADDED]: Users,
  [XPSource.FRIEND_INVITED]: Users,
  [XPSource.DAILY_LOGIN]: Calendar,
  [XPSource.STREAK_7_DAYS]: Flame,
  [XPSource.STREAK_30_DAYS]: Trophy,
  [XPSource.FRIEND_VIA_LINK]: LinkIcon,
  [XPSource.FRIEND_EXISTING_VIA_LINK]: LinkIcon, // Dodane
  [XPSource.LEVEL_UP]: Crown,
}

const sourceColors: Record<XPSource, string> = {
  [XPSource.MOOD_ENTRY]: 'from-pink-500 to-rose-500',
  [XPSource.FIRST_MOOD]: 'from-purple-500 to-pink-500',
  [XPSource.BREATHING_EXERCISE]: 'from-cyan-500 to-blue-500',
  [XPSource.COLOR_HARMONY]: 'from-amber-500 to-orange-500',
  [XPSource.COLOR_HARMONY_ZEN]: 'from-green-500 to-emerald-500',
  [XPSource.COLOR_HARMONY_CHILL]: 'from-blue-500 to-cyan-500',
  [XPSource.COLOR_HARMONY_FLOW]: 'from-purple-500 to-pink-500',
  [XPSource.ARTICLE_READ]: 'from-amber-500 to-yellow-500',
  [XPSource.FRIEND_ADDED]: 'from-indigo-500 to-purple-500',
  [XPSource.FRIEND_INVITED]: 'from-green-500 to-emerald-500',
  [XPSource.DAILY_LOGIN]: 'from-blue-500 to-indigo-500',
  [XPSource.STREAK_7_DAYS]: 'from-orange-500 to-red-500',
  [XPSource.STREAK_30_DAYS]: 'from-amber-500 to-orange-500',
  [XPSource.FRIEND_VIA_LINK]: 'Znajomy przez link (nowy)',
  [XPSource.FRIEND_EXISTING_VIA_LINK]: 'Znajomy przez link', // Dodane
  [XPSource.LEVEL_UP]: 'from-yellow-500 to-amber-500',
}

export default function XPHistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<XPTransaction[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/auth/login')
        return
      }

      setUser(firebaseUser)

      try {
        // Pobierz historię XP
        const xpHistory = await XPService.getXPHistory(firebaseUser.uid, 100)
        setHistory(xpHistory)

        // Pobierz statystyki
        const xpStats = await XPService.getXPStats(firebaseUser.uid)
        setStats(xpStats)
      } catch (error) {
        console.error('❌ Błąd pobierania historii XP:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const filteredHistory = history.filter(tx => {
    const txDate = tx.timestamp.toDate()
    const now = new Date()

    switch (filter) {
      case 'today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return txDate >= today
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return txDate >= weekAgo
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return txDate >= monthAgo
      default:
        return true
    }
  }).sort((a, b) => {
    const aTime = a.timestamp.toDate().getTime()
    const bTime = b.timestamp.toDate().getTime()
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
  })

  const groupedByDate = filteredHistory.reduce((acc, tx) => {
    const date = tx.timestamp.toDate().toLocaleDateString('pl-PL')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(tx)
    return acc
  }, {} as Record<string, XPTransaction[]>)

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
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ładowanie historii XP...</h2>
          <p className="text-gray-600">Przygotowujemy Twoje osiągnięcia</p>
        </div>
      </div>
    )
  }

  const levelInfo = stats ? XPService.getLevelInfo(stats.totalXP) : XPService.getLevelInfo(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      {/* Floating Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 animate-float" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Wróć do Dashboard</span>
            </button>
          </Link>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-2xl p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Avatar + Level */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-md opacity-60" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                  <Crown className="h-10 w-10" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold border-4 border-white shadow-xl">
                  {levelInfo.currentLevel}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Historia XP
                </h1>
                <p className="text-gray-600 mb-4">
                  Szczegółowa historia zdobytych punktów doświadczenia
                </p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">Poziom {levelInfo.currentLevel}</span>
                    <span className="text-sm text-gray-600">{levelInfo.currentXP}/{levelInfo.xpToNextLevel} XP</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelInfo.xpProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatsCard
            icon={Zap}
            label="Łączne XP"
            value={stats?.totalXP || 0}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatsCard
            icon={Calendar}
            label="Ten tydzień"
            value={stats?.xpThisWeek || 0}
            gradient="from-green-500 to-emerald-500"
            suffix=" XP"
          />
          <StatsCard
            icon={BarChart3}
            label="Ten miesiąc"
            value={stats?.xpThisMonth || 0}
            gradient="from-purple-500 to-pink-500"
            suffix=" XP"
          />
          <StatsCard
            icon={Trophy}
            label="Transakcji"
            value={history.length}
            gradient="from-amber-500 to-orange-500"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-gray-600" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'today'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Dzisiaj
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'week'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tydzień
              </button>
              <button
                onClick={() => setFilter('month')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'month'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Miesiąc
              </button>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-600 transition-all"
            >
              {sortOrder === 'desc' ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Najnowsze
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Najstarsze
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg p-12 text-center">
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Brak historii XP</h3>
              <p className="text-gray-600">Zacznij zdobywać punkty doświadczenia!</p>
            </div>
          ) : (
            Object.keys(groupedByDate).map((date, index) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">{date}</h2>
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-sm font-medium text-gray-600">
                    +{groupedByDate[date].reduce((sum, tx) => sum + tx.amount, 0)} XP
                  </span>
                </div>

                <div className="space-y-3">
                  {groupedByDate[date].map((tx, txIndex) => (
                    <TransactionCard key={txIndex} transaction={tx} />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

function StatsCard({ icon: Icon, label, value, gradient, suffix = '' }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg p-5 hover:shadow-xl transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 bg-gradient-to-br ${gradient} rounded-xl`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}{suffix}</p>
    </motion.div>
  )
}

function TransactionCard({ transaction }: { transaction: XPTransaction }) {
  const Icon = sourceIcons[transaction.source] || Star
  const gradient = sourceColors[transaction.source] || 'from-gray-500 to-gray-600'
  const time = transaction.timestamp.toDate().toLocaleTimeString('pl-PL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg p-4 hover:shadow-xl transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{transaction.description}</h3>
          <p className="text-sm text-gray-600">{time}</p>
        </div>

        <div className="text-right">
          <div className={`inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r ${gradient} rounded-xl text-white font-bold shadow-lg`}>
            <Zap className="h-4 w-4" />
            +{transaction.amount} XP
          </div>
        </div>
      </div>
    </motion.div>
  )
}
