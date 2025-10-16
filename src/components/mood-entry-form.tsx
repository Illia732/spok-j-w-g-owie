'use client'

import { useState, useEffect } from 'react' // DODAJ useEffect
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMoodLabel, getMoodEmoji } from '@/lib/mood-utils'

interface MoodEntryFormProps {
  currentMood: number
  onSave: (data: { mood: number; note?: string }) => void
  isLoading?: boolean
  initialNote?: string // DODAJ TĘ LINIĘ
}

export const MoodEntryForm: React.FC<MoodEntryFormProps> = ({
  currentMood,
  onSave,
  isLoading = false,
  initialNote = '' // DODAJ TĘ LINIĘ
}) => {
  const [note, setNote] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // DODAJ TEN useEffect DO USTAWIANIA POCZĄTKOWEJ NOTATKI
  useEffect(() => {
    if (initialNote) {
      setNote(initialNote)
    }
  }, [initialNote])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ mood: currentMood, note: note.trim() || undefined })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      {/* Nagłówek */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {initialNote ? 'Edytuj notatkę' : 'Dodaj notatkę do nastroju'}
          </span>
        </div>
        <h2 className="text-2xl font-light text-gray-900">
          {getMoodEmoji(currentMood)} {currentMood}% - {getMoodLabel(currentMood)}
        </h2>
      </div>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <label htmlFor="note" className="text-sm font-medium text-gray-700">
            Notatka (opcjonalnie)
          </label>
          <div className={cn(
            "relative rounded-xl border-2 transition-all duration-200",
            isFocused 
              ? "border-blue-500 bg-blue-50/20 shadow-sm" 
              : "border-gray-200 bg-white hover:border-gray-300"
          )}>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Co wpływa na Twój nastrój? Co czujesz w tym momencie? Co Cię cieszy lub martwi?"
              className="min-h-[120px] resize-none border-0 bg-transparent focus:ring-0 text-gray-700 placeholder-gray-400"
            />
            <div className="absolute bottom-3 right-3">
              <span className={cn(
                "text-xs transition-colors",
                note.length > 400 ? "text-rose-500" : "text-gray-400"
              )}>
                {note.length}/500
              </span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-xl font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Zapisuję...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {initialNote ? 'Zaktualizuj notatkę' : 'Zapisz notatkę i zobacz AI Insights'}
            </>
          )}
        </Button>
      </form>
    </motion.div>
  )
}