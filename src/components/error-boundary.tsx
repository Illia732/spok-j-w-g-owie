'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Target, Zap, X, Sparkles, Clock, RefreshCw, GraduationCap, Activity, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

// Cache dla komponentu
const componentCache = new Map()

// Prawdziwe wywołanie AI - używamy twojego działającego endpointu
const fetchAIAnalysis = async (userData: any) => {
  const cacheKey = JSON.stringify({
    mood: userData.currentMood,
    streak: userData.streak,
    trend: userData.trend,
    consistency: userData.consistency,
    level: userData.level,
    entriesCount: userData.moodEntries?.length || 0,
    notesCount: userData.userNotes?.length || 0
  })

  // Sprawdź cache
  if (componentCache.has(cacheKey)) {
    const cached = componentCache.get(cacheKey)
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log('💾 Using component cache')
      return cached.data
    }
  }

  try {
    const moodEntries = userData.moodEntries || []
    const userNotes = userData.userNotes || []
    
    // Przygotuj dane dla AI
    const moodDescription = getMoodDescription(userData.currentMood || 50)
    const recentMoods = moodEntries.slice(-5).map((e: any) => e.mood || 50)
    const averageRecentMood = recentMoods.length > 0 
      ? Math.round(recentMoods.reduce((a: number, b: number) => a + b, 0) / recentMoods.length)
      : 50

    // Stwórz prompt dla analizy nastroju
    const analysisPrompt = `Jesteś asystentem wellbeing w aplikacji "Spokój w Głowie" dla młodzieży.

DANE UŻYTKOWNIKA:
- Aktualny nastrój: ${userData.currentMood || 50}/100 (${moodDescription})
- Streak: ${userData.streak || 0} dni
- Poziom: ${userData.level || 1}
- Trend nastroju: ${userData.trend || 0}%
- Stabilność: ${userData.consistency || 50}%
- Średni nastrój: ${userData.averageMood || 50}%
- Liczba wpisów: ${moodEntries.length}
- Ostatnie nastroje: ${recentMoods.join(', ')}
- Średni z ostatnich 5 dni: ${averageRecentMood}%

PROSZĘ O ANALIZĘ W TYM FORMACIE:
{
"deepAnalysis": "2-3 zdania analizy obecnego nastroju i trendów",
"personalizedChallenge": "krótkie wyzwanie na dziś (max 8 słów)",
"scienceBackedTool": "konkretna technika wellbeing (max 6 słów)", 
"supportEcosystem": "strategia wsparcia (max 8 słów)",
"breakthroughInsight": "motywujący wgląd o nastoju",
"immediateBreakthrough": "natychmiastowa akcja (max 5 słów)"
}

Bądź:
- Konkretny i praktyczny
- Wspierający ale nie infantylny
- Dopasowany do nastroju i streak
- W języku polskim
- Max 200 znaków w każdym polu`

    console.log('🔍 Fetching AI analysis from chat endpoint...')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    // Używamy twojego działającego endpointu /api/ai-chat
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({ 
        message: analysisPrompt 
      })
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`AI API failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('📄 AI Response received:', data)

    // Parsujemy odpowiedź tekstową na obiekt
    const aiResponse = parseAIResponse(data.response, userData)
    const result = transformAIResponse(aiResponse, userData)
    
    // Zapisz w cache
    componentCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })
    
    return result
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('⏰ Request timeout')
    } else {
      console.error('AI fetch failed:', error)
    }
    return generateLocalAIAnalysis(userData)
  }
}

// Funkcja do parsowania odpowiedzi AI
const parseAIResponse = (responseText: string, userData: any) => {
  try {
    // Spróbuj znaleźć JSON w odpowiedzi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonString = jsonMatch[0]
      return JSON.parse(jsonString)
    }
    
    // Jeśli nie ma JSON, użyj fallback
    throw new Error('No JSON found in response')
  } catch (error) {
    console.log('❌ Could not parse AI response as JSON, using text analysis')
    // Analizujemy tekst i tworzymy strukturę na podstawie treści
    return createAnalysisFromText(responseText, userData)
  }
}

// Tworzy strukturę analizy z tekstowej odpowiedzi AI
const createAnalysisFromText = (text: string, userData: any) => {
  const sentences = text.split('.').filter(s => s.trim().length > 0)
  
  return {
    deepAnalysis: sentences[0] || "Analiza Twojego nastroju w trakcie...",
    personalizedChallenge: sentences[1] || "Zrób 3 głębokie oddechy",
    scienceBackedTool: "Technika oddechu 4-7-8",
    supportEcosystem: "Poranna rutyna z 3 oddechami", 
    breakthroughInsight: sentences[2] || "Małe kroki prowadzą do wielkich zmian",
    immediateBreakthrough: "Zrób pauzę na oddech",
    isRealAI: true
  }
}

// Transformacja odpowiedzi AI
const transformAIResponse = (aiData: any, userData: any) => {
  const safeUserData = {
    currentMood: userData.currentMood || 50,
    consistency: userData.consistency || 50,
    trend: userData.trend || 0,
    streak: userData.streak || 0
  }
  
  return {
    deepAnalysis: aiData.deepAnalysis || "AI analizuje Twój nastrój w kontekście codziennych doświadczeń...",
    sections: [
      {
        icon: <Target className="h-5 w-5" />,
        title: "🎯 Analiza Profilu",
        subtitle: "Twój unikalny profil emocjonalny", 
        content: aiData.deepAnalysis || "Przeanalizuj swój nastrój w kontekście codziennych doświadczeń.",
        color: "purple",
        duration: "Refleksja",
        priority: "high",
        type: "analysis"
      },
      {
        icon: <Zap className="h-5 w-5" />,
        title: "🚀 Wyzwanie",
        subtitle: "Dopasowane do Ciebie",
        content: aiData.personalizedChallenge || "Stwórz codzienny rytuał samoobserwacji przez 5 dni.",
        color: "blue", 
        duration: "5 dni",
        priority: "high",
        type: "challenge"
      },
      {
        icon: <GraduationCap className="h-5 w-5" />,
        title: "🧠 Technika",
        subtitle: "Naukowa metoda",
        content: aiData.scienceBackedTool || "Technika oddechu 4-7-8: 4s wdech, 7s pauza, 8s wydech.",
        color: "green",
        duration: "5-10 min", 
        priority: "high",
        type: "tool"
      },
      {
        icon: <Activity className="h-5 w-5" />,
        title: "💫 Strategia",
        subtitle: "Twój ekosystem wsparcia",
        content: aiData.supportEcosystem || "Poranny rytuał: 3 głębokie oddechy + intencja na dzień.",
        color: "orange",
        duration: "Codziennie",
        priority: "medium",
        type: "strategy"
      },
      {
        icon: <Lightbulb className="h-5 w-5" />,
        title: "🔍 Wgląd", 
        subtitle: "Odkrycie o sobie",
        content: aiData.breakthroughInsight || "Regularność w obserwacji nastroju sama w sobie jest terapią.",
        color: "pink",
        duration: "Przemyślenia",
        priority: "medium",
        type: "insight"
      },
      {
        icon: <Sparkles className="h-5 w-5" />,
        title: "⚡ Akcja",
        subtitle: "Zacznij teraz",
        content: aiData.immediateBreakthrough || "Zrób 2-minutową pauzę na świadomy oddech.",
        color: "red",
        duration: "15 min",
        priority: "high", 
        type: "action"
      }
    ],
    isRealAI: aiData.isRealAI !== false,
    timestamp: new Date().toISOString(),
    profileType: getProfileType(
      safeUserData.currentMood, 
      safeUserData.consistency, 
      safeUserData.trend, 
      safeUserData.streak
    )
  }
}

// Lokalna generacja tylko jako fallback
const generateLocalAIAnalysis = (userData: any) => {
  const currentMood = userData.currentMood || 50
  const streak = userData.streak || 0
  const trend = userData.trend || 0
  const consistency = userData.consistency || 50
  
  return {
    deepAnalysis: `AI analizuje Twój nastrój ${currentMood}% w kontekście ${streak}-dniowej praktyki. Trend ${trend}% i stabilność ${consistency}% tworzą unikalny wzorzec emocjonalny.`,
    personalizedChallenge: `Przez 3-5 dni praktykuj uważną obserwację swoich reakcji emocjonalnych w kluczowych momentach dnia.`,
    scienceBackedTool: "Technika oddechu 4-7-8: 4s wdech, 7s pauza, 8s wydech. Reguluje system nerwowy.",
    supportEcosystem: "Stwórz codzienny rytuał samoobserwacji wykorzystujący Twoje obecne nawyki.",
    breakthroughInsight: "Twoja regularność w zapisywaniu nastroju sama w sobie jest potężnym narzędziem samopoznania.",
    immediateBreakthrough: "Zrób 2-minutową pauzę na świadomy oddech i zauważ jak wpływa na Twój nastrój.",
    isRealAI: false,
    timestamp: new Date().toISOString(),
    sections: [
      {
        icon: <Target className="h-5 w-5" />,
        title: "🎯 Analiza Profilu",
        subtitle: "Twój unikalny profil emocjonalny", 
        content: `AI analizuje Twój nastrój ${currentMood}% w kontekście ${streak}-dniowej praktyki.`,
        color: "purple",
        duration: "Refleksja",
        priority: "high",
        type: "analysis"
      },
      {
        icon: <Zap className="h-5 w-5" />,
        title: "🚀 Wyzwanie",
        subtitle: "Dopasowane do Ciebie",
        content: "Przez 3-5 dni praktykuj uważną obserwację swoich reakcji emocjonalnych.",
        color: "blue", 
        duration: "5 dni",
        priority: "high",
        type: "challenge"
      },
      {
        icon: <GraduationCap className="h-5 w-5" />,
        title: "🧠 Technika",
        subtitle: "Naukowa metoda",
        content: "Technika oddechu 4-7-8: 4s wdech, 7s pauza, 8s wydech.",
        color: "green",
        duration: "5-10 min", 
        priority: "high",
        type: "tool"
      },
      {
        icon: <Activity className="h-5 w-5" />,
        title: "💫 Strategia",
        subtitle: "Twój ekosystem wsparcia",
        content: "Stwórz codzienny rytuał samoobserwacji wykorzystujący Twoje obecne nawyki.",
        color: "orange",
        duration: "Codziennie",
        priority: "medium",
        type: "strategy"
      },
      {
        icon: <Lightbulb className="h-5 w-5" />,
        title: "🔍 Wgląd", 
        subtitle: "Odkrycie o sobie",
        content: "Twoja regularność w zapisywaniu nastroju sama w sobie jest potężnym narzędziem samopoznania.",
        color: "pink",
        duration: "Przemyślenia",
        priority: "medium",
        type: "insight"
      },
      {
        icon: <Sparkles className="h-5 w-5" />,
        title: "⚡ Akcja",
        subtitle: "Zacznij teraz",
        content: "Zrób 2-minutową pauzę na świadomy oddech i zauważ jak wpływa na Twój nastrój.",
        color: "red",
        duration: "15 min",
        priority: "high", 
        type: "action"
      }
    ],
    profileType: getProfileType(currentMood, consistency, trend, streak)
  }
}

function getMoodDescription(mood: number): string {
  if (mood <= 20) return 'bardzo niski'
  if (mood <= 40) return 'niski'
  if (mood <= 60) return 'neutralny'
  if (mood <= 80) return 'wysoki'
  return 'bardzo wysoki'
}

function getProfileType(mood: number, consistency: number, trend: number, streak: number): string {
  if (consistency > 70 && trend > 0) return 'STABILNY WZROST'
  if (consistency > 70 && trend < 0) return 'STABILNA REFLEKSJA' 
  if (consistency < 50 && trend > 0) return 'DYNAMICZNY WZROST'
  if (consistency < 50 && trend < 0) return 'WRAŻLIWOŚĆ'
  if (streak > 7) return 'ZAAWANSOWANY'
  return 'ŚWIADOMY'
}

interface AIMoodInsightsProps {
  currentMood?: number
  moodEntries?: any[]
  streak?: number
  trend?: number
  consistency?: number
  averageMood?: number
  level?: number
  onBack: () => void
  userNotes?: any[]
}

export const AIMoodInsights = ({
  currentMood = 50,
  moodEntries = [],
  streak = 0,
  trend = 0,
  consistency = 50,
  averageMood = 50,
  level = 1,
  onBack,
  userNotes = []
}: AIMoodInsightsProps) => {
  const [aiData, setAiData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(true)
  const requestInProgress = useRef(false)

  // Stabilizuj dane użytkownika
  const userData = useMemo(() => ({
    currentMood,
    moodEntries,
    streak,
    trend,
    consistency,
    averageMood,
    level,
    userNotes
  }), [currentMood, streak, trend, consistency, level, 
      moodEntries.length,
      userNotes.length
  ])

  const loadAIAnalysis = useCallback(async () => {
    if (requestInProgress.current) {
      console.log('🛑 Request already in progress, skipping...')
      return
    }

    requestInProgress.current = true
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🚀 Starting AI analysis...')
      const analysis = await fetchAIAnalysis(userData)
      
      if (isMounted.current) {
        setAiData(analysis)
        console.log('✅ AI analysis completed')
      }
    } catch (err) {
      console.error('❌ AI analysis failed:', err)
      if (isMounted.current) {
        setError('Nie udało się załadować analizy AI')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
      requestInProgress.current = false
    }
  }, [userData])

  useEffect(() => {
    isMounted.current = true
    
    // Uruchom tylko raz przy montowaniu
    loadAIAnalysis()

    return () => {
      isMounted.current = false
    }
  }, [loadAIAnalysis])

  const getColorClasses = (color: string, type = 'card') => {
    const colorMap: any = {
      purple: {
        card: 'bg-purple-50/80 border-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-900',
        badge: 'bg-purple-100 text-purple-700'
      },
      blue: {
        card: 'bg-blue-50/80 border-blue-200', 
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-700'
      },
      green: {
        card: 'bg-green-50/80 border-green-200',
        icon: 'bg-green-100 text-green-600',
        text: 'text-green-900',
        badge: 'bg-green-100 text-green-700'
      },
      orange: {
        card: 'bg-orange-50/80 border-orange-200',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-900',
        badge: 'bg-orange-100 text-orange-700'
      },
      pink: {
        card: 'bg-pink-50/80 border-pink-200',
        icon: 'bg-pink-100 text-pink-600',
        text: 'text-pink-900',
        badge: 'bg-pink-100 text-pink-700'
      },
      red: {
        card: 'bg-red-50/80 border-red-200',
        icon: 'bg-red-100 text-red-600',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-700'
      }
    }
    return colorMap[color]?.[type] || colorMap.blue[type]
  }

  const handleRefresh = async () => {
    if (requestInProgress.current) {
      console.log('🛑 Request in progress, please wait...')
      return
    }

    // Wyczyść cache dla obecnych parametrów
    const cacheKey = JSON.stringify({
      mood: currentMood,
      streak: streak,
      trend: trend,
      consistency: consistency,
      level: level,
      entriesCount: moodEntries.length,
      notesCount: userNotes.length
    })
    componentCache.delete(cacheKey)

    setIsLoading(true)
    setError(null)
    
    await loadAIAnalysis()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Spokój AI</h2>
              <p className="text-xs text-gray-600">Personalizowana analiza Twojego nastroju</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiData?.isRealAI && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                <Sparkles className="h-3 w-3" />
                AI Premium
              </div>
            )}
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full"
              />
              <div className="text-center">
                <p className="font-semibold text-gray-900">AI analizuje Twój nastrój...</p>
                <p className="text-sm text-gray-600 mt-1">To potrwa tylko chwilę</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="text-red-500 text-lg">❌</div>
              <p className="text-gray-900">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                Spróbuj ponownie
              </Button>
            </div>
          ) : aiData ? (
            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <CompactStatCard icon="😊" value={currentMood} label="Nastrój" />
                <CompactStatCard icon="🔥" value={streak} label="Streak" />
                <CompactStatCard icon="📈" value={`${trend > 0 ? '+' : ''}${trend}%`} label="Trend" />
                <CompactStatCard icon="💪" value={`${consistency}%`} label="Stabilność" />
              </div>

              {/* Profile Badge */}
              {aiData.profileType && (
                <div className="flex justify-center">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                    👤 Profil: {aiData.profileType}
                  </div>
                </div>
              )}

              {/* Główna analiza */}
              <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-xs border border-blue-200">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">Analiza AI</h3>
                      <p className="text-gray-700 text-sm leading-relaxed">{aiData.deepAnalysis}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(aiData.timestamp).toLocaleTimeString('pl-PL')}
                        </div>
                        {aiData.isRealAI && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Premium
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sekcje AI */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiData.sections?.map((section: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "border-0 shadow-xs hover:shadow-sm transition-all duration-200 h-full",
                      getColorClasses(section.color, 'card')
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1.5 rounded-lg",
                              getColorClasses(section.color, 'icon')
                            )}>
                              {section.icon}
                            </div>
                            <div>
                              <h4 className={cn(
                                "font-semibold text-sm",
                                getColorClasses(section.color, 'text')
                              )}>
                                {section.title}
                              </h4>
                              <p className="text-xs text-gray-600">{section.subtitle}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                            getColorClasses(section.color, 'badge')
                          )}>
                            {section.duration}
                          </span>
                        </div>

                        <p className={cn(
                          "text-sm leading-relaxed",
                          getColorClasses(section.color, 'text')
                        )}>
                          {section.content}
                        </p>

                        {section.priority === 'high' && (
                          <div className="flex items-center gap-1 mt-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-red-600 font-medium">Wysoki priorytet</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 border-gray-300"
            >
              Wróć
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Ładowanie...' : 'Nowa Analiza'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function CompactStatCard({ icon, value, label }: { icon: string, value: string | number, label: string }) {
  return (
    <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-xs">
      <div className="text-lg mb-1">{icon}</div>
      <div className="font-bold text-gray-900 text-sm">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  )
}