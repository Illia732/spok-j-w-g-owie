'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, Brain, Zap, Target, Heart, Smartphone } from 'lucide-react'

interface MoodEntry {
  id: string
  mood: number
  note?: string
  timestamp: Date
  date: string
}

interface ModernMoodPickerProps {
  value: number
  onValueChange?: (value: number) => void
  moodEntries?: MoodEntry[]
  streak?: number
  trend?: number
  consistency?: number
  averageMood?: number
  level?: number
  onSaveMood?: (mood: number) => void
  onAddNote?: () => void
  todayEntry?: MoodEntry | null
}

interface AIMoodInsights {
  analysis: string
  suggestions: string[]
  pattern: string
  encouragement: string
  specialTip: string
}

// System kolorów
const getMoodColor = (value: number) => {
  if (value <= 20) return 'from-gray-400 to-gray-500'
  if (value <= 40) return 'from-blue-400 to-blue-500'
  if (value <= 60) return 'from-green-400 to-green-500'
  if (value <= 80) return 'from-purple-400 to-purple-500'
  return 'from-rose-400 to-rose-500'
}

const getMoodGradient = (value: number) => {
  if (value <= 20) return 'bg-gradient-to-br from-gray-100 to-gray-200'
  if (value <= 40) return 'bg-gradient-to-br from-blue-50 to-blue-100'
  if (value <= 60) return 'bg-gradient-to-br from-green-50 to-green-100'
  if (value <= 80) return 'bg-gradient-to-br from-purple-50 to-purple-100'
  return 'bg-gradient-to-br from-rose-50 to-rose-100'
}

const MoodEmoji = ({ mood, size = "text-3xl" }: { mood: number; size?: string }) => {
  if (mood <= 20) return <span className={size}>😔</span>
  if (mood <= 40) return <span className={size}>😐</span>
  if (mood <= 60) return <span className={size}>🙂</span>
  if (mood <= 80) return <span className={size}>😊</span>
  return <span className={size}>🤩</span>
}

const getMoodLabel = (mood: number): string => {
  if (mood <= 20) return 'B. niski'
  if (mood <= 40) return 'Niski'
  if (mood <= 60) return 'Neutralny'
  if (mood <= 80) return 'Wysoki'
  return 'B. wysoki'
}

const getMoodDescription = (mood: number): string => {
  if (mood <= 20) return 'Potrzebujesz wsparcia'
  if (mood <= 40) return 'Czas na opiekę nad sobą'
  if (mood <= 60) return 'Równowaga i spokój'
  if (mood <= 80) return 'Energia i radość'
  return 'Pełnia szczęścia'
}

export const ModernMoodPicker: React.FC<ModernMoodPickerProps> = ({
  value,
  onValueChange,
  moodEntries = [],
  streak = 0,
  trend = 0,
  consistency = 0,
  averageMood = 50,
  level = 1,
  onSaveMood,
  onAddNote,
  todayEntry
}) => {
  const [currentMood, setCurrentMood] = useState(value)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIMoodInsights | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const moodLevels = [20, 40, 60, 80, 100]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setCurrentMood(value)
  }, [value])

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood)
    setCurrentMood(mood)
    onValueChange?.(mood)
  }

  const handleSave = () => {
    if (selectedMood !== null) {
      onSaveMood?.(selectedMood)
      setSelectedMood(null)
    }
  }

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

      if (!response.ok) throw new Error('AI unavailable')
      
      const data = await response.json()
      setAiInsights(data)
      
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      setAiInsights({
        analysis: "Analizuję Twój nastrój w kontekście codziennych doświadczeń...",
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Główny kontener - ZWIĘKSZONE PADDINGI */}
      <div className={cn(
        "rounded-3xl p-6 sm:p-8 md:p-10 backdrop-blur-sm border border-white/20 shadow-2xl",
        getMoodGradient(currentMood)
      )}>
        {/* Nagłówek - ZWIĘKSZONE MARGINESY */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-800 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {todayEntry ? 'Twój dzisiejszy nastrój' : 'Jak się dziś czujesz?'}
          </motion.h2>
          <motion.p 
            className="text-gray-600 text-base sm:text-lg md:text-xl font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {getMoodDescription(currentMood)}
          </motion.p>
        </div>

        {/* Mood Selector - POPRAWIONE ODSTĘPY */}
        <div className="mb-8 sm:mb-12">
          {/* Mood buttons - WIĘKSZE ODSTĘPY */}
          <div className="flex sm:grid sm:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-10 overflow-x-auto pb-3 sm:pb-0 hide-scrollbar">
            {moodLevels.map((mood) => (
              <motion.button
                key={mood}
                className={cn(
                  "relative group rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 transform hover:scale-105 flex-shrink-0",
                  "border-2 backdrop-blur-sm min-w-[80px] sm:min-w-0 flex flex-col items-center justify-between",
                  selectedMood === mood || currentMood === mood
                    ? `border-white shadow-xl sm:shadow-2xl scale-105 ${getMoodGradient(mood)}`
                    : `border-transparent ${getMoodGradient(mood)} opacity-70 hover:opacity-100`
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMoodSelect(mood)}
              >
                {/* Emoji - WIĘKSZE MARGINESY */}
                <div className="text-center mb-3 sm:mb-4">
                  <MoodEmoji 
                    mood={mood} 
                    size={isMobile ? "text-3xl" : "text-4xl sm:text-5xl"} 
                  />
                </div>
                
                {/* Label i procent - OPTYMALNE ODSTĘPY */}
                <div className="text-center space-y-2 w-full">
                  <div className={cn(
                    "text-sm sm:text-base font-semibold transition-colors",
                    selectedMood === mood || currentMood === mood 
                      ? "text-gray-900" 
                      : "text-gray-700"
                  )}>
                    {getMoodLabel(mood)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 bg-white/60 rounded-full px-3 py-1.5 backdrop-blur-sm border border-white/30 font-medium">
                    {mood}%
                  </div>
                </div>

                {/* Active Indicator */}
                {(selectedMood === mood || currentMood === mood) && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-lg border border-gray-200"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Current Mood Display - ZWIĘKSZONE ODSTĘPY */}
          <motion.div 
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-4 sm:gap-6 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm border border-white/30 shadow-xl">
              <MoodEmoji 
                mood={currentMood} 
                size={isMobile ? "text-3xl" : "text-4xl"} 
              />
              <div className="text-left space-y-1">
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {getMoodLabel(currentMood)}
                </div>
                <div className="text-sm sm:text-base text-gray-700 flex items-center gap-3">
                  <span className="bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 font-medium">
                    {currentMood}%
                  </span>
                  <span className="text-gray-500">•</span>
                  <span>{getMoodDescription(currentMood)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons - WIĘKSZE PRZYCISKI I ODSTĘPY */}
          {!todayEntry && (
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleSave}
                disabled={selectedMood === null}
                className={cn(
                  "px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105",
                  "shadow-xl flex items-center justify-center gap-3 text-base sm:text-lg min-h-[60px]",
                  selectedMood === null 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : `bg-gradient-to-r ${getMoodColor(currentMood)} hover:shadow-2xl`
                )}
              >
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                {isMobile ? 'Zapisz' : 'Zapisz nastrój'}
              </button>
              
              <button
                onClick={onAddNote}
                className="px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-2xl font-semibold border-2 border-gray-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:border-gray-400 flex items-center justify-center gap-3 text-base sm:text-lg min-h-[60px] bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                {isMobile ? 'Notatka' : 'Dodaj notatkę'}
              </button>

              <button
                onClick={() => {
                  setShowAISuggestions(true)
                  fetchAIInsights()
                }}
                className="px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-2xl font-semibold bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-blue-700 transition-all duration-300 transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 text-base sm:text-lg min-h-[60px]"
              >
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                {isMobile ? 'AI' : 'AI Insights'}
              </button>
            </motion.div>
          )}
        </div>

        {/* Quick Stats - WIĘKSZE KARTY I ODSTĘPY */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">{streak}</div>
            <div className="text-sm text-gray-700 font-medium">dni streak</div>
          </div>
          <div className="text-center p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">{averageMood}%</div>
            <div className="text-sm text-gray-700 font-medium">średnia</div>
          </div>
          <div className="text-center p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg">
            <div className={`text-xl sm:text-2xl font-bold mb-2 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
            <div className="text-sm text-gray-700 font-medium">trend</div>
          </div>
          <div className="text-center p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-2">{consistency}%</div>
            <div className="text-sm text-gray-700 font-medium">konsystencja</div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights Modal - POPRAWIONE ODSTĘPY */}
      <AnimatePresence>
        {showAISuggestions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowAISuggestions(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-200"
            >
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl">AI Analiza Twojego Nastroju</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Spersonalizowane insights</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAISuggestions(false)}
                  className="p-3 hover:bg-white rounded-xl transition-colors"
                >
                  <span className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-600">×</span>
                </button>
              </div>
              
              <div className="p-6 sm:p-8 max-h-[65vh] sm:max-h-[60vh] overflow-y-auto">
                {loadingAI ? (
                  <div className="space-y-6 text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-600 text-base sm:text-lg">AI analizuje Twój nastrój...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-6 sm:space-y-8">
                    {/* Analiza */}
                    <div className="p-5 sm:p-6 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <Target className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-3">
                          <p className="font-bold text-blue-900 text-lg sm:text-xl">Analiza Nastroju</p>
                          <p className="text-blue-800 leading-relaxed text-base sm:text-lg">{aiInsights.analysis}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sugestie */}
                    <div className="space-y-4">
                      <p className="font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-3">
                        <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
                        Spersonalizowane Sugestie
                      </p>
                      <div className="space-y-4">
                        {aiInsights.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 leading-relaxed text-base sm:text-lg flex-1">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Wzorzec i Encouragement */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="p-4 sm:p-5 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-sm sm:text-base font-bold text-green-800 mb-2">🎯 Wykryty Wzorzec</p>
                        <p className="text-sm sm:text-base text-green-700">{aiInsights.pattern}</p>
                      </div>
                      <div className="p-4 sm:p-5 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-sm sm:text-base font-bold text-purple-800 mb-2">💫 Motywacja</p>
                        <p className="text-sm sm:text-base text-purple-700">{aiInsights.encouragement}</p>
                      </div>
                    </div>

                    {/* Special Tip */}
                    {aiInsights.specialTip && (
                      <div className="p-4 sm:p-5 bg-orange-50 rounded-xl border border-orange-100">
                        <p className="text-sm sm:text-base font-bold text-orange-800 mb-2">💡 Specjalna Rada</p>
                        <p className="text-sm sm:text-base text-orange-700">{aiInsights.specialTip}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              
              <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="w-full py-4 sm:py-5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold text-lg shadow-lg"
                >
                  Zamknij
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CSS dla ukrycia scrollbara na mobile */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

function getConsistencyDescription(consistency: number): string {
  if (consistency >= 80) return 'Wysoka stabilność'
  if (consistency >= 60) return 'Umiarkowana stabilność'
  if (consistency >= 40) return 'Zmienne emocje'
  return 'Duża zmienność'
}