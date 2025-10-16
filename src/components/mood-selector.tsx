
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Heart, Zap, Cloud, Sun, CloudRain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MoodSelectorProps {
  onMoodSelect: (mood: number) => void
  onAddNote: () => void
  currentMood?: number
}

const moodOptions = [
  {
    level: 20,
    label: 'Bardzo niski',
    emoji: '😔',
    description: 'Czuję się przygnębiony',
    color: 'from-gray-500 to-gray-600',
    icon: CloudRain,
    tips: ['Zrób głęboki oddech', 'Porozmawiaj z kimś', 'Zrób coś miłego dla siebie']
  },
  {
    level: 40,
    label: 'Niski',
    emoji: '😐',
    description: 'Mam gorszy dzień',
    color: 'from-blue-500 to-blue-600',
    icon: Cloud,
    tips: ['Wyjdź na spacer', 'Posłuchaj ulubionej muzyki', 'Zrób mały krok naprzód']
  },
  {
    level: 60,
    label: 'Neutralny',
    emoji: '🙂',
    description: 'Jest ok',
    color: 'from-green-500 to-green-600',
    icon: Sun,
    tips: ['Doceniaj małe rzeczy', 'Planuj dalsze kroki', 'Ciesz się spokojem']
  },
  {
    level: 80,
    label: 'Wysoki',
    emoji: '😊',
    description: 'Czuję się dobrze',
    color: 'from-purple-500 to-purple-600',
    icon: Zap,
    tips: ['Podziel się energią', 'Zrób coś kreatywnego', 'Pomóż komuś']
  },
  {
    level: 100,
    label: 'Bardzo wysoki',
    emoji: '🤩',
    description: 'Fantastycznie!',
    color: 'from-rose-500 to-rose-600',
    icon: Heart,
    tips: ['Ciesz się momentem', 'Zarażaj pozytywną energią', 'Zapisuj dobre chwile']
  }
]

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  onMoodSelect,
  onAddNote,
  currentMood
}) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(currentMood || null)
  const [showTips, setShowTips] = useState(false)

  const handleMoodSelect = (moodLevel: number) => {
    setSelectedMood(moodLevel)
    setShowTips(true)
  }

  const handleConfirm = () => {
    if (selectedMood !== null) {
      onMoodSelect(selectedMood)
    }
  }

  const selectedOption = moodOptions.find(opt => opt.level === selectedMood)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Nagłówek */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100"
        >
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Jak się dziś czujesz?</span>
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-light text-gray-900">
          Wybierz swój nastrój
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ta decyzja pomoże nam lepiej zrozumieć Twój dzień i dostarczyć spersonalizowane insights
        </p>
      </div>

      {/* Opcje nastroju */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {moodOptions.map((mood, index) => (
          <motion.div
            key={mood.level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-300 border-2 backdrop-blur-sm",
                selectedMood === mood.level
                  ? "border-blue-500 shadow-lg scale-105 bg-white/90"
                  : "border-gray-200 bg-white/80 hover:border-gray-300 hover:shadow-md"
              )}
              onClick={() => handleMoodSelect(mood.level)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{mood.emoji}</div>
                <div className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full mb-2",
                  selectedMood === mood.level 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-gray-100 text-gray-700"
                )}>
                  {mood.label}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  {mood.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Wybrane tipsy i akcje */}
      <AnimatePresence>
        {selectedMood !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Tipsy */}
            {showTips && selectedOption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100"
              >
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Szybkie wsparcie dla Ciebie:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {selectedOption.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-2 bg-white/80 rounded-lg text-sm text-gray-700"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      {tip}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Akcje */}
            <div className="flex gap-3">
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-xl font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Zapisz nastrój i zobacz AI Insights
              </Button>
              
              <Button
                onClick={onAddNote}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 py-3 rounded-xl font-medium"
                size="lg"
              >
                + Dodaj notatkę
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}