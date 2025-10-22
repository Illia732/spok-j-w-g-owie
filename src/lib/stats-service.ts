// src/lib/stats-service.ts

interface MoodEntry {
  timestamp: Date
  mood: number
  note?: string
  date?: string
}

interface UserStats {
  // Podstawowe
  totalEntries: number
  averageMood: number
  
  // Passa
  currentStreak: number
  longestStreak: number
  bestStreak: number
  perfectMonth: boolean
  
  // Analiza
  consistency: number
  moodTrend: 'up' | 'down' | 'stable'
  trendPercentage: number
  
  // Okresy
  lastWeekAverage: number
  lastMonthAverage: number
  last7DaysEntries: number
  last30DaysEntries: number
  
  // Dzisiejszy dzień
  hasTodayEntry: boolean
  todayMood: number | null
}

export class StatsService {
  /**
   * 🎯 GŁÓWNA FUNKCJA - oblicza wszystkie statystyki
   */
  static calculateAllStats(entries: MoodEntry[]): UserStats {
    if (!Array.isArray(entries) || entries.length === 0) {
      return this.getEmptyStats()
    }

    // Sortuj wpisy od najnowszych
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Oblicz passę
    const streakData = this.calculateAdvancedStreak(sortedEntries)
    
    // Oblicz średnie
    const averageMood = this.calculateAverageMood(sortedEntries)
    const lastWeekAverage = this.calculatePeriodAverage(sortedEntries, 7)
    const lastMonthAverage = this.calculatePeriodAverage(sortedEntries, 30)
    
    // Oblicz konsystencję
    const consistency = this.calculateConsistency(sortedEntries, 30)
    
    // Oblicz trend
    const trendData = this.calculateMoodTrend(sortedEntries)
    
    // Sprawdź dzisiejszy wpis
    const todayData = this.getTodayData(sortedEntries)
    
    // Policz wpisy w okresach
    const last7DaysEntries = this.getEntriesInPeriod(sortedEntries, 7)
    const last30DaysEntries = this.getEntriesInPeriod(sortedEntries, 30)

    return {
      totalEntries: entries.length,
      averageMood,
      
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      bestStreak: streakData.longestStreak,
      perfectMonth: streakData.perfectMonth,
      
      consistency,
      moodTrend: trendData.trend,
      trendPercentage: trendData.percentage,
      
      lastWeekAverage,
      lastMonthAverage,
      last7DaysEntries,
      last30DaysEntries,
      
      hasTodayEntry: todayData.hasEntry,
      todayMood: todayData.mood
    }
  }

  /**
   * 🔥 OBLICZANIE PASSY (STREAK) - zaawansowane
   */
  private static calculateAdvancedStreak(entries: MoodEntry[]): {
    currentStreak: number
    longestStreak: number
    perfectMonth: boolean
  } {
    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, perfectMonth: false }
    }

    const sorted = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Oblicz aktualną passę
    let currentStreak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    // Sprawdź czy jest wpis dzisiaj lub wczoraj
    const lastEntryDate = new Date(sorted[0].timestamp)
    lastEntryDate.setHours(0, 0, 0, 0)
    
    const daysSinceLastEntry = Math.floor(
      (currentDate.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Jeśli ostatni wpis jest starszy niż wczoraj, passa się zeruje
    if (daysSinceLastEntry > 1) {
      currentStreak = 0
    } else {
      // Policz passę wstecz
      for (let i = 0; i < sorted.length; i++) {
        const entryDate = new Date(sorted[i].timestamp)
        entryDate.setHours(0, 0, 0, 0)
        
        const expectedDate = new Date(currentDate)
        expectedDate.setDate(currentDate.getDate() - i - daysSinceLastEntry)
        expectedDate.setHours(0, 0, 0, 0)
        
        if (entryDate.getTime() === expectedDate.getTime()) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Oblicz najdłuższą passę
    let longestStreak = 1
    let tempStreak = 1

    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i - 1].timestamp)
      const next = new Date(sorted[i].timestamp)
      
      current.setHours(0, 0, 0, 0)
      next.setHours(0, 0, 0, 0)

      const diffDays = Math.abs(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    // Sprawdź czy cały miesiąc ma wpisy
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.getMonth() === currentMonth && 
             entryDate.getFullYear() === currentYear
    })

    const uniqueDays = new Set(
      monthEntries.map(entry => 
        new Date(entry.timestamp).toISOString().split('T')[0]
      )
    )

    const perfectMonth = uniqueDays.size >= daysInMonth

    return {
      currentStreak,
      longestStreak,
      perfectMonth
    }
  }

  /**
   * 📊 ŚREDNI NASTRÓJ
   */
  private static calculateAverageMood(entries: MoodEntry[]): number {
    if (entries.length === 0) return 50
    
    const sum = entries.reduce((acc, entry) => acc + (entry.mood || 0), 0)
    return Math.round(sum / entries.length)
  }

  /**
   * 📅 ŚREDNI NASTRÓJ Z OKRESU (ostatnie N dni)
   */
  private static calculatePeriodAverage(entries: MoodEntry[], days: number): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    cutoffDate.setHours(0, 0, 0, 0)
    
    const periodEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate >= cutoffDate
    })
    
    return this.calculateAverageMood(periodEntries)
  }

  /**
   * 🎯 KONSYSTENCJA (% dni z wpisami w ostatnich N dniach)
   */
  private static calculateConsistency(entries: MoodEntry[], days: number): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    cutoffDate.setHours(0, 0, 0, 0)
    
    const recentEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate >= cutoffDate
    })
    
    // Zlicz unikalne dni
    const uniqueDays = new Set(
      recentEntries.map(entry => 
        new Date(entry.timestamp).toISOString().split('T')[0]
      )
    )
    
    return Math.round((uniqueDays.size / days) * 100)
  }

  /**
   * 📈 TREND NASTROJU (rosący/malejący/stabilny)
   */
  private static calculateMoodTrend(entries: MoodEntry[]): {
    trend: 'up' | 'down' | 'stable'
    percentage: number
  } {
    if (entries.length < 2) {
      return { trend: 'stable', percentage: 0 }
    }
    
    const recentEntries = entries.slice(0, 7) // Ostatnie 7 dni
    const olderEntries = entries.slice(7, 14) // Poprzednie 7 dni
    
    if (recentEntries.length === 0 || olderEntries.length === 0) {
      return { trend: 'stable', percentage: 0 }
    }
    
    const recentAvg = this.calculateAverageMood(recentEntries)
    const olderAvg = this.calculateAverageMood(olderEntries)
    
    const difference = recentAvg - olderAvg
    const percentage = Math.round((difference / olderAvg) * 100)
    
    if (difference > 5) return { trend: 'up', percentage }
    if (difference < -5) return { trend: 'down', percentage }
    return { trend: 'stable', percentage: 0 }
  }

  /**
   * 📆 DZISIEJSZY WPIS
   */
  private static getTodayData(entries: MoodEntry[]): {
    hasEntry: boolean
    mood: number | null
  } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayEntry = entries.find(entry => {
      const entryDate = new Date(entry.timestamp)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === today.getTime()
    })
    
    return {
      hasEntry: !!todayEntry,
      mood: todayEntry?.mood || null
    }
  }

  /**
   * 📊 LICZBA WPISÓW W OKRESIE
   */
  private static getEntriesInPeriod(entries: MoodEntry[], days: number): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    cutoffDate.setHours(0, 0, 0, 0)
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate >= cutoffDate
    }).length
  }

  /**
   * 🔄 PUSTE STATYSTYKI (gdy brak danych)
   */
  private static getEmptyStats(): UserStats {
    return {
      totalEntries: 0,
      averageMood: 50,
      currentStreak: 0,
      longestStreak: 0,
      bestStreak: 0,
      perfectMonth: false,
      consistency: 0,
      moodTrend: 'stable',
      trendPercentage: 0,
      lastWeekAverage: 50,
      lastMonthAverage: 50,
      last7DaysEntries: 0,
      last30DaysEntries: 0,
      hasTodayEntry: false,
      todayMood: null
    }
  }

  /**
   * 📅 GRUPOWANIE PO TYGODNIACH
   */
  static groupByWeek(entries: MoodEntry[]): Map<string, MoodEntry[]> {
    const weeks = new Map<string, MoodEntry[]>()
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      weekStart.setHours(0, 0, 0, 0)
      
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, [])
      }
      weeks.get(weekKey)!.push(entry)
    })
    
    return weeks
  }

  /**
   * 📅 GRUPOWANIE PO MIESIĄCACH
   */
  static groupByMonth(entries: MoodEntry[]): Map<string, MoodEntry[]> {
    const months = new Map<string, MoodEntry[]>()
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!months.has(monthKey)) {
        months.set(monthKey, [])
      }
      months.get(monthKey)!.push(entry)
    })
    
    return months
  }
}
