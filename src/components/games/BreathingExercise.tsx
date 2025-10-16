'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings, ChevronRight, Zap, CheckCircle, Star, Heart, Share2 } from 'lucide-react'

interface BreathingExerciseProps {
  onComplete?: () => void
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest'
type AppState = 'intro' | 'breathing' | 'completion'

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ 
  onComplete 
}) => {
  const [appState, setAppState] = useState<AppState>('intro')
  const [isPlaying, setIsPlaying] = useState(false)
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [progress, setProgress] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [eleganceMode, setEleganceMode] = useState(true)
  const [totalTime, setTotalTime] = useState(0)

  const phaseDurations = {
    inhale: 4000,
    hold: 7000, 
    exhale: 8000,
    rest: 4000
  }

  const phaseData = {
    inhale: {
      label: 'Wdech',
      instruction: 'Powoli wdychaj powietrze',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
      duration: '4 sekundy'
    },
    hold: {
      label: 'Przytrzymaj',
      instruction: 'Zachowaj spokój i ciszę',
      color: 'text-purple-600', 
      gradient: 'from-purple-500 to-pink-500',
      duration: '7 sekund'
    },
    exhale: {
      label: 'Wydech',
      instruction: 'Uwolnij napięcie powoli',
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500',
      duration: '8 sekund'
    },
    rest: {
      label: 'Odpoczynek',
      instruction: 'Pozwól sobie na chwilę',
      color: 'text-gray-600',
      gradient: 'from-gray-400 to-gray-300',
      duration: '4 sekundy'
    }
  }

  useEffect(() => {
    let animationFrame: number
    let startTime: number
    let sessionStartTime: number

    const animate = () => {
      if (!isPlaying) return

      const now = Date.now()
      const elapsed = now - startTime
      const duration = phaseDurations[phase]
      const newProgress = Math.min((elapsed / duration) * 100, 100)

      setProgress(newProgress)

      if (newProgress >= 100) {
        const phases: BreathPhase[] = ['inhale', 'hold', 'exhale', 'rest']
        const currentIndex = phases.indexOf(phase)
        const nextIndex = (currentIndex + 1) % phases.length
        const nextPhase = phases[nextIndex]
        
        setPhase(nextPhase)
        setProgress(0)
        startTime = Date.now()
        
        if (nextPhase === 'inhale') {
          const newCycle = cycle + 1
          setCycle(newCycle)
          
          // Po 4 cyklach pokazujemy completion screen
          if (newCycle >= 4) {
            setIsPlaying(false)
            setTotalTime(Date.now() - sessionStartTime)
            setTimeout(() => {
              setAppState('completion')
              onComplete?.()
            }, 1000)
          }
        }
      }

      animationFrame = requestAnimationFrame(animate)
    }

    if (isPlaying) {
      startTime = Date.now()
      sessionStartTime = Date.now()
      animationFrame = requestAnimationFrame(animate)
    }

    return () => cancelAnimationFrame(animationFrame)
  }, [isPlaying, phase])

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying)
    if (appState === 'intro') {
      setAppState('breathing')
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setPhase('inhale')
    setProgress(0)
    setCycle(0)
    setAppState('breathing')
  }

  const handleNewSession = () => {
    setIsPlaying(false)
    setPhase('inhale')
    setProgress(0)
    setCycle(0)
    setAppState('breathing')
  }

  const handleBackToGames = () => {
    // Możesz dodać navigation do listy gier
    window.history.back()
  }

  const currentPhase = phaseData[phase]

  // Completion Screen
  if (appState === 'completion') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-50">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Sesja Zakończona!
              </h1>
              <p className="text-gray-600">
                Ukończyłeś 4 pełne cykle oddechowe
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600 mb-2">4</div>
                <div className="text-sm text-blue-700">Cykle</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-purple-50 border border-purple-100">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {Math.round(totalTime / 1000)}s
                </div>
                <div className="text-sm text-purple-700">Czas sesji</div>
              </div>
            </div>

            {/* Achievements */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                🎉 Osiągnięcia
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-green-900">Pierwsza sesja ukończona!</div>
                    <div className="text-sm text-green-700">4 cykle oddechowe</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-yellow-900">Technika 4-7-8-4</div>
                    <div className="text-sm text-yellow-700">Perfekcyjne wykonanie</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleNewSession}
                className="py-4 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <Play className="h-5 w-5" />
                Nowa Sesja
              </button>
              <button
                onClick={handleBackToGames}
                className="py-4 px-6 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Inne Gry
              </button>
            </div>

            {/* Motivation */}
            <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-center">
              <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">
                "Regularna praktyka oddechu to klucz do spokojnego umysłu"
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/50">
            <div className="text-center text-sm text-gray-600">
              ♡ Dziękujemy za czas poświęcony sobie
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Intro Screen
  if (appState === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-xl p-8 mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl text-white">🌬️</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Gotowy na oddech?
            </h2>
            <p className="text-gray-600">
              Technika 4-7-8-4 pomaga zredukować stres z odpowiednim czasem na odpoczynek między oddechami.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm">4s</span>
              </div>
              <div>
                <div className="font-medium text-blue-900">Wdech</div>
                <div className="text-sm text-blue-700">Powoli przez nos</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <span className="text-white text-sm">7s</span>
              </div>
              <div>
                <div className="font-medium text-purple-900">Przytrzymaj</div>
                <div className="text-sm text-purple-700">Zachowaj spokój</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <span className="text-white text-sm">8s</span>
              </div>
              <div>
                <div className="font-medium text-green-900">Wydech</div>
                <div className="text-sm text-green-700">Powoli przez usta</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
                <span className="text-white text-sm">4s</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Odpoczynek</div>
                <div className="text-sm text-gray-700">Czas na reset</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setAppState('breathing')}
            className="w-full py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            Rozpocznij sesję
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    )
  }

  // Main Breathing Screen
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        
        {/* Minimal Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Oddech</h1>
              <p className="text-gray-600 mt-1">Technika 4-7-8-4 • Cykl {cycle + 1}/4</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  soundEnabled 
                    ? 'border-blue-200 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Progress & Cycle Indicator */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    cycle >= num ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500">
              {cycle}/4 ukończonych
            </div>
          </div>

          {/* Central Breathing Visualization */}
          <div className="flex flex-col items-center justify-center mb-12">
            {/* Elegant Progress Ring */}
            <div className="relative mb-8">
              <div className="w-48 h-48 rounded-full border-2 border-gray-100 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent"
                  initial={false}
                  animate={{ rotate: progress * 3.6 }}
                  transition={{ duration: 0.1 }}
                />
                
                {/* Phase Indicator */}
                <motion.div
                  key={phase}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className={`text-4xl font-light mb-2 ${currentPhase.color}`}>
                    {Math.round(progress)}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {currentPhase.label}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Breathing Circle */}
            <motion.div
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentPhase.gradient} shadow-lg flex items-center justify-center`}
              animate={{
                scale: phase === 'inhale' ? [1, 1.2] : 
                       phase === 'hold' ? 1.2 :
                       phase === 'exhale' ? [1.2, 1] : 1,
                opacity: phase === 'rest' ? 0.8 : 1
              }}
              transition={{
                duration: phase === 'inhale' ? 4 : 
                         phase === 'exhale' ? 8 : 
                         phase === 'rest' ? 4 : 0.5,
                ease: phase === 'inhale' ? 'easeOut' : 
                      phase === 'exhale' ? 'easeIn' : 'linear'
              }}
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: phase === 'inhale' ? [1, 1.3] : 
                           phase === 'exhale' ? [1.3, 1] : 1,
                    opacity: phase === 'rest' ? 0.7 : 1
                  }}
                  transition={{
                    duration: phase === 'inhale' ? 4 : 
                             phase === 'exhale' ? 8 : 
                             phase === 'rest' ? 4 : 0.5
                  }}
                  className="text-white text-2xl"
                >
                  {phase === 'inhale' && '↑'}
                  {phase === 'hold' && '●'}
                  {phase === 'exhale' && '↓'}
                  {phase === 'rest' && '○'}
                </motion.div>
              </div>
            </motion.div>

            {/* Instruction */}
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <div className="text-lg font-medium text-gray-900 mb-2">
                {currentPhase.instruction}
              </div>
              <div className="text-sm text-gray-500">
                {currentPhase.duration} • {getPhaseDetail(phase)}
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              onClick={handleTogglePlay}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                isPlaying
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
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
                  {cycle === 0 ? 'Rozpocznij' : 'Kontynuuj'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subtle Footer */}
        <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Technika relaksacyjna • 4-7-8-4
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <span>♡ Cykl {cycle + 1}/4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPhaseDetail(phase: BreathPhase): string {
  switch (phase) {
    case 'inhale':
      return 'Wypełnij płuca'
    case 'hold':
      return 'Zachowaj spokój'
    case 'exhale':
      return 'Uwolnij wszystko'
    case 'rest':
      return 'Bądź obecny'
    default:
      return ''
  }
}