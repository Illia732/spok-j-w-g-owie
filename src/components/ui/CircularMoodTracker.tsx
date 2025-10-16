
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getMoodLabel, getMoodEmoji, getMoodColor } from '@/lib/mood-utils'
import { MoodEntryForm } from '@/components/mood-entry-form'
import { Sparkles, Lightbulb, Brain, Target, Zap, X } from 'lucide-react'

interface MoodEntry {
  id: string
  mood: number
  note?: string
  date: string
  timestamp: Date
}

interface CircularMoodTrackerProps {
  value: number
  onValueChange: (value: number) => void
  onSaveMood: (data: { mood: number; note?: string }) => Promise<void>
  size?: number
  moodEntries?: MoodEntry[]
  streak?: number
  trend?: number
  consistency?: number
  averageMood?: number
  level?: number
}

interface AIMoodInsights {
  analysis: string
  suggestions: string[]
  pattern: string
  encouragement: string
  specialTip: string
}

export const CircularMoodTracker: React.FC<CircularMoodTrackerProps> = ({
  value,
  onValueChange,
  onSaveMood,
  size = 200,
  moodEntries = [],
  streak = 0,
  trend = 0,
  consistency = 0,
  averageMood = 50,
  level = 1
}) => {
  const [currentMood, setCurrentMood] = useState(value)
  const [isDragging, setIsDragging] = useState(false)
  const [hovered, setHovered] = useState<{id: string, content: string} | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIMoodInsights | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const ringRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentMood(value)
  }, [value])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close AI insights when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowAISuggestions(false)
      }
    }

    if (showAISuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [showAISuggestions])

  // Get AI Insights when showing suggestions
  useEffect(() => {
    if (showAISuggestions && !aiInsights && !loadingAI) {
      fetchAIInsights()
    }
  }, [showAISuggestions])

  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true)
      
      const response = await fetch('/api/ai-mood-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: currentMood,
          streak,
          trend,
          consistency,
          averageMood,
          level,
          moodHistory: moodEntries.slice(0, 14)
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setAiInsights(data)
      
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      // Fallback insights
      setAiInsights({
        analysis: "Analizuję Twój nastrój w kontekście wszystkich danych...",
        suggestions: [
          "Zrób 5 głębokich oddechów i skup się na chwili obecnej",
          "Zapisz 3 rzeczy za które jesteś wdzięczny dzisiaj",
          "Wyjdź na krótki spacer i zauważ piękno wokół siebie"
        ],
        pattern: `Konsystencja na poziomie ${consistency}% wskazuje na ${getConsistencyDescription(consistency).toLowerCase()}`,
        encouragement: "Twój streak pokazuje zaangażowanie w samoobserwację! 🌟",
        specialTip: "Dopasuj tempo do swojego samopoczucia - słuchaj siebie"
      })
    } finally {
      setLoadingAI(false)
    }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    handleDragMove(e)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !ringRef.current) return
    
    const rect = ringRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const x = clientX - rect.left - rect.width / 2
    const y = clientY - rect.top - rect.height / 2
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360
    let newMood = Math.round((angle / 360) * 100)
    newMood = Math.min(Math.max(newMood, 0), 100)
    
    setCurrentMood(newMood)
    onValueChange(newMood)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleSaveMood = async (data: { mood: number; note?: string }) => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await onSaveMood(data)
      setSaveSuccess(true)
      // Automatically show AI insights after 1 second
      setTimeout(() => setShowAISuggestions(true), 1000)
    } catch (error) {
      console.error('Error saving mood:', error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent | TouchEvent) => {
        handleDragMove(e as any)
      }
      const handleEnd = () => handleDragEnd()

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleMove)
      window.addEventListener('touchend', handleEnd)

      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleEnd)
        window.removeEventListener('touchmove', handleMove)
        window.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging])

  const getRingPercentage = () => currentMood / 100
  const recentHistory = [...moodEntries].reverse().slice(0, 7).reverse()

  return (
    <>
      <div className={cn(
        "relative flex flex-col items-center justify-center select-none w-full max-w-[360px] mx-auto p-4 sm:p-5 rounded-2xl",
        "bg-white/80 backdrop-blur-sm",
        "shadow-md border border-gray-100",
        "transition-colors duration-500",
        "touch-none"
      )}>
        {/* Główne pole ringa */}
        <div className="relative w-full aspect-square mb-4">
          <div 
            ref={ringRef}
            className="w-full h-full rounded-full relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="absolute inset-0 rounded-full bg-gray-100/50" />
            
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${getMoodColor(currentMood)} ${getRingPercentage() * 360}deg, transparent ${getRingPercentage() * 360}deg)`,
                clipPath: 'inset(10% 10% 10% 10%)'
              }}
            />
            
            <motion.div
              className="absolute top-0 left-1/2 w-1 h-7 sm:h-8 rounded-t-full bg-white shadow-md"
              style={{ 
                transform: `translateX(-50%) rotate(${currentMood * 3.6}deg)`,
                transformOrigin: '50% 100%'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            
            {/* Centrum ringa */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-white/80 backdrop-blur">
              <motion.div
                key={currentMood}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="text-3xl sm:text-4xl font-medium text-gray-900"
              >
                {currentMood}%
              </motion.div>
              <div className="flex items-center mt-1">
                <span>{getMoodEmoji(currentMood)}</span>
                <span className="ml-1.5 text-xs sm:text-sm text-gray-500">
                  {getMoodLabel(currentMood)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mood Entry Form - ZINTEGROWANY */}
        <div className="w-full mb-4">
          <MoodEntryForm
            currentMood={currentMood}
            onSave={handleSaveMood}
            isLoading={isSaving}
            isSuccess={saveSuccess}
          />
        </div>

        {/* AI Insights Button */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <button
              onClick={() => setShowAISuggestions(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 text-blue-700 font-medium transition-all duration-200 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Zobacz AI Insights
            </button>
          </motion.div>
        )}

        {/* Historia nastrojów */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Ostatnie 7 dni</span>
            <span className="text-xs text-gray-500">
              {trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'} {Math.abs(trend)}%
            </span>
          </div>
          
          <div className="w-full h-12 flex items-center">
            <div className="w-full overflow-x-auto px-1">
              <div className="flex items-center justify-between min-w-max h-full space-x-1">
                {recentHistory.map((entry, index) => {
                  const isHovered = hovered?.id === entry.id
                  
                  return (
                    <div 
                      key={entry.id}
                      className="relative flex flex-col items-center flex-shrink-0"
                      onMouseEnter={() => setHovered({
                        id: entry.id,
                        content: `${entry.mood}% • ${formatDate(entry.timestamp)}${entry.note ? `\n${entry.note}` : ''}`
                      })}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full mb-1.5"
                        style={{ 
                          backgroundColor: getMoodColor(entry.mood),
                          boxShadow: isHovered ? `0 0 0 4px ${getMoodColor(entry.mood)}20` : 'none'
                        }}
                        initial={{ scale: 0.8, opacity: 0.7 }}
                        animate={{ 
                          scale: isHovered ? 1.3 : 1,
                          opacity: 1
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      />
                      
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: -15 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-xs px-2 py-1 rounded shadow-sm border border-gray-100 whitespace-normal max-w-[180px] text-center z-40"
                          >
                            {entry.mood}%
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Wizualizacja trendu */}
        <div className="w-full h-16 mb-2">
          <div className="w-full h-px bg-gray-200" />
          <div className="w-full h-[80%] flex items-end justify-between px-1">
            {recentHistory.map((entry, index) => {
              const height = `${(entry.mood / 100) * 50}px`;
              const isToday = index === recentHistory.length - 1
              
              return (
                <div key={entry.id} className="flex flex-col items-center w-5 flex-shrink-0">
                  <motion.div
                    className="w-1.5 rounded-t-full"
                    style={{ 
                      backgroundColor: getMoodColor(entry.mood),
                      height: height
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: height }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  />
                  {isToday && (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-white mt-1 shadow-sm"
                      style={{ backgroundColor: getMoodColor(entry.mood) }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Statystyki */}
        <div className="w-full grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-700">{streak}</div>
            <div className="text-blue-600">dni</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className={`font-semibold ${trend > 0 ? 'text-green-700' : trend < 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
            <div className="text-gray-600">trend</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-700">{consistency}%</div>
            <div className="text-purple-600">konsyst.</div>
          </div>
        </div>
      </div>

      {/* POPRAWIONY MODAL AI INSIGHTS - IDEALNIE W ŚRODKU */}
      <AnimatePresence>
        {showAISuggestions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAISuggestions(false)}
            >
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Brain className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">AI Analiza Twojego Nastroju</h3>
                      <p className="text-sm text-gray-600">Spersonalizowane insights bazujące na Twoich danych</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAISuggestions(false)}
                    className="p-2 hover:bg-white rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingAI ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                        </div>
                      </div>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                        </div>
                      ))}
                    </div>
                  ) : aiInsights ? (
                    <div className="space-y-6">
                      {/* Analiza */}
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-900 mb-2">Analiza Nastroju</p>
                            <p className="text-blue-800 leading-relaxed">{aiInsights.analysis}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sugestie */}
                      <div>
                        <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          Spersonalizowane Sugestie
                        </p>
                        <div className="space-y-3">
                          {aiInsights.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 leading-relaxed">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Wzorzec i Encouragement */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm font-semibold text-green-800 mb-1">🎯 Wykryty Wzorzec</p>
                          <p className="text-sm text-green-700">{aiInsights.pattern}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-sm font-semibold text-purple-800 mb-1">💫 Motywacja</p>
                          <p className="text-sm text-purple-700">{aiInsights.encouragement}</p>
                        </div>
                      </div>

                      {/* Special Tip */}
                      {aiInsights.specialTip && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-sm font-semibold text-orange-800 mb-1">💡 Specjalna Rada</p>
                          <p className="text-sm text-orange-700">{aiInsights.specialTip}</p>
                        </div>
                      )}

                      {/* Dane użytkownika */}
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-2">Twoje Statystyki:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="font-semibold text-blue-700">{streak}</div>
                            <div className="text-blue-600">dni streak</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="font-semibold text-green-700">{averageMood}%</div>
                            <div className="text-green-600">średnia</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <div className="font-semibold text-purple-700">{consistency}%</div>
                            <div className="text-purple-600">konsystencja</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className={`font-semibold ${trend > 0 ? 'text-green-700' : trend < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                              {trend > 0 ? '+' : ''}{trend}%
                            </div>
                            <div className="text-gray-600">trend</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                
                {/* Fixed Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                  <button
                    onClick={() => setShowAISuggestions(false)}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    Zamknij
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function formatDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return 'Dziś'
  if (date.toDateString() === yesterday.toDateString()) return 'Wcz.'
  
  return date.toLocaleDateString('pl-PL', { 
    day: 'numeric', 
    month: 'short' 
  }).replace(' ', '')
}

function getConsistencyDescription(consistency: number): string {
  if (consistency >= 80) return 'Wysoka stabilność'
  if (consistency >= 60) return 'Umiarkowana stabilność'
  if (consistency >= 40) return 'Zmienne emocje'
  return 'Duża zmienność'
}