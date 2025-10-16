'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Home, 
  Brain, Waves, Heart, Zap, Settings, BarChart3,
  Camera, Mic, Eye, Clock, Target
} from 'lucide-react'

// Nasze zaawansowane hooki
import { useBinauralBeats } from './hooks/useBinauralBeats'
import { useBreathAnalyzer } from './hooks/useBreathAnalyzer'
import { usePulseDetection } from './hooks/usePulseDetection'
import { useMeditationAI } from './hooks/useMeditationAI'

// Komponenty
import NeuroVisualizer from './components/NeuroVisualizer'
import BreathGuide from './components/BreathGuide'
import BioFeedback from './components/BioFeedback'
import ProgressTracker from './components/ProgressTracker'

type GameState = 'intro' | 'calibration' | 'meditation' | 'results'
type MeditationMode = 'focus' | 'relax' | 'sleep' | 'energy'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface SessionData {
  id: string
  mode: MeditationMode
  duration: number
  focusScore: number
  calmScore: number
  coherence: number
  heartRateVariability: number
  breathConsistency: number
  timestamp: Date
}

interface RealTimeMetrics {
  attention: number
  relaxation: number
  coherence: number
  heartRate: number
  breathRate: number
}

export const MindSyncGame: React.FC = () => {
  const router = useRouter()
  
  // Stan gry
  const [gameState, setGameState] = useState<GameState>('intro')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMode, setCurrentMode] = useState<MeditationMode>('focus')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [sessionTime, setSessionTime] = useState(0)
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    attention: 50,
    relaxation: 50,
    coherence: 50,
    heartRate: 70,
    breathRate: 16
  })

  // Zaawansowane hooki
  const binauralBeats = useBinauralBeats()
  const breathAnalyzer = useBreathAnalyzer()
  const pulseDetection = usePulseDetection()
  const meditationAI = useMeditationAI()

  const sessionTimerRef = useRef<NodeJS.Timeout>()
  const metricsUpdateRef = useRef<NodeJS.Timeout>()

  const meditationModes = [
    {
      id: 'focus' as MeditationMode,
      name: 'Koncentracja',
      description: 'Wzmacnia skupienie i uwagę mentalną',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      baseFrequency: 40,
      duration: 600
    },
    {
      id: 'relax' as MeditationMode,
      name: 'Głęboki Relaks',
      description: 'Redukcja stresu i napięcia mięśniowego',
      icon: Waves,
      color: 'from-green-500 to-emerald-500',
      baseFrequency: 10,
      duration: 900
    },
    {
      id: 'sleep' as MeditationMode,
      name: 'Sen i Regeneracja',
      description: 'Przygotowanie organizmu do głębokiego snu',
      icon: '😴',
      color: 'from-purple-500 to-indigo-500',
      baseFrequency: 4,
      duration: 1200
    },
    {
      id: 'energy' as MeditationMode,
      name: 'Energia i Witalność',
      description: 'Pobudzenie umysłu i zwiększenie witalności',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      baseFrequency: 25,
      duration: 480
    }
  ]

  const difficulties = [
    {
      id: 'beginner' as Difficulty,
      name: 'Początkujący',
      description: 'Łatwe wyzwania, więcej wskazówek',
      duration: 300
    },
    {
      id: 'intermediate' as Difficulty,
      name: 'Średniozaawansowany',
      description: 'Zbalansowane wyzwania',
      duration: 600
    },
    {
      id: 'advanced' as Difficulty,
      name: 'Zaawansowany',
      description: 'Kompleksowe wyzwania, mniej wskazówek',
      duration: 900
    }
  ]

  const handleStartSession = async () => {
    setGameState('calibration')
    
    // Inicjalizacja wszystkich systemów
    await Promise.all([
      binauralBeats.initialize(),
      breathAnalyzer.initialize(),
      pulseDetection.initialize()
    ])
    
    // Kalibracja
    setTimeout(() => {
      setGameState('meditation')
      setIsPlaying(true)
      startSessionTimer()
      startMetricsUpdate()
      
      // Rozpocznij dźwięki binauralne
      const modeConfig = meditationModes.find(m => m.id === currentMode)
      if (modeConfig) {
        binauralBeats.start(modeConfig.baseFrequency)
      }
    }, 5000)
  }

  const startSessionTimer = () => {
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
  }

  const startMetricsUpdate = () => {
    metricsUpdateRef.current = setInterval(() => {
      // Symulacja danych z czujników (w prawdziwej implementacji byłyby to rzeczywiste dane)
      setRealTimeMetrics(prev => ({
        attention: Math.min(100, prev.attention + (Math.random() - 0.5) * 10),
        relaxation: Math.min(100, prev.relaxation + (Math.random() - 0.5) * 8),
        coherence: Math.min(100, prev.coherence + (Math.random() - 0.5) * 6),
        heartRate: 70 + Math.sin(Date.now() / 10000) * 5,
        breathRate: 16 + Math.cos(Date.now() / 15000) * 2
      }))
    }, 1000)
  }

  const handleEndSession = () => {
    setIsPlaying(false)
    setGameState('results')
    
    // Czyszczenie
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    if (metricsUpdateRef.current) clearInterval(metricsUpdateRef.current)
    
    binauralBeats.stop()
    breathAnalyzer.cleanup()
    pulseDetection.cleanup()
  }

  const handleBackToGames = () => {
    router.push('/games')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      if (metricsUpdateRef.current) clearInterval(metricsUpdateRef.current)
      binauralBeats.cleanup()
      breathAnalyzer.cleanup()
      pulseDetection.cleanup()
    }
  }, [])

  const currentModeConfig = meditationModes.find(m => m.id === currentMode)
  const currentDifficultyConfig = difficulties.find(d => d.id === difficulty)

  // Intro Screen
  if (gameState === 'intro') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-4xl w-full bg-white rounded-2xl border border-gray-100 shadow-xl p-8 mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              MindSync
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Zaawansowana platforma medytacji neurofeedback w przeglądarce. 
              Wykorzystuje dźwięki binauralne, analizę oddechu i biometrię w czasie rzeczywistym.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Wybierz tryb medytacji:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meditationModes.map((mode) => {
                const IconComponent = mode.icon
                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => setCurrentMode(mode.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      currentMode === mode.id
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${mode.color} rounded-xl flex items-center justify-center`}>
                        {typeof IconComponent === 'string' ? (
                          <span className="text-white text-lg">{IconComponent}</span>
                        ) : (
                          <IconComponent className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg">{mode.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{mode.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Częstotliwość: {mode.baseFrequency}Hz • Czas: {Math.floor(mode.duration / 60)}min
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Poziom trudności:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficulties.map((diff) => (
                <motion.button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                    difficulty === diff.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="font-semibold text-gray-900">{diff.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{diff.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {Math.floor(diff.duration / 60)} minut
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tech Features */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              🚀 Zaawansowane Technologie
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">🎵</div>
                <div className="text-sm font-medium text-blue-900">Dźwięki Binauralne</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🌬️</div>
                <div className="text-sm font-medium text-purple-900">Analiza Oddechu</div>
              </div>
              <div>
                <div className="text-2xl mb-2">💓</div>
                <div className="text-sm font-medium text-pink-900">Biofeedback</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🧠</div>
                <div className="text-sm font-medium text-indigo-900">Neuro-Wizualizacja</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              onClick={handleStartSession}
              className="py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="h-5 w-5" />
              Rozpocznij Sesję
            </motion.button>

            <button
              onClick={handleBackToGames}
              className="py-4 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Wróć do Gier
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Calibration Screen
  if (gameState === 'calibration') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Settings className="h-10 w-10 text-white animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Kalibracja Systemu</h2>
          <p className="text-gray-600 mb-6">Przygotowujemy zaawansowane sensory...</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <Mic className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-blue-700">Mikrofon</div>
              <div className="text-xs text-blue-600">Analiza oddechu</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
              <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-purple-700">Kamera</div>
              <div className="text-xs text-purple-600">Detekcja pulsu</div>
            </div>
            <div className="p-4 rounded-xl bg-pink-50 border border-pink-100">
              <Waves className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <div className="text-sm text-pink-700">Audio</div>
              <div className="text-xs text-pink-600">Dźwięki binauralne</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Main Meditation Screen
  if (gameState === 'meditation') {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-900">MindSync</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{Math.floor(sessionTime / 60)}:{String(sessionTime % 60).padStart(2, '0')}</span>
                  <span>•</span>
                  <span>{currentModeConfig?.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span>Uwaga: {Math.round(realTimeMetrics.attention)}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-red-600" />
                  <span>Relaks: {Math.round(realTimeMetrics.relaxation)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Left Panel - Visualization */}
            <div className="lg:w-2/3 p-6 border-r border-gray-50">
              <NeuroVisualizer 
                metrics={realTimeMetrics}
                mode={currentMode}
                isPlaying={isPlaying}
              />
              
              {/* Breath Guide */}
              <div className="mt-6">
                <BreathGuide 
                  mode={currentMode}
                  difficulty={difficulty}
                  isPlaying={isPlaying}
                />
              </div>
            </div>

            {/* Right Panel - Controls and Biofeedback */}
            <div className="lg:w-1/3 p-6 bg-gray-50/50">
              <div className="space-y-6">
                {/* Biofeedback */}
                <BioFeedback metrics={realTimeMetrics} />
                
                {/* Progress */}
                <ProgressTracker 
                  sessionTime={sessionTime}
                  mode={currentMode}
                  difficulty={difficulty}
                />
                
                {/* Controls */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        isPlaying
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pauza
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Wznów
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleEndSession}
                      className="py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Zakończ
                    </button>
                  </div>

                  <button
                    onClick={handleBackToGames}
                    className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Lista Gier
                  </button>
                </div>

                {/* Sound Control */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Dźwięk</span>
                  <button
                    onClick={() => binauralBeats.toggle()}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      binauralBeats.isEnabled
                        ? 'border-blue-200 bg-blue-50 text-blue-600' 
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {binauralBeats.isEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Results Screen
  if (gameState === 'results') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-8 pt-8 pb-6 border-b border-gray-50">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <BarChart3 className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Sesja Zakończona!
              </h1>
              <p className="text-gray-600">
                Doskonała praca nad swoim umysłem
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.round(realTimeMetrics.attention)}%
                </div>
                <div className="text-sm text-blue-700">Uwaga</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {Math.round(realTimeMetrics.relaxation)}%
                </div>
                <div className="text-sm text-green-700">Relaks</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.round(realTimeMetrics.coherence)}%
                </div>
                <div className="text-sm text-purple-700">Spójność</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {Math.floor(sessionTime / 60)}m
                </div>
                <div className="text-sm text-orange-700">Czas</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleStartSession}
                className="py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="h-5 w-5" />
                Nowa Sesja
              </button>
              <button
                onClick={handleBackToGames}
                className="py-4 px-6 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                Wróć do Gier
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}