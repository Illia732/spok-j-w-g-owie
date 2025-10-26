'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import userService from '@/lib/user-service'
import { XPService, XPSource } from '@/lib/xp-service'
import Header from '@/components/layout/header'
import { MoodEntryForm } from '@/components/mood-entry-form'
import { AIMoodInsights } from '@/components/ai-mood-insights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, BarChart3, ArrowRight, Edit, Sparkles, Target, TrendingUp, Zap, Brain, Gift, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface MoodEntry {
  id: string
  mood: number
  note?: string
  timestamp: Date
  date: string
}

type MoodView = 'mood-selection' | 'note-entry' | 'ai-insights' | 'mood-review'

export default function MoodPage() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [currentMood, setCurrentMood] = useState(50)
  const [currentView, setCurrentView] = useState<MoodView>('mood-selection')
  const [isLoading, setIsLoading] = useState(false)
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 })
  const [showXPReward, setShowXPReward] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)

  const calculateStreakFromEntries = (entries: MoodEntry[]): { currentStreak: number; longestStreak: number } => {
    if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 }

    try {
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let checkDate = new Date(today)
      let streakActive = true

      while (streakActive) {
        const hasEntry = sortedEntries.some(entry => {
          const entryDate = new Date(entry.timestamp)
          entryDate.setHours(0, 0, 0, 0)
          return entryDate.getTime() === checkDate.getTime()
        })

        if (hasEntry) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          streakActive = false
        }
      }

      return { currentStreak, longestStreak: Math.max(currentStreak, streakData.longestStreak) }
    } catch (error) {
      console.error('Błąd obliczania streak:', error)
      return { currentStreak: 0, longestStreak: 0 }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr)
      if (usr) {
        const userRef = doc(db, 'users', usr.uid)
        const unsub = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setUserData(data)

            const entries = data.moodEntries?.map((e: any) => ({
              id: e.timestamp?.toDate().getTime().toString() || Date.now().toString(),
              mood: e.mood,
              note: e.note,
              timestamp: e.timestamp?.toDate() || new Date(),
              date: e.date
            })) || []

            setMoodEntries(entries)

            const todayEntry = entries.find((e: any) => isToday(new Date(e.timestamp)))
            if (todayEntry) {
              setCurrentMood(todayEntry.mood)
              setCurrentView('mood-review')
            } else {
              setCurrentView('mood-selection')
            }

            const streak = calculateStreakFromEntries(entries)
            setStreakData(streak)
          }
        })
        return () => unsub()
      }
    })
    return () => unsubscribe()
  }, [])

  const handleSaveMood = async (mood: number) => {
    if (!user) return
    setIsLoading(true)
    
    try {
      await userService.saveMood(user.uid, mood)
      
      const isFirstMood = moodEntries.length === 0
      const xpResult = await XPService.awardXP(
        user.uid, 
        isFirstMood ? XPSource.FIRST_MOOD : XPSource.MOOD_ENTRY
      )
      
      if (xpResult.success) {
        setXpAwarded(xpResult.xpAwarded)
        setShowXPReward(true)
        await XPService.awardStreakXP(user.uid, streakData.currentStreak + 1)
      }
      
      setCurrentMood(mood)
      setCurrentView('mood-review')
    } catch (error) {
      console.error('Błąd zapisu nastroju:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWithNote = async ({ mood, note }: { mood: number; note?: string }) => {
    if (!user) return
    setIsLoading(true)
    
    try {
      await userService.saveMoodWithNote(user.uid, mood, note)
      
      const isFirstMood = moodEntries.length === 0
      const xpResult = await XPService.awardXP(
        user.uid, 
        isFirstMood ? XPSource.FIRST_MOOD : XPSource.MOOD_ENTRY
      )
      
      if (xpResult.success) {
        setXpAwarded(xpResult.xpAwarded)
        setShowXPReward(true)
        await XPService.awardStreakXP(user.uid, streakData.currentStreak + 1)
      }
      
      setCurrentMood(mood)
      setCurrentView('mood-review')
    } catch (error) {
      console.error('Błąd zapisu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const todayEntry = moodEntries.find(entry => isToday(new Date(entry.timestamp)))
  const averageMood = calculateAverageMood(moodEntries)
  const moodTrend = calculateMoodTrend(moodEntries)
  const consistency = calculateConsistency(moodEntries)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="px-4 py-6">
        <div className="container mx-auto max-w-4xl">
          {/* Nagłówek */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentView === 'mood-selection' ? 'Jak się czujesz?' : 
                 currentView === 'note-entry' ? 'Dodaj notatkę' :
                 currentView === 'ai-insights' ? 'AI Insights' :
                 'Twój nastrój'}
              </h1>
            </div>
          </div>

          <div className="space-y-6">
            {currentView === 'mood-selection' && (
              <MoodSelectionView
                currentMood={currentMood}
                onMoodChange={setCurrentMood}
                onSaveMood={handleSaveMood}
                onAddNote={() => setCurrentView('note-entry')}
                moodEntries={moodEntries}
                streakData={streakData}
                userData={userData}
                moodTrend={moodTrend}
                consistency={consistency}
                averageMood={averageMood}
                todayEntry={todayEntry}
                isLoading={isLoading}
              />
            )}

            {currentView === 'mood-review' && (
              <MoodReviewView
                currentMood={currentMood}
                todayEntry={todayEntry}
                onEditNote={() => setCurrentView('note-entry')}
                onViewAI={() => setCurrentView('ai-insights')}
              />
            )}

            {currentView === 'note-entry' && (
              <NoteEntryView
                currentMood={currentMood}
                onSave={handleSaveWithNote}
                isLoading={isLoading}
                initialNote={todayEntry?.note}
                onBack={() => setCurrentView('mood-review')}
              />
            )}

            {currentView === 'ai-insights' && (
              <AIMoodInsights
                currentMood={currentMood}
                moodEntries={moodEntries}
                streak={streakData.currentStreak}
                trend={moodTrend}
                consistency={consistency}
                averageMood={averageMood}
                level={userData?.level || 1}
                onBack={() => setCurrentView('mood-review')}
              />
            )}

            {(currentView === 'mood-review' || currentView === 'ai-insights' || todayEntry) && (
              <ChartsSection moodEntries={moodEntries} />
            )}
          </div>
        </div>
      </div>

      <XPRewardModal
        show={showXPReward}
        xpAmount={xpAwarded}
        onClose={() => setShowXPReward(false)}
      />
    </main>
  )
}

/* ==================== WIDOK WYBORU NASTROJU ==================== */

interface MoodSelectionViewProps {
  currentMood: number
  onMoodChange: (mood: number) => void
  onSaveMood: (mood: number) => void
  onAddNote: () => void
  moodEntries: MoodEntry[]
  streakData: { currentStreak: number; longestStreak: number }
  userData: any
  moodTrend: number
  consistency: number
  averageMood: number
  todayEntry: MoodEntry | undefined
  isLoading: boolean
}

function MoodSelectionView({
  currentMood,
  onMoodChange,
  onSaveMood,
  onAddNote,
  streakData,
  userData,
  moodTrend,
  consistency,
  averageMood,
  todayEntry,
  isLoading
}: MoodSelectionViewProps) {
  const moods = [
    { value: 20, emoji: '😔', label: 'Bardzo niski' },
    { value: 40, emoji: '😐', label: 'Niski' },
    { value: 60, emoji: '🙂', label: 'Neutralny' },
    { value: 80, emoji: '😊', label: 'Wysoki' },
    { value: 100, emoji: '🤩', label: 'Bardzo wysoki' }
  ]

  const xpInfo = XPService.getLevelInfo(userData?.xp || 0)

  return (
    <div className="space-y-6">
      {/* Statystyki */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-orange-500" />
            <div className="text-lg font-semibold">{streakData.currentStreak}</div>
          </div>
          <div className="text-xs text-gray-500">streak</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold mb-1">Lvl {userData?.level || 1}</div>
          <div className="text-xs text-gray-500">poziom</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <div className="text-lg font-semibold">{averageMood}%</div>
          </div>
          <div className="text-xs text-gray-500">średnia</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="h-3 w-3 text-green-500" />
            <div className="text-lg font-semibold">{consistency}%</div>
          </div>
          <div className="text-xs text-gray-500">konsystencja</div>
        </div>
      </div>

      {/* Pasek postępu XP */}
      <div className="p-3 bg-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="text-purple-700 font-medium">Poziom {userData?.level || 1}</span>
          <span className="text-purple-700 font-medium">{Math.round(xpInfo.xpProgress)}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpInfo.xpProgress}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
      </div>

      {/* Wybór nastroju */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Jak się czujesz dzisiaj?</h2>
            
            {/* Suwak */}
            <div className="px-4">
              <input
                type="range"
                min="0"
                max="100"
                value={currentMood}
                onChange={(e) => onMoodChange(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-gray-400 via-blue-400 via-green-400 via-purple-400 to-pink-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>😔 Niski</span>
                <span>🤩 Wysoki</span>
              </div>
            </div>

            {/* Przyciski nastroju */}
            <div className="grid grid-cols-5 gap-2">
              {moods.map((mood, index) => (
                <button
                  key={mood.value}
                  onClick={() => onMoodChange(mood.value)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border transition-all",
                    currentMood === mood.value
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.value}%</span>
                </button>
              ))}
            </div>

            {/* Wyświetlanie aktualnego nastroju */}
            <div className="space-y-2">
              <div className={cn(
                "inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-semibold",
                getMoodBackgroundClass(currentMood)
              )}>
                <span className="text-2xl">{getMoodEmoji(currentMood)}</span>
                <span>{currentMood}% - {getMoodLabel(currentMood)}</span>
              </div>
              <p className="text-gray-600 text-sm">
                {getMoodDescription(currentMood)}
              </p>
            </div>

            {/* Przyciski akcji */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => onSaveMood(currentMood)}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Zapisz nastrój (+10 XP)
                  </>
                )}
              </Button>
              
              <Button
                onClick={onAddNote}
                variant="outline"
                className="flex-1 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                <Edit className="h-4 w-4 mr-2" />
                Dodaj notatkę
              </Button>
            </div>

            {todayEntry && (
              <p className="text-green-600 text-sm font-medium">
                Masz już zapisany nastrój na dzisiaj ({todayEntry.mood}%)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ==================== WIDOK PRZEGLĄDU NASTROJU ==================== */

function MoodReviewView({ currentMood, todayEntry, onEditNote, onViewAI }: any) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-6xl">{getMoodEmoji(currentMood)}</div>
            
            <div className={cn(
              "px-6 py-3 rounded-xl text-white font-semibold",
              getMoodBackgroundClass(currentMood)
            )}>
              {currentMood}%
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {getMoodLabel(currentMood)}
              </h3>
              <p className="text-gray-600">
                {getMoodDescription(currentMood)}
              </p>
            </div>
          </div>

          {todayEntry?.note && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Twoja notatka
              </h4>
              <p className="text-blue-800 text-sm">
                {todayEntry.note}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onEditNote}
              variant={todayEntry?.note ? "outline" : "primary"}
              className={cn(
                "flex-1 py-3 font-semibold",
                todayEntry?.note 
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <Edit className="h-4 w-4 mr-2" />
              {todayEntry?.note ? 'Edytuj notatkę' : 'Dodaj notatkę'}
            </Button>
            
            <Button
              onClick={onViewAI}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </Button>
          </div>

          <p className="text-gray-500 text-sm">
            {todayEntry?.timestamp ? (
              <>Nastrój zapisany {formatTimestamp(todayEntry.timestamp)}</>
            ) : (
              <>Nastrój zapisany dzisiaj</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ==================== WIDOK DODAWANIA NOTATKI ==================== */

function NoteEntryView({ currentMood, onSave, isLoading, initialNote, onBack }: any) {
  const [note, setNote] = useState(initialNote || '')

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-sm",
              getMoodBackgroundClass(currentMood)
            )}>
              <span className="text-xl">{getMoodEmoji(currentMood)}</span>
              <span>{currentMood}%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dodaj notatkę (opcjonalnie)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jak się czujesz? Co wpłynęło na Twój nastrój?"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                Wróć
              </Button>
              
              <Button
                onClick={() => onSave({ mood: currentMood, note })}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ==================== SEKCJA WYKRESÓW ==================== */

function ChartsSection({ moodEntries }: { moodEntries: MoodEntry[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Wykres */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Ostatnie 7 dni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedMoodChart moodEntries={moodEntries} />
        </CardContent>
      </Card>

      {/* Ostatnie wpisy */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4 text-purple-600" />
            Ostatnie wpisy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleRecentEntries moodEntries={moodEntries} />
        </CardContent>
      </Card>
    </div>
  )
}

/* ==================== MINIMALISTYCZNY WYKRES ==================== */

function AdvancedMoodChart({ moodEntries }: { moodEntries: MoodEntry[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date,
        label: date.toLocaleDateString('pl-PL', { weekday: 'narrow' })
      })
    }
    return days
  }

  const chartData = getLast7Days().map((day, index) => {
    const entry = moodEntries.find(e => 
      new Date(e.timestamp).toDateString() === day.date.toDateString()
    )
    return {
      ...day,
      mood: entry ? entry.mood : null,
      index
    }
  })

  return (
    <div className="w-full space-y-4">
      {/* Wykres */}
      <div className="flex items-end justify-between h-32 space-x-1">
        {chartData.map((day) => (
          <ChartColumn 
            key={day.index}
            day={day}
            isHovered={hoveredIndex === day.index}
            onHover={setHoveredIndex}
          />
        ))}
      </div>

      {/* Dni tygodnia */}
      <div className="flex justify-between px-1">
        {chartData.map((day, index) => (
          <div
            key={index}
            className={cn(
              "text-sm font-medium text-center min-w-[30px]",
              day.index === 6 ? "text-blue-600" : "text-gray-500"
            )}
          >
            {day.label}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-gray-400 rounded-sm" />
          <span className="text-gray-600">😔</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-blue-400 rounded-sm" />
          <span className="text-gray-600">😐</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-sm" />
          <span className="text-gray-600">🙂</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-purple-400 rounded-sm" />
          <span className="text-gray-600">😊</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-pink-400 rounded-sm" />
          <span className="text-gray-600">🤩</span>
        </div>
      </div>
    </div>
  )
}

function ChartColumn({ day, isHovered, onHover }: any) {
  const getBarColor = (mood: number | null) => {
    if (mood === null) return 'bg-gray-200'
    if (mood <= 20) return 'bg-gray-400'
    if (mood <= 40) return 'bg-blue-400'
    if (mood <= 60) return 'bg-green-400'
    if (mood <= 80) return 'bg-purple-400'
    return 'bg-pink-400'
  }

  const getBarHeight = (mood: number | null) => {
    if (mood === null) return 8
    return Math.max((mood / 100) * 100, 12)
  }

  const height = getBarHeight(day.mood)

  return (
    <motion.div
      className="flex flex-col items-center flex-1 relative group"
      onMouseEnter={() => onHover(day.index)}
      onMouseLeave={() => onHover(null)}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ 
        delay: day.index * 0.1, 
        type: "spring", 
        stiffness: 200 
      }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && day.mood !== null && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: -8 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
              {day.mood}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kolumna */}
      <div className="relative w-6 flex justify-center">
        <motion.div
          className={cn(
            "w-4 rounded-t transition-all duration-200",
            getBarColor(day.mood)
          )}
          style={{ height: `${height}px` }}
          whileHover={{ 
            scale: 1.1,
            transition: { duration: 0.1 }
          }}
          animate={{
            opacity: isHovered ? 0.9 : 0.7,
          }}
        >
          {/* Efekt aktywnej kolumny */}
          {isHovered && (
            <motion.div 
              className="absolute inset-0 bg-white/30 rounded-t"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ==================== UPROSZCZONE OSTATNIE WPISY ==================== */

function SimpleRecentEntries({ moodEntries }: { moodEntries: MoodEntry[] }) {
  if (moodEntries.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 text-sm">Brak zapisanych nastrojów</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {moodEntries.slice(0, 4).map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-medium", // Zmienione z w-8 h-8 na w-6 h-6 i text-sm na text-xs
              getMoodColorClass(entry.mood)
            )}>
              {entry.mood}%
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">
                {formatDate(entry.timestamp)}
              </div>
              {entry.note && (
                <div className="text-xs text-gray-600 line-clamp-1">
                  {entry.note}
                </div>
              )}
            </div>
          </div>
          <div className="text-xl">
            {getMoodEmoji(entry.mood)}
          </div>
        </motion.div>
      ))}
      
      {moodEntries.length > 4 && (
        <Link href="/mood/history">
          <div className="flex items-center justify-center gap-1 p-3 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
            <span className="text-sm font-medium">Pełna historia</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      )}
    </div>
  )
}

/* ==================== MODAL NAGRODY XP ==================== */

function XPRewardModal({ show, xpAmount, onClose }: { show: boolean; xpAmount: number; onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 0.6 }}
                className="inline-block mb-4"
              >
                <Gift className="h-16 w-16 text-amber-500 mx-auto" />
              </motion.div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Gratulacje! 🎉
              </h2>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 rounded-lg text-white font-bold text-lg mb-4">
                <Sparkles className="h-4 w-4" />
                <span>+{xpAmount} XP</span>
              </div>
              
              <p className="text-gray-600 mb-6">
                Za dodanie nastroju!
              </p>
              
              <Button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Super! 🚀
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ==================== FUNKCJE POMOCNICZE ==================== */

function isToday(date: Date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function calculateAverageMood(entries: MoodEntry[]): number {
  if (!entries.length) return 0
  const last7 = entries.slice(0, 7)
  return Math.round(last7.reduce((sum, e) => sum + e.mood, 0) / last7.length)
}

function calculateMoodTrend(entries: MoodEntry[]): number {
  if (entries.length < 2) return 0
  const last7 = entries.slice(0, 7)
  if (last7.length < 2) return 0
  return Math.round(last7[0].mood - last7[1].mood)
}

function calculateConsistency(entries: MoodEntry[]): number {
  if (entries.length < 2) return 0
  const last7 = entries.slice(0, 7)
  const changes = last7.slice(1).map((e, i) => Math.abs(e.mood - last7[i].mood))
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
  return Math.max(0, 100 - Math.round(avgChange * 2))
}

function getMoodLabel(mood: number): string {
  if (mood <= 20) return 'Bardzo niski'
  if (mood <= 40) return 'Niski'
  if (mood <= 60) return 'Neutralny'
  if (mood <= 80) return 'Wysoki'
  return 'Bardzo wysoki'
}

function getMoodDescription(mood: number): string {
  if (mood <= 20) return 'Potrzebujesz wsparcia i troski'
  if (mood <= 40) return 'Czas na łagodną opiekę nad sobą'
  if (mood <= 60) return 'Równowaga i spokój'
  if (mood <= 80) return 'Energia i radość'
  return 'Pełnia szczęścia i spełnienia'
}

function getMoodColorClass(mood: number): string {
  if (mood <= 20) return 'bg-gray-500'
  if (mood <= 40) return 'bg-blue-500'
  if (mood <= 60) return 'bg-green-500'
  if (mood <= 80) return 'bg-purple-500'
  return 'bg-pink-500'
}

function getMoodBackgroundClass(mood: number): string {
  if (mood <= 20) return 'bg-gray-500'
  if (mood <= 40) return 'bg-blue-500'
  if (mood <= 60) return 'bg-green-500'
  if (mood <= 80) return 'bg-purple-500'
  return 'bg-pink-500'
}

function getMoodEmoji(mood: number): string {
  if (mood <= 20) return '😔'
  if (mood <= 40) return '😐'
  if (mood <= 60) return '🙂'
  if (mood <= 80) return '😊'
  return '🤩'
}

function formatDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return 'Dzisiaj'
  if (date.toDateString() === yesterday.toDateString()) return 'Wczoraj'
  
  return date.toLocaleDateString('pl-PL', { 
    day: 'numeric', 
    month: 'short' 
  })
}

function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return `dzisiaj o ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `wczoraj o ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  } else {
    return `${date.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'long'
    })} o ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  }
}