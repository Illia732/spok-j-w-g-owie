'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MoodSliderProps {
  value: number
  onValueChange: (value: number) => void
  onValueCommit?: (value: number) => void
  className?: string
}

const getMoodColor = (val: number) => {
  if (val <= 20) return 'rgba(75, 85, 99, 0.8)'
  if (val <= 40) return 'rgba(59, 130, 246, 0.9)'
  if (val <= 60) return 'rgba(100, 130, 220, 0.9)'
  if (val <= 80) return 'rgba(168, 85, 230, 0.9)'
  return 'rgba(156, 39, 176, 1)'
}

const getMoodEmoji = (val: number) => {
  if (val <= 20) return '😔'
  if (val <= 40) return '😐'
  if (val <= 60) return '🙂'
  if (val <= 80) return '😊'
  return '🤩'
}

const getMoodLabel = (val: number) => {
  if (val <= 20) return 'Bardzo niski'
  if (val <= 40) return 'Niski'
  if (val <= 60) return 'Neutralny'
  if (val <= 80) return 'Wysoki'
  return 'Bardzo wysoki'
}

export const MoodSlider: React.FC<MoodSliderProps> = ({
  value,
  onValueChange,
  onValueCommit,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Sprawdź, czy jesteśmy na urządzeniu mobilnym
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Płynna aktualizacja wartości
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const updateValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const percentage = x / rect.width
    const newValue = Math.round(percentage * 100)
    
    setLocalValue(newValue)
    onValueChange(newValue)
  }, [onValueChange])

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    updateValue(clientX)

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      moveEvent.preventDefault()
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
      updateValue(moveClientX)
    }

    const handleEnd = () => {
      setIsDragging(false)
      onValueCommit?.(localValue)
      
      document.removeEventListener('mousemove', handleMove as EventListener)
      document.removeEventListener('touchmove', handleMove as EventListener)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchend', handleEnd)
    }

    document.addEventListener('mousemove', handleMove as EventListener)
    document.addEventListener('touchmove', handleMove as EventListener)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchend', handleEnd)
  }, [isDragging, localValue, onValueCommit, updateValue])

  return (
    <div className={cn(
      "w-full space-y-5 sm:space-y-6",
      "bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5",
      "shadow-md border border-gray-100",
      className
    )}>
      {/* Wyświetlacz wartości - responsywny */}
      <div className="text-center">
        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">
          {getMoodEmoji(localValue)}
        </div>
        <div className="text-xl sm:text-2xl font-medium text-gray-900">
          {localValue}%
        </div>
        <div className="text-sm text-gray-500 mt-1 sm:mt-2">
          {getMoodLabel(localValue)}
        </div>
      </div>

      {/* Slider - z optymalizacją dla urządzeń mobilnych */}
      <div className="space-y-4">
        <div 
          ref={sliderRef}
          className="relative h-3 sm:h-2.5 rounded-full cursor-pointer touch-none"
          onMouseDown={handleInteractionStart}
          onTouchStart={handleInteractionStart}
        >
          {/* Tło slidera - subtelne i przezroczyste */}
          <div className="absolute inset-0 rounded-full bg-gray-200/50" />
          
          {/* Wypełnienie - responsywny gradient zgodny z kolorystyką aplikacji */}
          <div 
            className="absolute inset-y-0 rounded-l-full transition-all duration-300"
            style={{ 
              width: `${localValue}%`,
              backgroundColor: getMoodColor(localValue)
            }}
          />
          
          {/* Thumb - optymalizacja dla urządzeń mobilnych */}
          <div
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-white cursor-grab",
              "transition-all duration-300 shadow-sm",
              isDragging && "cursor-grabbing scale-125",
              "group-hover:scale-110",
              isMobile ? "w-8 h-8" : "w-6 h-6"
            )}
            style={{ 
              left: `${localValue}%`,
              boxShadow: isDragging ? '0 2px 6px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>

        {/* Skala - odpowiednio dostosowana */}
        <div className="flex justify-between text-xs sm:text-sm text-gray-500 px-2">
          <span>Bardzo niski</span>
          <span>Neutralny</span>
          <span>Bardzo wysoki</span>
        </div>
      </div>

      {/* Szybkie presetty - responsywny układ */}
      <div className={cn(
        "flex gap-2 flex-wrap justify-center",
        isMobile ? "px-2" : ""
      )}>
        {[0, 25, 50, 75, 100].map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setLocalValue(preset)
              onValueChange(preset)
              onValueCommit?.(preset)
            }}
            className={cn(
              "px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-300",
              "bg-white border border-gray-200 text-gray-700",
              "hover:border-blue-300 hover:bg-blue-50",
              localValue === preset && cn(
                "bg-blue-500 text-white border-blue-500",
                "transform scale-105"
              ),
              isMobile && "w-14"
            )}
          >
            {preset}%
          </button>
        ))}
      </div>
    </div>
  )
}