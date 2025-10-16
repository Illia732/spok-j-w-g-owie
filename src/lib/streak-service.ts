// src/lib/streak-service.ts

// 👇 DODAJ TEN INTERFEJS NA POCZĄTKU
interface MoodEntry {
  timestamp: Date
  mood: number
  note?: string
  date?: string
}

export class StreakService {
  static calculateAdvancedStreak(entries: MoodEntry[]): {
    currentStreak: number
    longestStreak: number
    perfectMonth: boolean
  } {
    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, perfectMonth: false }
    }

    // Sort entries by date
    const sorted = [...entries].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    )

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    // Check current streak
    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].timestamp)
      entryDate.setHours(0, 0, 0, 0)

      if (entryDate.getTime() === currentDate.getTime()) {
        currentStreak++
        tempStreak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    // Calculate longest streak
    tempStreak = 1
    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i].timestamp)
      const previous = new Date(sorted[i-1].timestamp)
      
      current.setHours(0, 0, 0, 0)
      previous.setHours(0, 0, 0, 0)

      const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    // Check perfect month (entries for every day of current month)
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.getMonth() === currentMonth && 
             entryDate.getFullYear() === currentYear
    })

    const uniqueDays = new Set(
      monthEntries.map(entry => 
        new Date(entry.timestamp).toDateString()
      )
    )

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const perfectMonth = uniqueDays.size >= daysInMonth

    return {
      currentStreak,
      longestStreak,
      perfectMonth
    }
  }
}