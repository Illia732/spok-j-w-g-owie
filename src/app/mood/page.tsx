'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import userService from '@/lib/user-service'
import Header from '@/components/layout/header'
import { MoodEntryForm } from '@/components/mood-entry-form'
import { AIMoodInsights } from '@/components/ai-mood-insights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, BarChart3, ArrowRight, Heart, Edit, Sparkles, Target, TrendingUp, Zap, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

  const calculateStreakFromEntries = (entries: MoodEntry[]): { currentStreak: number; longestStreak: number } => {
    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    try {
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      let currentStreak = 0
      let longestStreak = 0
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const hasTodayEntry = sortedEntries.some(entry => {
        const entryDate = new Date(entry.timestamp)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const hasYesterdayEntry = sortedEntries.some(entry => {
        const entryDate = new Date(entry.timestamp)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === yesterday.getTime()
      })

      if (hasTodayEntry) {
        currentStreak = 1
        
        let checkDate = new Date(yesterday)
        let streakDays = 1
        
        while (true) {
          const hasEntryOnDate = sortedEntries.some(entry => {
            const entryDate = new Date(entry.timestamp)
            entryDate.setHours(0, 0, 0, 0)
            return entryDate.getTime() === checkDate.getTime()
          })
          
          if (hasEntryOnDate) {
            streakDays++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
        
        currentStreak = streakDays
      } else if (hasYesterdayEntry) {
        currentStreak = 1
      }

      longestStreak = Math.max(longestStreak, currentStreak)

      return {
        currentStreak,
        longestStreak
      }
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
      setCurrentMood(mood)
      setCurrentView('mood-review')
    } catch (error) {
      console.error('Błąd zapisu nastroju:', error)
      alert('Błąd zapisu nastroju. Spróbuj ponownie.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWithNote = async (data: { mood: number; note?: string }) => {
    if (!user) return
    setIsLoading(true)
    
    try {
      await userService.saveMoodWithNote(user.uid, data.mood, data.note)
      setCurrentMood(data.mood)
      setCurrentView('mood-review')
    } catch (error) {
      console.error('Błąd zapisu:', error)
      alert('Błąd zapisu. Spróbuj ponownie.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = () => {
    setCurrentView('note-entry')
  }

  const handleViewNote = () => {
    setCurrentView('note-entry')
  }

  const todayEntry = moodEntries.find(entry => isToday(new Date(entry.timestamp)))
  const averageMood = calculateAverageMood(moodEntries)
  const moodTrend = calculateMoodTrend(moodEntries)
  const consistency = calculateConsistency(moodEntries)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <Header />
      
      <div className="px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-sm">
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-200 bg-white/80 hover:bg-white hover:border-gray-300 px-3 sm:px-4">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Powrót</span>
              </Button>
            </Link>
            
            <div className="text-center flex-1 mx-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 leading-tight">
                {currentView === 'mood-selection' ? 'Jak się czujesz?' : 
                 currentView === 'note-entry' ? 'Dodaj notatkę' :
                 currentView === 'ai-insights' ? 'AI Insights' :
                 'Twój nastrój'}
              </h1>
            </div>
            
            <div className="w-16 sm:w-24"></div>
          </div>

          <div className="space-y-8">
            {currentView === 'mood-selection' && (
              <div className="mt-12">
                <SimpleMoodPicker
                  value={currentMood}
                  onValueChange={setCurrentMood}
                  moodEntries={moodEntries}
                  streak={streakData.currentStreak}
                  trend={moodTrend}
                  consistency={consistency}
                  averageMood={averageMood}
                  level={userData?.level || 1}
                  onSaveMood={handleSaveMood}
                  onAddNote={handleAddNote}
                  todayEntry={todayEntry}
                />
              </div>
            )}

            {currentView === 'mood-review' && (
              <MoodReview
                currentMood={currentMood}
                todayEntry={todayEntry}
                onEditNote={handleViewNote}
                onViewAI={() => setCurrentView('ai-insights')}
              />
            )}

            {currentView === 'note-entry' && (
              <div className="w-full max-w-2xl mx-auto">
                <MoodEntryForm
                  currentMood={currentMood}
                  onSave={handleSaveWithNote}
                  isLoading={isLoading}
                  initialNote={todayEntry?.note}
                />
                <Button
                  onClick={() => setCurrentView('mood-review')}
                  variant="outline"
                  className="w-full mt-4 border-gray-200 bg-white/80 hover:bg-white hover:border-gray-300"
                >
                  ← Wróć do przeglądu
                </Button>
              </div>
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

            {/* POPRAWIONA SEKCJA Z WYKRESEM I HISTORIĄ */}
            {(currentView === 'mood-review' || currentView === 'ai-insights' || todayEntry) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
                {/* NOWY PIĘKNIEJSZY WYKRES */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm border border-white/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Ostatnie 7 dni
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <BeautifulMoodChart moodEntries={moodEntries} />
                  </CardContent>
                </Card>

                {/* OSTATNIE WPISY - TERAZ Z AKTYWNYM PRZYCISKIEM HISTORII */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm border border-white/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Ostatnie wpisy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {moodEntries.length > 0 ? (
                      <div className="space-y-3">
                        {/* TYLKO 3 OSTATNIE WPISY */}
                        {moodEntries.slice(0, 3).map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md",
                                getMoodColorClass(entry.mood)
                              )}>
                                {entry.mood}%
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 text-sm">
                                  {formatDate(entry.timestamp)}
                                </div>
                                {/* PRAWDZIWA GODZINA WPISU */}
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatExactTime(entry.timestamp)}
                                </div>
                                {entry.note && (
                                  <div className="text-sm text-gray-600 line-clamp-1 mt-2">
                                    {entry.note}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-2xl">
                              {getMoodEmoji(entry.mood)}
                            </div>
                          </div>
                        ))}
                        
                        {/* AKTYWNY PRZYCISK PEŁNEJ HISTORII */}
                        <div className="pt-4">
                          <Link href="/mood/history">
                            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 hover:text-blue-800 hover:bg-blue-100 transition-all duration-200 cursor-pointer">
                              <span className="text-sm font-medium">Pełna historia</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </Link>
                          <p className="text-xs text-gray-500 text-center mt-2">
                            Zobacz kalendarz i pełną historię nastrojów
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Brak zapisanych nastrojów</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Zacznij śledzić swój nastrój powyżej
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ------------------ NOWY PIĘKNIEJSZY WYKRES ------------------ */
function BeautifulMoodChart({ moodEntries }: { moodEntries: MoodEntry[] }) {
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date,
        label: date.toLocaleDateString('pl-PL', { weekday: 'short' })
      })
    }
    return days
  }

  const chartData = getLast7Days().map(day => {
    const entry = moodEntries.find(e => 
      new Date(e.timestamp).toDateString() === day.date.toDateString()
    )
    return {
      date: day.label,
      mood: entry ? entry.mood : null,
      fullDate: day.date
    }
  })

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return '#e5e7eb'
    if (mood <= 20) return '#6b7280'
    if (mood <= 40) return '#3b82f6'
    if (mood <= 60) return '#10b981'
    if (mood <= 80) return '#8b5cf6'
    return '#f43f5e'
  }

  const getMoodHeight = (mood: number | null) => {
    if (mood === null) return '10%'
    return `${mood}%`
  }

  return (
    <div className="w-full h-48 sm:h-56">
      <div className="flex items-end justify-between h-full space-x-1 sm:space-x-2">
        {chartData.map((day, index) => (
          <div key={index} className="flex flex-col items-center flex-1 space-y-2">
            <div className="relative w-full flex justify-center">
              <div 
                className={cn(
                  "w-3/4 sm:w-10/12 rounded-t-lg transition-all duration-500 ease-out",
                  day.mood === null ? "bg-gray-200" : "shadow-lg"
                )}
                style={{ 
                  height: getMoodHeight(day.mood),
                  backgroundColor: getMoodColor(day.mood)
                }}
              >
                {day.mood !== null && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">
                    {day.mood}%
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600 font-medium text-center">
              {day.date}
            </div>
            <div className="text-xs text-gray-400">
              {day.fullDate.getDate()}/{day.fullDate.getMonth() + 1}
            </div>
          </div>
        ))}
      </div>
      
      {/* Linia trendu */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Niski nastrój</span>
          <span>Wysoki nastrój</span>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-gray-400 via-blue-400 via-green-400 via-purple-400 to-rose-400 rounded-full mt-1"></div>
      </div>
    </div>
  )
}

/* ------------------ PROSTY MOOD PICKER ------------------ */
function SimpleMoodPicker({ 
  value, 
  onValueChange, 
  onSaveMood, 
  onAddNote, 
  streak,
  todayEntry 
}: any) {
  const moods = [
    { value: 20, emoji: '😔', label: 'Bardzo niski', color: 'bg-gray-500' },
    { value: 40, emoji: '😐', label: 'Niski', color: 'bg-blue-500' },
    { value: 60, emoji: '🙂', label: 'Neutralny', color: 'bg-green-500' },
    { value: 80, emoji: '😊', label: 'Wysoki', color: 'bg-purple-500' },
    { value: 100, emoji: '🤩', label: 'Bardzo wysoki', color: 'bg-rose-500' }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm border border-white/20">
        <CardContent className="p-8">
          {/* Stats Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-4 w-4 text-blue-600" />
                <div className="font-bold text-blue-600 text-xl">{streak}</div>
              </div>
              <div className="text-sm text-blue-600">dni streak</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <div className="font-bold text-green-600 text-xl">{todayEntry ? 'Dzisiaj' : 'Brak'}</div>
              </div>
              <div className="text-sm text-green-600">dzisiejszy wpis</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div className="font-bold text-purple-600 text-xl">{value}%</div>
              </div>
              <div className="text-sm text-purple-600">twój nastrój</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <div className="font-bold text-amber-600 text-xl">Poziom 1</div>
              </div>
              <div className="text-sm text-amber-600">twoje konto</div>
            </div>
          </div>

          {/* Mood Selection */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Jak się czujesz dzisiaj?
            </h2>
            
            {/* Mood Slider */}
            <div className="mb-8">
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onValueChange(Number(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-gray-400 via-blue-400 via-green-400 via-purple-400 to-rose-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Bardzo niski</span>
                <span>Bardzo wysoki</span>
              </div>
            </div>

            {/* Mood Buttons */}
            <div className="grid grid-cols-5 gap-3 mb-8">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => onValueChange(mood.value)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300",
                    value === mood.value
                      ? `${mood.color} border-white text-white shadow-lg scale-105`
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md"
                  )}
                >
                  <span className="text-2xl mb-2">{mood.emoji}</span>
                  <span className="text-sm font-medium">{mood.label}</span>
                  <span className="text-xs opacity-75 mt-1">{mood.value}%</span>
                </button>
              ))}
            </div>

            {/* Current Mood Display */}
            <div className="mb-8">
              <div className={cn(
                "inline-flex items-center gap-4 px-6 py-4 rounded-2xl text-white font-bold text-xl shadow-lg",
                getMoodBackgroundClass(value)
              )}>
                <span className="text-2xl">{getMoodEmoji(value)}</span>
                <span>{value}% - {getMoodLabel(value)}</span>
              </div>
              <p className="text-gray-600 mt-3 text-lg">
                {getMoodDescription(value)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => onSaveMood(value)}
                className="flex-1 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Zapisz nastrój
              </Button>
              
              <Button
                onClick={onAddNote}
                variant="outline"
                className="flex-1 py-4 text-lg font-semibold rounded-xl border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                size="lg"
              >
                <Edit className="h-5 w-5 mr-2" />
                Dodaj notatkę
              </Button>
            </div>

            {todayEntry && (
              <p className="text-sm text-gray-500 mt-4">
                ✅ Masz już zapisany nastrój na dzisiaj ({todayEntry.mood}%)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------ PRZEGLĄD NASTROJU ------------------ */
function MoodReview({ currentMood, todayEntry, onEditNote, onViewAI }: any) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm border border-white/20">
        <CardContent className="p-8">
          <div className="text-center space-y-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="text-8xl mb-4 mt-8">
                {getMoodEmoji(currentMood)}
              </div>
              
              <div className={cn(
                "px-6 py-3 rounded-2xl font-bold text-2xl",
                getMoodBackgroundClass(currentMood),
                "text-white shadow-lg"
              )}>
                {currentMood}%
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-gray-900">
                  {getMoodLabel(currentMood)}
                </h3>
                <p className="text-gray-600 text-lg font-medium">
                  {getMoodDescription(currentMood)}
                </p>
              </div>
            </div>

            {todayEntry?.note && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-3 text-lg">
                  <Edit className="h-5 w-5" />
                  Twoja notatka
                </h4>
                <p className="text-blue-800 text-base leading-relaxed font-medium">
                  {todayEntry.note}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button
                onClick={onEditNote}
                variant={todayEntry?.note ? "outline" : "primary"}
                className={cn(
                  "flex-1 py-4 text-base font-semibold rounded-xl",
                  todayEntry?.note 
                    ? "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                )}
              >
                <Edit className="h-5 w-5 mr-2" />
                {todayEntry?.note ? 'Edytuj notatkę' : 'Dodaj notatkę'}
              </Button>
              
              <Button
                onClick={onViewAI}
                className="flex-1 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
              >
                <Brain className="h-5 w-5 mr-2" />
                AI Insights
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center pt-6 font-medium">
              {todayEntry?.timestamp ? (
                <>Nastrój zapisany {formatTimestamp(todayEntry.timestamp)}</>
              ) : (
                <>Nastrój zapisany dzisiaj o {new Date().toLocaleTimeString('pl-PL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------ FUNKCJE POMOCNICZE ------------------ */
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
  if (mood <= 20) return 'bg-gray-600 shadow-gray-700/50'
  if (mood <= 40) return 'bg-blue-600 shadow-blue-700/50'
  if (mood <= 60) return 'bg-green-600 shadow-green-700/50'
  if (mood <= 80) return 'bg-purple-600 shadow-purple-700/50'
  return 'bg-rose-600 shadow-rose-700/50'
}

function getMoodBackgroundClass(mood: number): string {
  if (mood <= 20) return 'bg-gray-500'
  if (mood <= 40) return 'bg-blue-500'
  if (mood <= 60) return 'bg-green-500'
  if (mood <= 80) return 'bg-purple-500'
  return 'bg-rose-500'
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
      month: 'long',
      year: 'numeric'
    })} o ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  }
}

// NOWA FUNKCJA DO FORMATOWANIA DOKŁADNEGO CZASU
function formatExactTime(timestamp: Date): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pl-PL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}