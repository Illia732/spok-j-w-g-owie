// src/lib/xp-service.ts
import { 
  doc, 
  updateDoc, 
  getDoc, 
  arrayUnion, 
  Timestamp, 
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit as firestoreLimit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export enum XPSource {
  // Nastrój
  MOOD_ENTRY = 'mood_entry',
  FIRST_MOOD = 'first_mood',
  
  // Gry
  BREATHING_EXERCISE = 'breathing_exercise',
  COLOR_HARMONY = 'color_harmony',
  COLOR_HARMONY_ZEN = 'color_harmony_zen',
  COLOR_HARMONY_CHILL = 'color_harmony_chill',
  COLOR_HARMONY_FLOW = 'color_harmony_flow',
  
  // Społecznościowe
  ARTICLE_READ = 'article_read',
  FRIEND_ADDED = 'friend_added',
  FRIEND_INVITED = 'friend_invited',
  
  // Passa
  DAILY_LOGIN = 'daily_login',
  STREAK_7_DAYS = 'streak_7_days',
  STREAK_30_DAYS = 'streak_30_days',
  
  // Bonusy
  LEVEL_UP = 'level_up',
}

interface XPTransaction {
  userId: string
  amount: number
  source: XPSource
  timestamp: Timestamp
  description: string
}

interface LevelInfo {
  currentLevel: number
  currentXP: number
  xpToNextLevel: number
  xpProgress: number
  totalXPEarned: number
}

interface XPAwardResult {
  success: boolean
  xpAwarded: number
  leveledUp?: boolean
  newLevel?: number
  newXP?: number
  transaction?: XPTransaction
  message?: string
}

export class XPService {
  private static readonly XP_TABLE: Record<XPSource, number> = {
    [XPSource.MOOD_ENTRY]: 10,
    [XPSource.FIRST_MOOD]: 50,
    [XPSource.BREATHING_EXERCISE]: 5,
    [XPSource.COLOR_HARMONY]: 1,
    [XPSource.COLOR_HARMONY_ZEN]: 1,
    [XPSource.COLOR_HARMONY_CHILL]: 3,
    [XPSource.COLOR_HARMONY_FLOW]: 5,
    [XPSource.ARTICLE_READ]: 10,
    [XPSource.FRIEND_ADDED]: 25,
    [XPSource.FRIEND_INVITED]: 125,
    [XPSource.DAILY_LOGIN]: 5,
    [XPSource.STREAK_7_DAYS]: 25,
    [XPSource.STREAK_30_DAYS]: 75,
    [XPSource.LEVEL_UP]: 0,
  }

  private static readonly XP_DESCRIPTIONS: Record<XPSource, string> = {
    [XPSource.MOOD_ENTRY]: 'Dodano wpis nastroju',
    [XPSource.FIRST_MOOD]: 'Pierwszy wpis nastroju!',
    [XPSource.BREATHING_EXERCISE]: 'Ukończono ćwiczenie oddechowe',
    [XPSource.COLOR_HARMONY]: 'Gra: Harmonia Kolorów',
    [XPSource.COLOR_HARMONY_ZEN]: 'Poziom Zen w Harmonii Kolorów',
    [XPSource.COLOR_HARMONY_CHILL]: 'Poziom Chill w Harmonii Kolorów',
    [XPSource.COLOR_HARMONY_FLOW]: 'Poziom Flow w Harmonii Kolorów',
    [XPSource.ARTICLE_READ]: 'Przeczytano artykuł',
    [XPSource.FRIEND_ADDED]: 'Dodano znajomego',
    [XPSource.FRIEND_INVITED]: 'Zaproszony znajomy dołączył!',
    [XPSource.DAILY_LOGIN]: 'Dzienny login',
    [XPSource.STREAK_7_DAYS]: 'Passa 7 dni!',
    [XPSource.STREAK_30_DAYS]: 'Passa 30 dni!',
    [XPSource.LEVEL_UP]: 'Awans na nowy poziom!',
  }

  static getXPForLevel(level: number): number {
    return 100 * level
  }

  static calculateLevel(totalXP: number): number {
    let level = 1
    let xpNeeded = 0
    
    while (totalXP >= xpNeeded) {
      xpNeeded += this.getXPForLevel(level)
      if (totalXP >= xpNeeded) {
        level++
      }
    }
    
    return level
  }

  static getLevelInfo(totalXP: number): LevelInfo {
    const currentLevel = this.calculateLevel(totalXP)
    const xpToNextLevel = this.getXPForLevel(currentLevel)
    
    let xpForCurrentLevel = 0
    for (let i = 1; i < currentLevel; i++) {
      xpForCurrentLevel += this.getXPForLevel(i)
    }
    
    const currentXP = totalXP - xpForCurrentLevel
    const xpProgress = (currentXP / xpToNextLevel) * 100
    
    return {
      currentLevel,
      currentXP,
      xpToNextLevel,
      xpProgress,
      totalXPEarned: totalXP
    }
  }

  static async awardXP(
    userId: string, 
    source: XPSource,
    customAmount?: number
  ): Promise<XPAwardResult> {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) {
        return { 
          success: false, 
          xpAwarded: 0, 
          message: 'Użytkownik nie istnieje'
        }
      }

      const userData = userSnap.data()
      const currentTotalXP = userData.xp || 0
      const currentLevel = this.calculateLevel(currentTotalXP)
      
      const xpAmount = customAmount || this.XP_TABLE[source]
      const newTotalXP = currentTotalXP + xpAmount
      const newLevel = this.calculateLevel(newTotalXP)
      
      const leveledUp = newLevel > currentLevel

      const transaction: XPTransaction = {
        userId,
        amount: xpAmount,
        source,
        timestamp: Timestamp.now(),
        description: this.XP_DESCRIPTIONS[source]
      }

      await updateDoc(userRef, {
        xp: newTotalXP,
        level: newLevel,
        lastXPUpdate: Timestamp.now()
      })

      const xpHistoryRef = doc(db, 'xpHistory', `${userId}_${Date.now()}`)
      await setDoc(xpHistoryRef, {
        ...transaction,
        createdAt: Timestamp.now()
      })

      console.log('✅ XP przyznane:', {
        user: userId,
        source,
        amount: xpAmount,
        totalXP: newTotalXP,
        level: newLevel,
        leveledUp
      })

      return {
        success: true,
        xpAwarded: xpAmount,
        leveledUp,
        newLevel: leveledUp ? newLevel : currentLevel,
        newXP: newTotalXP,
        transaction,
        message: `+${xpAmount} XP`
      }
      
    } catch (error) {
      console.error('❌ Błąd przyznawania XP:', error)
      return { 
        success: false, 
        xpAwarded: 0, 
        message: 'Błąd przyznawania XP'
      }
    }
  }

  static async awardGameXP(
    userId: string,
    gameType: 'breathing' | 'colorHarmony',
    level?: 'zen' | 'chill' | 'flow'
  ): Promise<XPAwardResult> {
    if (gameType === 'breathing') {
      return this.awardXP(userId, XPSource.BREATHING_EXERCISE)
    }
    
    if (gameType === 'colorHarmony') {
      switch (level) {
        case 'zen':
          return this.awardXP(userId, XPSource.COLOR_HARMONY_ZEN)
        case 'chill':
          return this.awardXP(userId, XPSource.COLOR_HARMONY_CHILL)
        case 'flow':
          return this.awardXP(userId, XPSource.COLOR_HARMONY_FLOW)
        default:
          return this.awardXP(userId, XPSource.COLOR_HARMONY)
      }
    }

    return { 
      success: false, 
      xpAwarded: 0, 
      message: 'Nieznany typ gry'
    }
  }

  static async awardArticleXP(
    userId: string,
    articleId: string
  ): Promise<XPAwardResult> {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        return {
          success: false,
          xpAwarded: 0,
          message: 'Użytkownik nie istnieje'
        }
      }

      const userData = userSnap.data()
      const readArticles = userData.readArticles || []

      if (readArticles.includes(articleId)) {
        return {
          success: false,
          xpAwarded: 0,
          message: 'Artykuł już przeczytany - brak XP'
        }
      }

      await updateDoc(userRef, {
        readArticles: arrayUnion(articleId)
      })

      return await this.awardXP(userId, XPSource.ARTICLE_READ)
    } catch (error) {
      console.error('❌ Błąd przyznawania XP za artykuł:', error)
      return {
        success: false,
        xpAwarded: 0,
        message: 'Błąd przyznawania XP'
      }
    }
  }

  static async awardStreakXP(
    userId: string,
    streakDays: number
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) return

      const userData = userSnap.data()
      const lastStreak7 = userData.lastStreak7Reward
      const lastStreak30 = userData.lastStreak30Reward

      if (streakDays >= 7 && !lastStreak7) {
        await this.awardXP(userId, XPSource.STREAK_7_DAYS)
        await updateDoc(userRef, { lastStreak7Reward: Timestamp.now() })
      }

      if (streakDays >= 30 && !lastStreak30) {
        await this.awardXP(userId, XPSource.STREAK_30_DAYS)
        await updateDoc(userRef, { lastStreak30Reward: Timestamp.now() })
      }
    } catch (error) {
      console.error('❌ Błąd przyznawania XP za passę:', error)
    }
  }

  static async awardDailyLoginXP(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) return

      const userData = userSnap.data()
      const lastLogin = userData.lastDailyXP?.toDate()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin)
        lastLoginDate.setHours(0, 0, 0, 0)
        
        if (lastLoginDate.getTime() === today.getTime()) {
          return
        }
      }

      await this.awardXP(userId, XPSource.DAILY_LOGIN)
      await updateDoc(userRef, { lastDailyXP: Timestamp.now() })
    } catch (error) {
      console.error('❌ Błąd przyznawania dziennego XP:', error)
    }
  }

  /**
   * 📊 POBIERA HISTORIĘ XP Z FIRESTORE - FIXED!
   */
  static async getXPHistory(userId: string, limit: number = 50): Promise<XPTransaction[]> {
    try {
      console.log('🔍 Pobieranie historii XP dla:', userId)
      
      const xpHistoryQuery = query(
        collection(db, 'xpHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      )
      
      const snapshot = await getDocs(xpHistoryQuery)
      
      console.log('✅ Znaleziono', snapshot.docs.length, 'transakcji XP')
      
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          userId: data.userId,
          amount: data.amount,
          source: data.source as XPSource,
          timestamp: data.timestamp,
          description: data.description
        }
      })
      
      console.log('📊 Transakcje:', transactions)
      
      return transactions
      
    } catch (error) {
      console.error('❌ Błąd pobierania historii XP:', error)
      return []
    }
  }

  /**
   * 📊 STATYSTYKI XP - FIXED!
   */
  static async getXPStats(userId: string): Promise<{
    totalXP: number
    level: number
    xpThisWeek: number
    xpThisMonth: number
    topSource: XPSource | null
  }> {
    try {
      console.log('📊 Pobieranie statystyk XP dla:', userId)
      
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) {
        console.log('❌ Użytkownik nie istnieje')
        return { totalXP: 0, level: 1, xpThisWeek: 0, xpThisMonth: 0, topSource: null }
      }

      const userData = userSnap.data()
      const totalXP = userData.xp || 0
      const level = this.calculateLevel(totalXP)

      console.log('✅ Łączne XP:', totalXP, 'Poziom:', level)

      // Pobierz historię XP
      const history = await this.getXPHistory(userId, 100)

      console.log('📜 Historia XP:', history.length, 'transakcji')

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      let xpThisWeek = 0
      let xpThisMonth = 0
      const sourceCounts: Record<string, number> = {}

      history.forEach((tx) => {
        const txDate = tx.timestamp.toDate()
        
        if (txDate >= weekAgo) {
          xpThisWeek += tx.amount
          console.log('✅ XP z tego tygodnia:', tx.amount, 'Data:', txDate)
        }
        
        if (txDate >= monthAgo) {
          xpThisMonth += tx.amount
          console.log('✅ XP z tego miesiąca:', tx.amount, 'Data:', txDate)
        }

        sourceCounts[tx.source] = (sourceCounts[tx.source] || 0) + 1
      })

      console.log('📊 XP ten tydzień:', xpThisWeek)
      console.log('📊 XP ten miesiąc:', xpThisMonth)

      const topSource = Object.keys(sourceCounts).length > 0
        ? (Object.keys(sourceCounts).reduce((a, b) => 
            sourceCounts[a] > sourceCounts[b] ? a : b
          ) as XPSource)
        : null

      return {
        totalXP,
        level,
        xpThisWeek,
        xpThisMonth,
        topSource
      }
      
    } catch (error) {
      console.error('❌ Błąd pobierania statystyk XP:', error)
      return { totalXP: 0, level: 1, xpThisWeek: 0, xpThisMonth: 0, topSource: null }
    }
  }

  static getSourceDescription(source: XPSource): string {
    return this.XP_DESCRIPTIONS[source] || 'Nieznane źródło'
  }

  static getSourceAmount(source: XPSource): number {
    return this.XP_TABLE[source] || 0
  }

  static getAllSources(): Array<{
    source: XPSource
    amount: number
    description: string
  }> {
    return Object.keys(this.XP_TABLE).map(key => ({
      source: key as XPSource,
      amount: this.XP_TABLE[key as XPSource],
      description: this.XP_DESCRIPTIONS[key as XPSource]
    }))
  }
}
