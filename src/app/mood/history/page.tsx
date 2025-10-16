'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import Header from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Calendar, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MoodEntry {
  id: string
  mood: number
  note?: string
  timestamp: Date
  date: string
}

export default function MoodHistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr)
      if (usr) {
        const userRef = doc(db, 'users', usr.uid)
        const unsub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            const entries = data.moodEntries?.map((e: any) => ({
              id: e.timestamp?.toDate().getTime().toString() || Date.now().toString(),
              mood: e.mood,
              note: e.note,
              timestamp: e.timestamp?.toDate() || new Date(),
              date: e.date
            })) || []
            setMoodEntries(entries)
          }
        })
        return () => unsub()
      }
    })
    return () => unsubscribe()
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getMoodForDate = (date: Date) => {
    return moodEntries.find(entry => 
      new Date(entry.timestamp).toDateString() === date.toDateString()
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newMonth
    })
  }

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

  const days = getDaysInMonth(currentMonth)
  const selectedEntry = selectedDate ? getMoodForDate(selectedDate) : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <Header />
      
      <div className="px-4 py-6 sm:py-8">
        <div className="container mx-auto max-w-6xl">
          {/* Minimalistyczny header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900">
                Kalendarz nastrojów
              </h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
              Kliknij na dzień aby zobaczyć szczegóły twojego nastroju
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Kalendarz - główna sekcja */}
            <div className="xl:col-span-3">
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm border border-white/20">
                <CardContent className="p-4 sm:p-6">
                  {/* Kontrolki miesiąca */}
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="text-center">
                      <span className="text-lg sm:text-xl font-semibold text-gray-900">
                        {currentMonth.toLocaleDateString('pl-PL', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Dni tygodnia */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-3">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Kalendarz */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {days.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="h-12 sm:h-14" />
                      }

                      const moodEntry = getMoodForDate(date)
                      const isToday = date.toDateString() === new Date().toDateString()
                      const isSelected = selectedDate?.toDateString() === date.toDateString()

                      return (
                        <button
                          key={date.getTime()}
                          onClick={() => setSelectedDate(date)}
                          className={cn(
                            "h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center relative group",
                            "hover:scale-105 hover:shadow-md active:scale-95",
                            isSelected 
                              ? "border-blue-500 bg-blue-50 shadow-lg scale-105" 
                              : moodEntry 
                                ? "border-white bg-white shadow-sm hover:border-blue-200"
                                : "border-transparent bg-gray-50/50 hover:bg-gray-100",
                            isToday && !isSelected && "border-amber-400 bg-amber-50/80"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-medium transition-colors",
                            isToday ? "text-amber-600 font-bold" : 
                            isSelected ? "text-blue-600" : 
                            moodEntry ? "text-gray-800" : "text-gray-500"
                          )}>
                            {date.getDate()}
                          </span>
                          
                          {moodEntry && (
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1 transition-all",
                              getMoodColorClass(moodEntry.mood),
                              isSelected && "scale-125"
                            )} />
                          )}
                          
                          {/* Hover effect */}
                          {moodEntry && (
                            <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* POPRAWIONA LEGENDA - identyczne kolory jak w głównej stronie */}
              <div className="mt-6 p-4 bg-white/80 rounded-2xl shadow-sm border border-white/20">
                <div className="text-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Legenda nastrojów</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 rounded-full shadow-sm"></div>
                    <span>0-20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
                    <span>21-40%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
                    <span>41-60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full shadow-sm"></div>
                    <span>61-80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rose-600 rounded-full shadow-sm"></div>
                    <span>81-100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-amber-400 rounded shadow-sm"></div>
                    <span>Dzisiaj</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel szczegółów - pojawia się tylko gdy data jest wybrana */}
            {selectedDate && (
              <div className="xl:col-span-1">
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm border border-white/20 sticky top-6 sm:top-8">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDate.toLocaleDateString('pl-PL', { 
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(null)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {selectedEntry ? (
                      <div className="space-y-4">
                        {/* Mood Display - identyczne kolory jak w głównej stronie */}
                        <div className={cn(
                          "p-4 rounded-2xl text-white text-center shadow-lg",
                          getMoodBackgroundClass(selectedEntry.mood)
                        )}>
                          <div className="text-3xl sm:text-4xl mb-3">{getMoodEmoji(selectedEntry.mood)}</div>
                          <div className="text-2xl sm:text-3xl font-bold mb-1">{selectedEntry.mood}%</div>
                          <div className="text-sm sm:text-base opacity-90 font-medium">
                            {getMoodLabel(selectedEntry.mood)}
                          </div>
                        </div>

                        {/* Note */}
                        {selectedEntry.note && (
                          <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <h4 className="font-semibold text-blue-900 text-sm">Twoja notatka</h4>
                            </div>
                            <p className="text-blue-800 text-sm leading-relaxed">
                              {selectedEntry.note}
                            </p>
                          </div>
                        )}

                        {/* Time */}
                        <div className="text-center pt-2">
                          <div className="text-xs text-gray-500 bg-gray-100 rounded-lg py-2 px-3 inline-block">
                            🕒 Zapisano o {formatExactTime(selectedEntry.timestamp)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Heart className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium mb-2">Brak wpisu</p>
                        <p className="text-gray-500 text-sm">
                          Nie masz zapisanego nastroju na ten dzień
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Placeholder gdy nie wybrano daty - tylko na desktop */}
            {!selectedDate && (
              <div className="xl:col-span-1 hidden xl:block">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm border border-white/20 h-full">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Wybierz dzień</h3>
                    <p className="text-gray-600 text-sm">
                      Kliknij na dowolny dzień w kalendarzu aby zobaczyć szczegóły twojego nastroju
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Mobile helper - tylko na mobile gdy nie wybrano daty */}
          {!selectedDate && (
            <div className="xl:hidden mt-6 p-4 bg-white/80 rounded-2xl shadow-sm border border-white/20 text-center">
              <p className="text-gray-600 text-sm">
                👆 Dotknij dnia w kalendarzu aby zobaczyć szczegóły
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/* ------------------ FUNKCJE POMOCNICZE - IDENTYCZNE JAK W GŁÓWNEJ STRONIE ------------------ */
function getMoodLabel(mood: number): string {
  if (mood <= 20) return 'Bardzo niski'
  if (mood <= 40) return 'Niski'
  if (mood <= 60) return 'Neutralny'
  if (mood <= 80) return 'Wysoki'
  return 'Bardzo wysoki'
}

function getMoodColorClass(mood: number): string {
  if (mood <= 20) return 'bg-gray-600'
  if (mood <= 40) return 'bg-blue-600'
  if (mood <= 60) return 'bg-green-600'
  if (mood <= 80) return 'bg-purple-600'
  return 'bg-rose-600'
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

function formatExactTime(timestamp: Date): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pl-PL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}