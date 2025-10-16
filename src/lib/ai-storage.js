// Prosty system zapisywania odpowiedzi AI na ten sam dzień
const AI_STORAGE_KEY = 'ai_insights_data'

interface MoodData {
  mood: number
  streak: number
  trend: number
  consistency: number
  averageMood: number
  level: number
  entriesCount: number
}

interface AIStorageData {
  date: string
  moodData: MoodData
  aiResponse: any
  timestamp: string
}

export const saveAIResponse = (moodData: MoodData, aiResponse: any): void => {
  if (typeof window === 'undefined') return
  
  const today = new Date().toDateString()
  const data: AIStorageData = {
    date: today,
    moodData: {
      mood: moodData.mood || 50,
      streak: moodData.streak || 0,
      trend: moodData.trend || 0,
      consistency: moodData.consistency || 50,
      averageMood: moodData.averageMood || 50,
      level: moodData.level || 1,
      entriesCount: moodData.entriesCount || 0
    },
    aiResponse: aiResponse,
    timestamp: new Date().toISOString()
  }
  
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving AI response to localStorage:', error)
  }
}

export const getSavedAIResponse = (currentMoodData: MoodData): any => {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem(AI_STORAGE_KEY)
    if (!saved) return null
    
    const data: AIStorageData = JSON.parse(saved)
    const today = new Date().toDateString()
    
    // Sprawdź czy to z dzisiaj i czy kluczowe dane się zgadzają
    if (data.date === today && 
        data.moodData.mood === (currentMoodData.mood || 50) &&
        data.moodData.streak === (currentMoodData.streak || 0) &&
        data.moodData.level === (currentMoodData.level || 1)) {
      return data.aiResponse
    }
    
    return null
  } catch (error) {
    console.error('Error reading saved AI response:', error)
    return null
  }
}

export const clearAIResponse = (): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(AI_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing AI response:', error)
  }
}

// Dodatkowa funkcja do sprawdzania czy mamy zapisaną odpowiedź
export const hasValidAIResponse = (currentMoodData: MoodData): boolean => {
  return getSavedAIResponse(currentMoodData) !== null
}