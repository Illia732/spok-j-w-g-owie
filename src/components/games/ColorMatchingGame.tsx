'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Palette, Target, Sparkles, Home, Award, Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'

type GameState = 'intro' | 'playing' | 'completion'
type Difficulty = 'zen' | 'chill' | 'flow'

interface Tile {
  id: string
  color: string
  isFlipped: boolean
  isMatched: boolean
}

interface ColorMatchingGameProps {
  onComplete?: (difficulty: Difficulty) => void
}

export const ColorMatchingGame: React.FC<ColorMatchingGameProps> = ({ onComplete }) => {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('intro')
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('chill')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [flippedTiles, setFlippedTiles] = useState<string[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showXPReward, setShowXPReward] = useState(false)

  const timerRef = useRef<NodeJS.Timeout>()

  const difficultyConfig = {
    zen: {
      name: 'Zen',
      description: 'Relaks bez limitu czasu',
      time: 0,
      pairs: 4,
      colors: ['#f87171', '#60a5fa', '#34d399', '#fbbf24'],
      xp: 1
    },
    chill: {
      name: 'Chill', 
      description: 'Relaks z lekkim wyzwaniem',
      time: 120,
      pairs: 6,
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
      xp: 3
    },
    flow: {
      name: 'Flow',
      description: 'Wyzwanie z limitem czasu',
      time: 90,
      pairs: 8,
      colors: ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#06b6d4', '#84cc16'],
      xp: 5
    }
  }

  // Generuj pary kolorów
  const generateTiles = (): Tile[] => {
    const config = difficultyConfig[difficulty]
    const tiles: Tile[] = []
    
    config.colors.slice(0, config.pairs).forEach(color => {
      const tile1: Tile = {
        id: `tile-${color}-1-${Math.random()}`,
        color,
        isFlipped: false,
        isMatched: false
      }
      const tile2: Tile = {
        id: `tile-${color}-2-${Math.random()}`,
        color,
        isFlipped: false,
        isMatched: false
      }
      tiles.push(tile1, tile2)
    })
    
    return tiles.sort(() => Math.random() - 0.5)
  }

  const initializeGame = () => {
    const config = difficultyConfig[difficulty]
    const newTiles = generateTiles()
    
    setTiles(newTiles)
    setScore(0)
    setMoves(0)
    setFlippedTiles([])
    setTimeLeft(config.time)
    setGameCompleted(false)
    setShowXPReward(false)
  }

  const checkAllMatched = (currentTiles: Tile[]): boolean => {
    return currentTiles.every(tile => tile.isMatched)
  }

  const handleTileClick = (clickedTileId: string) => {
    if (!isPlaying || flippedTiles.length >= 2) return

    const clickedTile = tiles.find(t => t.id === clickedTileId)
    if (!clickedTile || clickedTile.isFlipped || clickedTile.isMatched) return

    const newFlippedTiles = [...flippedTiles, clickedTileId]
    setFlippedTiles(newFlippedTiles)
    
    setTiles(prev => prev.map(t => 
      t.id === clickedTileId ? { ...t, isFlipped: true } : t
    ))

    if (newFlippedTiles.length === 2) {
      setMoves(prev => prev + 1)
      
      const [firstId, secondId] = newFlippedTiles
      const firstTile = tiles.find(t => t.id === firstId)
      const secondTile = tiles.find(t => t.id === secondId)

      if (firstTile && secondTile && firstTile.color === secondTile.color) {
        setTimeout(() => {
          setTiles(prev => {
            const updatedTiles = prev.map(t => 
              t.id === firstId || t.id === secondId 
                ? { ...t, isMatched: true, isFlipped: true }
                : t
            )
            
            if (checkAllMatched(updatedTiles)) {
              setGameCompleted(true)
              setTimeout(() => handleGameComplete(), 100)
            }
            
            return updatedTiles
          })
          setScore(prev => prev + 10)
          setFlippedTiles([])
        }, 200)
      } else {
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            newFlippedTiles.includes(t.id) 
              ? { ...t, isFlipped: false }
              : t
          ))
          setFlippedTiles([])
        }, 400)
      }
    }
  }

  const handleGameComplete = () => {
    const config = difficultyConfig[difficulty]
    const timeBonus = config.time > 0 ? Math.floor(timeLeft / 10) * 5 : 0
    const movesBonus = Math.max(0, 50 - moves * 2)
    setScore(prev => prev + 50 + timeBonus + movesBonus)
    
    setIsPlaying(false)
    setGameState('completion')
    setShowXPReward(true)
    
    // 🎁 Wywołaj callback z poziomem trudności
    onComplete?.(difficulty)
  }

  const handleStartGame = () => {
    setGameState('playing')
    setIsPlaying(true)
    initializeGame()
  }

  const handlePauseGame = () => {
    setIsPlaying(!isPlaying)
  }

  const handleResetGame = () => {
    setIsPlaying(false)
    setGameState('intro')
    setShowXPReward(false)
  }

  const handleBackToGames = () => {
    router.push('/games')
  }

  const handleTimeUp = () => {
    setIsPlaying(false)
    setGameState('completion')
  }

  // Timer
  useEffect(() => {
    if (isPlaying && timeLeft > 0 && difficulty !== 'zen') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, timeLeft, difficulty])

  // 🎁 XP REWARD MODAL
  const XPRewardModal = () => {
    const config = difficultyConfig[difficulty]
    
    return (
      <AnimatePresence>
        {showXPReward && gameCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowXPReward(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 0.6 }}
                  className="inline-block mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-xl opacity-50" />
                    <Gift className="h-24 w-24 text-purple-500 relative" />
                  </div>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3"
                >
                  Gratulacje! 🎉
                </motion.h2>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold text-2xl shadow-xl mb-6"
                >
                  <Sparkles className="h-6 w-6" />
                  <span>+{config.xp} XP</span>
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-2 text-lg font-medium"
                >
                  Za ukończenie gry w trybie <strong>{config.name}</strong>!
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-500 text-sm mb-8"
                >
                  Świetna pamięć wzrokowa! 🎨
                </motion.p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowXPReward(false)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl"
                >
                  Super! 🎨
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Intro Screen
  if (gameState === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="max-w-2xl w-full bg-white rounded-2xl border border-gray-100 shadow-xl p-8 mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Palette className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              Memory Kolorów
            </h2>
            <p className="text-gray-600 text-lg">
              Znajdź pary takich samych kolorów w relaksującej grze memory
            </p>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Wybierz tryb gry:
            </h3>
            <div className="space-y-3">
              {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.zen][]).map(([diff, config]) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-100 ${
                    difficulty === diff
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-lg">{config.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{config.description}</div>
                      <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-purple-100 rounded-full">
                        <Sparkles className="h-3 w-3 text-purple-600" />
                        <span className="text-xs text-purple-700 font-semibold">+{config.xp} XP</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {config.time === 0 ? 'Bez limitu' : `${config.time}s`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {config.pairs * 2} kafelków
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-100 font-semibold text-lg shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3"
          >
            <Play className="h-5 w-5" />
            Rozpocznij Grę
          </button>

          {/* Back to Games Button */}
          <button
            onClick={handleBackToGames}
            className="w-full mt-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-100 font-medium flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Wróć do Listy Gier
          </button>
        </div>
      </div>
    )
  }

  // Completion Screen
  if (gameState === 'completion') {
    const config = difficultyConfig[difficulty]
    const earnedXP = gameCompleted ? config.xp : 0

    return (
      <>
        <div className="w-full max-w-4xl mx-auto">
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-gray-50">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
                  gameCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}>
                  {gameCompleted ? (
                    <Sparkles className="h-10 w-10 text-white" />
                  ) : (
                    <span className="text-white text-2xl">⏰</span>
                  )}
                </div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  {gameCompleted ? 'Gra Zakończona!' : 'Czas Minął!'}
                </h1>
                <p className="text-gray-600">
                  {gameCompleted 
                    ? `Znaleziono wszystkie pary kolorów • +${earnedXP} XP` 
                    : 'Nie udało się znaleźć wszystkich par w czasie'
                  }
                </p>
              </div>
            </div>

            <div className="p-8">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-xl font-bold text-purple-600 mb-1">{score}</div>
                  <div className="text-sm text-purple-700">Punkty gry</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-pink-50 border border-pink-100">
                  <div className="text-xl font-bold text-pink-600 mb-1">{moves}</div>
                  <div className="text-sm text-pink-700">Ruchy</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-xl font-bold text-blue-600 mb-1">
                    {config.name}
                  </div>
                  <div className="text-sm text-blue-700">Tryb</div>
                </div>
              </div>

              {/* Performance Rating */}
              <div className="text-center mb-6">
                {gameCompleted ? (
                  <>
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      {moves <= config.pairs + 2 ? '🎉 Doskonała pamięć!' : 
                       moves <= config.pairs * 1.5 ? '👍 Bardzo dobrze!' : '😊 Dobra gra!'}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {moves <= config.pairs + 2 ? 'Perfekcyjne dopasowanie wszystkich par!' :
                       moves <= config.pairs * 1.5 ? 'Świetna koncentracja i spostrzegawczość!' : 
                       'Gra w kolory to doskonały trening dla umysłu!'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      ⏰ Czas minął!
                    </div>
                    <p className="text-gray-600 text-sm">
                      Spróbuj ponownie! Pamiętaj - XP otrzymujesz tylko za udane ukończenie gry.
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleStartGame}
                  className="py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
                >
                  <Play className="h-5 w-5" />
                  {gameCompleted ? 'Zagraj Ponownie' : 'Spróbuj Ponownie'}
                </button>
                <button
                  onClick={handleBackToGames}
                  className="py-4 px-6 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-100 font-medium flex items-center justify-center gap-2"
                >
                  <Home className="h-5 w-5" />
                  Wróć do Listy Gier
                </button>
              </div>
            </div>
          </div>
        </div>
        <XPRewardModal />
      </>
    )
  }

  // Main Game Screen (bez zmian - za długi żeby tutaj wkleić całość)
  const config = difficultyConfig[difficulty]
  const gridCols = 'grid-cols-4'
  const matchedPairs = tiles.filter(t => t.isMatched).length / 2

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-100 overflow-hidden">
        
        {/* Game Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Memory Kolorów</h1>
              <p className="text-gray-600 mt-1">
                {config.name} • +{config.xp} XP za ukończenie
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{score}</div>
                <div className="text-sm text-gray-500">punkty</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{moves}</div>
                <div className="text-sm text-gray-500">ruchy</div>
              </div>
              {config.time > 0 && (
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{timeLeft}s</div>
                  <div className="text-sm text-gray-500">czas</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="p-8">
          <div className={`grid ${gridCols} gap-3 max-w-md mx-auto`}>
            {tiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                className={`aspect-square rounded-xl border-2 transition-all duration-100 relative overflow-hidden ${
                  tile.isMatched
                    ? 'border-green-500 shadow-lg cursor-default'
                    : tile.isFlipped
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'
                }`}
                style={{ 
                  backgroundColor: (tile.isFlipped || tile.isMatched) ? tile.color : undefined 
                }}
                disabled={!isPlaying || tile.isMatched}
              >
                {tile.isMatched && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                      <Target className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}

                {!tile.isFlipped && !tile.isMatched && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-lg font-bold">?</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Progress */}
          <div className="text-center mt-6">
            <div className="text-sm text-gray-600 mb-2">
              Znalezione: {matchedPairs} / {config.pairs} par
              {config.time > 0 && ` • Pozostały czas: ${timeLeft}s`}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${(matchedPairs / config.pairs) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePauseGame}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-100 flex items-center gap-2 ${
                  isPlaying
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
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
                onClick={() => {
                  initializeGame()
                  setScore(0)
                  setMoves(0)
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-100 flex items-center gap-2 font-medium"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </button>

              <button
                onClick={handleBackToGames}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-100 flex items-center gap-2 font-medium"
              >
                <Home className="h-4 w-4" />
                Lista Gier
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg border transition-all duration-100 ${
                  soundEnabled 
                    ? 'border-purple-200 bg-purple-50 text-purple-600' 
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
      </div>
    </div>
  )
}
