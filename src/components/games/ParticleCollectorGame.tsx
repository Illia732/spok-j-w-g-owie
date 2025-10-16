'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Home, Target, Zap, Crown, Star, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  type: 'normal' | 'bonus' | 'special'
}

interface Player {
  x: number
  y: number
  size: number
  color: string
  score: number
  speed: number
}

export default function ParticleCollectorGame() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameOver'>('intro')
  const [isPlaying, setIsPlaying] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [player, setPlayer] = useState<Player>({
    x: 400,
    y: 300,
    size: 20,
    color: '#8B5CF6',
    score: 0,
    speed: 3
  })
  const [highScore, setHighScore] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mousePosRef = useRef({ x: 400, y: 300 })
  const touchIdRef = useRef<number | null>(null)

  // Kolory dla różnych typów cząstek
  const particleColors = {
    normal: ['#60A5FA', '#34D399', '#FBBF24', '#F87171'],
    bonus: ['#A78BFA', '#F472B6', '#2DD4BF'],
    special: ['#F59E0B', '#DC2626', '#7C3AED']
  }

  // Sprawdź czy to mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Inicjalizacja cząstek
  const initializeParticles = useCallback(() => {
    const newParticles: Particle[] = []
    const particleCount = isMobile ? 30 : 50 // Mniej cząstek na mobile

    for (let i = 0; i < particleCount; i++) {
      const type = Math.random() > 0.8 ? 'bonus' : Math.random() > 0.9 ? 'special' : 'normal'
      const colors = particleColors[type]
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      newParticles.push({
        id: i,
        x: Math.random() * (canvasRef.current?.width || 800),
        y: Math.random() * (canvasRef.current?.height || 600),
        size: type === 'special' ? (isMobile ? 6 : 8) : type === 'bonus' ? (isMobile ? 5 : 6) : (isMobile ? 3 : 4),
        color,
        type
      })
    }

    setParticles(newParticles)
  }, [isMobile])

  // Ruch gracza za kursorem/tapem
  const updatePlayerPosition = useCallback(() => {
    setPlayer(prev => {
      const dx = mousePosRef.current.x - prev.x
      const dy = mousePosRef.current.y - prev.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > prev.speed) {
        return {
          ...prev,
          x: prev.x + (dx / distance) * prev.speed,
          y: prev.y + (dy / distance) * prev.speed
        }
      }
      return prev
    })
  }, [])

  // Kolizje i zbieranie cząstek
  const checkCollisions = useCallback(() => {
    setParticles(prevParticles => {
      const remainingParticles = prevParticles.filter(particle => {
        const dx = player.x - particle.x
        const dy = player.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < player.size + particle.size) {
          // Gracz zbiera cząstkę
          setPlayer(prevPlayer => {
            let scoreIncrease = 1
            let sizeIncrease = 0.5
            
            if (particle.type === 'bonus') {
              scoreIncrease = 3
              sizeIncrease = 1
            } else if (particle.type === 'special') {
              scoreIncrease = 5
              sizeIncrease = 2
            }
            
            const newScore = prevPlayer.score + scoreIncrease
            if (newScore > highScore) {
              setHighScore(newScore)
            }
            
            return {
              ...prevPlayer,
              score: newScore,
              size: Math.min(prevPlayer.size + sizeIncrease, isMobile ? 40 : 50),
              speed: Math.max(2, 3 - (newScore * 0.01))
            }
          })
          return false
        }
        return true
      })

      // Dodaj nowe cząstki jeśli za mało
      if (remainingParticles.length < (isMobile ? 15 : 30)) {
        const newParticle: Particle = {
          id: Date.now(),
          x: Math.random() * (canvasRef.current?.width || 800),
          y: Math.random() * (canvasRef.current?.height || 600),
          size: Math.random() > 0.9 ? (isMobile ? 6 : 8) : Math.random() > 0.7 ? (isMobile ? 5 : 6) : (isMobile ? 3 : 4),
          color: particleColors.normal[Math.floor(Math.random() * particleColors.normal.length)],
          type: Math.random() > 0.95 ? 'special' : Math.random() > 0.8 ? 'bonus' : 'normal'
        }
        return [...remainingParticles, newParticle]
      }

      return remainingParticles
    })
  }, [player.x, player.y, player.size, highScore, isMobile])

  // Główna pętla gry
  const gameLoop = useCallback(() => {
    updatePlayerPosition()
    checkCollisions()
    renderGame()
    
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updatePlayerPosition, checkCollisions])

  // Renderowanie gry
  const renderGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Tło
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#0F172A')
    gradient.addColorStop(1, '#1E293B')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Cząstki
    particles.forEach(particle => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.fill()

      // Efekt świecenia
      const glow = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      )
      glow.addColorStop(0, particle.color)
      glow.addColorStop(1, 'transparent')

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.globalAlpha = 0.3
      ctx.fill()
      ctx.globalAlpha = 1

      // Specjalne efekty dla bonusowych cząstek
      if (particle.type === 'bonus' || particle.type === 'special') {
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size + 3, 0, Math.PI * 2)
        ctx.stroke()
      }
    })

    // Gracz
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2)
    
    const playerGradient = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, player.size
    )
    playerGradient.addColorStop(0, '#C4B5FD')
    playerGradient.addColorStop(1, player.color)
    
    ctx.fillStyle = playerGradient
    ctx.fill()

    // Obwódka gracza
    ctx.strokeStyle = '#C4B5FD'
    ctx.lineWidth = 3
    ctx.stroke()

    // Efekt świecenia gracza
    const playerGlow = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, player.size * 1.5
    )
    playerGlow.addColorStop(0, 'rgba(139, 92, 246, 0.5)')
    playerGlow.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.arc(player.x, player.y, player.size * 1.5, 0, Math.PI * 2)
    ctx.fillStyle = playerGlow
    ctx.fill()
  }

  // Obsługa myszy (PC)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  // Obsługa dotyku (Mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || e.touches.length === 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    touchIdRef.current = touch.identifier
    
    mousePosRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || touchIdRef.current === null) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current)
    
    if (touch) {
      mousePosRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }
    
    e.preventDefault() // Zapobiegaj scrollowaniu
  }

  const handleTouchEnd = () => {
    touchIdRef.current = null
  }

  // Start gry
  const handleStart = () => {
    setGameState('playing')
    setIsPlaying(true)
    setPlayer({
      x: 400,
      y: 300,
      size: isMobile ? 15 : 20,
      color: '#8B5CF6',
      score: 0,
      speed: 3
    })
    initializeParticles()

    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.offsetWidth
      canvasRef.current.height = canvasRef.current.offsetHeight
      gameLoop()
    }
  }

  const handlePause = () => {
    setIsPlaying(!isPlaying)
    if (isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    } else {
      gameLoop()
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setGameState('intro')
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handleBackToGames = () => {
    router.push('/games')
  }

  // Responsive canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth
        canvasRef.current.height = canvasRef.current.offsetHeight
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Intro Screen
  if (gameState === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 md:p-8"
        >
          <div className="text-center mb-6 md:mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap className="h-8 w-8 md:h-12 md:w-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quantum Particles
            </h2>
            <p className="text-gray-600 text-base md:text-lg mb-4 md:mb-6">
              {isMobile ? 'Dotykaj ekranu i zbieraj cząstki!' : 'Poruszaj kursorem i zbieraj kolorowe cząstki!'}<br />
              Rośnij, zdobywaj punkty i pokonaj swój rekord.
            </p>
            
            {isMobile && (
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm mb-4">
                <Smartphone className="h-4 w-4" />
                Tryb mobilny - dotykaj ekranu!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="text-center p-3 md:p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Target className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-blue-900 text-sm md:text-base">Cel gry</div>
              <div className="text-xs md:text-sm text-blue-700">Zbieraj cząstki i rośnij</div>
            </div>
            <div className="text-center p-3 md:p-4 rounded-xl bg-green-50 border border-green-200">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-900 text-sm md:text-base">Bonusowe cząstki</div>
              <div className="text-xs md:text-sm text-green-700">Żółte = +3 punkty</div>
            </div>
            <div className="text-center p-3 md:p-4 rounded-xl bg-purple-50 border border-purple-200">
              <Crown className="h-6 w-6 md:h-8 md:w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold text-purple-900 text-sm md:text-base">Specjalne cząstki</div>
              <div className="text-xs md:text-sm text-purple-700">Pomarańczowe = +5 punktów</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <motion.button
              onClick={handleStart}
              className="py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold text-base md:text-lg shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 md:gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="h-4 w-4 md:h-5 md:w-5" />
              Rozpocznij Grę
            </motion.button>

            <button
              onClick={handleBackToGames}
              className="py-3 md:py-4 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4 md:h-5 md:w-5" />
              Wróć do Gier
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Game Screen
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-50 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">Quantum Particles</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="h-3 w-3 md:h-4 md:w-4" />
                <span>Punkty: {player.score}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                <span>Rozmiar: {Math.round(player.size)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                <span>Rekord: {highScore}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-[400px] md:h-[600px] cursor-none touch-none"
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                cursor: isMobile ? 'none' : 'crosshair',
                touchAction: 'none' // Zapobiega scrollowaniu na mobile
              }}
            />
            
            {/* Overlay Info */}
            <div className="absolute top-3 md:top-4 left-3 md:left-4 text-white text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 bg-black/50 px-2 md:px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse bg-green-500" />
                <span className="font-medium">
                  {isMobile ? 'Dotykaj ekranu' : 'Poruszaj kursorem'}
                </span>
              </div>
            </div>
            
            {/* Particle Count */}
            <div className="absolute top-3 md:top-4 right-3 md:right-4 text-white text-xs md:text-sm">
              <div className="bg-black/50 px-2 md:px-3 py-1 rounded-full">
                {particles.length} cząstek
              </div>
            </div>

            {/* Game Instructions */}
            {!isMobile && (
              <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 text-white text-xs md:text-sm">
                <div className="bg-black/50 px-3 py-2 rounded-xl max-w-[180px] md:max-w-xs">
                  <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-400" />
                    <span className="text-xs">Zwykła: +1</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-purple-500 border border-white" />
                    <span className="text-xs">Bonus: +3</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange-500 border border-white" />
                    <span className="text-xs">Specjalna: +5</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Instructions */}
            {isMobile && (
              <div className="absolute bottom-3 left-3 right-3 text-white text-xs text-center">
                <div className="bg-black/50 px-3 py-2 rounded-xl">
                  Dotykaj ekranu aby poruszać kulką!
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 mt-4 md:mt-6">
            <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-center sm:justify-start">
              <button
                onClick={handlePause}
                className={`px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-1 md:gap-2 text-sm md:text-base flex-1 sm:flex-none justify-center ${
                  isPlaying
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Pauza</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Wznów</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="px-3 md:px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-1 md:gap-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
              >
                <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
                <span>Nowa Gra</span>
              </button>
            </div>

            <button
              onClick={handleBackToGames}
              className="px-3 md:px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-1 md:gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Home className="h-3 w-3 md:h-4 md:w-4" />
              <span>Lista Gier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}