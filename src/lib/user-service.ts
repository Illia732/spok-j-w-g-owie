// src/lib/user-service.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { firebaseSearchService } from './firebase-search-service'
import { XPService, XPSource } from './xp-service'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  friends: string[]
  streak: number
  level: number
  xp: number
  consistency: number
  currentMood?: number
  lastMoodUpdate?: Date
  moodEntries: any[]
  createdAt: Date
  updatedAt: Date
  bio?: string
  role?: 'user' | 'admin'
  hasAddedFirstMood?: boolean
  lastDailyXP?: Timestamp
  lastStreak7Reward?: Timestamp
  lastStreak30Reward?: Timestamp
  readArticles?: string[]
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastEntryDate: Date | null
}

/**
 * 🔥 OBLICZA PASSĘ UŻYTKOWNIKA (ile dni z rzędu dodawał nastrój)
 */
function calculateStreakFromMoods(moods: any[]): number {
  if (!moods || moods.length === 0) return 0
  
  // Sortuj wg daty (najnowsze pierwsze)
  const sortedMoods = [...moods].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  // Sprawdź czy jest wpis dzisiaj lub wczoraj
  const latestMood = sortedMoods[0]
  const latestDate = new Date(latestMood.timestamp)
  latestDate.setHours(0, 0, 0, 0)
  
  const diffTime = currentDate.getTime() - latestDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Jeśli ostatni wpis był więcej niż wczoraj - brak passy
  if (diffDays > 1) return 0
  
  // Zlicz ile dni z rzędu ma wpisy
  for (let i = 0; i < sortedMoods.length; i++) {
    const moodDate = new Date(sortedMoods[i].timestamp)
    moodDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - i)
    
    if (moodDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

const userService = {
  async initializeUserProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
    const userProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      firstName: displayName?.split(' ')[0] || '',
      lastName: displayName?.split(' ')[1] || '',
      friends: [],
      streak: 0,
      level: 1,
      xp: 0,
      consistency: 0,
      moodEntries: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      hasAddedFirstMood: false,
      readArticles: []
    }

    await setDoc(doc(db, 'users', uid), userProfile)
    console.log('✅ Nowy profil utworzony:', userProfile.displayName)
    
    return userProfile
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (!userDoc.exists()) {
        return null
      }
      
      const data = userDoc.data()
      
      return { 
        uid, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMoodUpdate: data.lastMoodUpdate?.toDate(),
        lastDailyXP: data.lastDailyXP,
        lastStreak7Reward: data.lastStreak7Reward,
        lastStreak30Reward: data.lastStreak30Reward
      } as UserProfile
    } catch (error) {
      console.error('Błąd pobierania profilu:', error)
      return null
    }
  },

  /**
   * 🎯 POBIERZ WSZYSTKICH UŻYTKOWNIKÓW (dla admina)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(usersQuery)
      const users: UserProfile[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMoodUpdate: data.lastMoodUpdate?.toDate(),
        } as UserProfile)
      })
      
      console.log(`✅ Pobrano ${users.length} użytkowników`)
      return users
    } catch (error) {
      console.error('❌ Błąd pobierania użytkowników:', error)
      return []
    }
  },

  /**
   * 🔍 ZNAJDŹ UŻYTKOWNIKA PO EMAILU
   */
  async findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase()),
        limit(1)
      )
      
      const snapshot = await getDocs(usersQuery)
      
      if (snapshot.empty) {
        return null
      }
      
      const doc = snapshot.docs[0]
      const data = doc.data()
      
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMoodUpdate: data.lastMoodUpdate?.toDate(),
      } as UserProfile
    } catch (error) {
      console.error('❌ Błąd wyszukiwania użytkownika po email:', error)
      return null
    }
  },

  /**
   * 📊 POBIERZ STATYSTYKI WSZYSTKICH UŻYTKOWNIKÓW
   */
  async getUsersStats(): Promise<{
    totalUsers: number
    activeToday: number
    newThisWeek: number
    admins: number
  }> {
    try {
      const users = await this.getAllUsers()
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const activeToday = users.filter(user => {
        if (!user.lastMoodUpdate) return false
        const lastUpdate = new Date(user.lastMoodUpdate)
        return lastUpdate >= today
      }).length
      
      const newThisWeek = users.filter(user => 
        user.createdAt >= weekAgo
      ).length
      
      const admins = users.filter(user => user.role === 'admin').length
      
      return {
        totalUsers: users.length,
        activeToday,
        newThisWeek,
        admins
      }
    } catch (error) {
      console.error('❌ Błąd pobierania statystyk użytkowników:', error)
      return {
        totalUsers: 0,
        activeToday: 0,
        newThisWeek: 0,
        admins: 0
      }
    }
  },

  /**
   * 🔧 ZMIEŃ ROLĘ UŻYTKOWNIKA
   */
  async changeUserRole(userId: string, newRole: 'user' | 'admin'): Promise<void> {
    try {
      await this.updateUserProfile(userId, { role: newRole })
      console.log(`✅ Zmieniono rolę użytkownika ${userId} na: ${newRole}`)
    } catch (error) {
      console.error('❌ Błąd zmiany roli użytkownika:', error)
      throw error
    }
  },

  /**
   * 📧 POBIERZ UŻYTKOWNIKÓW Z FILTRAMI
   */
  async getUsersWithFilters(filters: {
    search?: string
    role?: string
    isBlocked?: boolean
  } = {}): Promise<UserProfile[]> {
    try {
      let users = await this.getAllUsers()
      
      // Filtruj po wyszukiwaniu
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        users = users.filter(user =>
          user.email.toLowerCase().includes(searchTerm) ||
          user.displayName.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm)
        )
      }
      
      // Filtruj po roli
      if (filters.role) {
        users = users.filter(user => user.role === filters.role)
      }
      
      // Filtruj po statusie blokady
      if (filters.isBlocked !== undefined) {
        users = users.filter(user => user.isBlocked === filters.isBlocked)
      }
      
      return users
    } catch (error) {
      console.error('❌ Błąd filtrowania użytkowników:', error)
      return []
    }
  },

  async findUsersByName(searchTerm: string, currentUserId: string): Promise<UserProfile[]> {
    try {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        return []
      }

      console.log(`🔍 Szukam w Firebase: "${searchTerm}"`)
      
      const searchResults = await firebaseSearchService.searchUsers(searchTerm, currentUserId)
      
      const userProfiles = await Promise.all(
        searchResults.map(async (user) => {
          const fullProfile = await this.getUserProfile(user.uid)
          return fullProfile || {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            friends: [],
            streak: user.streak,
            level: user.level,
            xp: 0,
            consistency: 0,
            moodEntries: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            hasAddedFirstMood: false,
            readArticles: []
          }
        })
      )
      
      return userProfiles.filter(Boolean) as UserProfile[]
    } catch (error) {
      console.error('Błąd wyszukiwania użytkowników:', error)
      return []
    }
  },

  async findUserById(uid: string): Promise<UserProfile | null> {
    try {
      return await this.getUserProfile(uid)
    } catch (error) {
      console.error('Błąd wyszukiwania użytkownika po ID:', error)
      return null
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      console.log('✅ Profil zaktualizowany:', updates)
    } catch (error) {
      console.error('Błąd aktualizacji profilu:', error)
      throw error
    }
  },

  async uploadAvatar(uid: string, file: File): Promise<string> {
    const storageRef = ref(storage, `avatars/${uid}/${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    await this.updateUserProfile(uid, { avatarUrl: downloadURL })
    
    return downloadURL
  },

  async calculateStreak(userId: string): Promise<StreakData> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastEntryDate: null
        }
      }

      const moodEntries = user.moodEntries || []
      const currentStreak = calculateStreakFromMoods(moodEntries)
      
      return {
        currentStreak,
        longestStreak: Math.max(currentStreak, user.streak || 0),
        lastEntryDate: moodEntries.length > 0 ? new Date(moodEntries[0].timestamp) : null
      }
    } catch (error) {
      console.error('Błąd obliczania streak:', error)
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null
      }
    }
  },

  async calculateAdvancedStreak(userId: string): Promise<StreakData> {
    return this.calculateStreak(userId)
  },

  async getUserStats(userId: string): Promise<{
    streak: number;
    moodEntries: number;
    consistency: number;
    friends: number;
  }> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) {
        return {
          streak: 0,
          moodEntries: 0,
          consistency: 0,
          friends: 0
        }
      }

      const moodEntries = user.moodEntries || []
      const totalEntries = moodEntries.length
      const streak = calculateStreakFromMoods(moodEntries)

      const last30Days = 30
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let entriesLast30Days = 0
      const uniqueDays = new Set()
      
      moodEntries.forEach(entry => {
        const entryDate = new Date(entry.timestamp)
        const diffTime = today.getTime() - entryDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays < last30Days) {
          const dateKey = entryDate.toDateString()
          if (!uniqueDays.has(dateKey)) {
            uniqueDays.add(dateKey)
            entriesLast30Days++
          }
        }
      })
      
      const consistency = last30Days > 0 
        ? Math.round((entriesLast30Days / last30Days) * 100)
        : 0

      const friendsCount = user?.friends?.length || 0

      return {
        streak,
        moodEntries: totalEntries,
        consistency,
        friends: friendsCount
      }
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error)
      return {
        streak: 0,
        moodEntries: 0,
        consistency: 0,
        friends: 0
      }
    }
  },

  /**
   * 🎭 ZAPISUJE NASTRÓJ + PRZYZNAJE XP + SPRAWDZA PASSĘ
   */
  async saveMood(userId: string, mood: number): Promise<void> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) {
        throw new Error('Nie znaleziono użytkownika')
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const existingEntryIndex = user.moodEntries.findIndex((entry: any) => {
        const entryDate = new Date(entry.timestamp)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })

      const newEntry = {
        mood,
        timestamp: today,
        date: today.toISOString().split('T')[0]
      }

      let updatedEntries
      const isNewEntry = existingEntryIndex === -1

      if (!isNewEntry) {
        // Aktualizuj istniejący wpis
        updatedEntries = [...user.moodEntries]
        updatedEntries[existingEntryIndex] = newEntry
      } else {
        // Dodaj nowy wpis
        updatedEntries = [newEntry, ...user.moodEntries]
      }

      // Oblicz passę
      const streak = calculateStreakFromMoods(updatedEntries)

      // Zaktualizuj profil
      await this.updateUserProfile(userId, {
        currentMood: mood,
        lastMoodUpdate: now,
        moodEntries: updatedEntries,
        streak
      })

      // 🎁 PRZYZNAJ XP ZA NASTRÓJ (tylko dla nowych wpisów)
      if (isNewEntry) {
        const isFirstMood = !user.hasAddedFirstMood
        
        if (isFirstMood) {
          // Pierwszy nastrój = bonus 50 XP
          await XPService.awardXP(userId, XPSource.FIRST_MOOD)
          await updateDoc(doc(db, 'users', userId), { hasAddedFirstMood: true })
          console.log('✅ +50 XP za pierwszy nastrój!')
        } else {
          // Normalny nastrój = 10 XP
          await XPService.awardXP(userId, XPSource.MOOD_ENTRY)
          console.log('✅ +10 XP za dodanie nastroju')
        }

        // 🔥 PRZYZNAJ XP ZA PASSĘ (jeśli spełnia warunki)
        if (streak >= 7 || streak >= 30) {
          await XPService.awardStreakXP(userId, streak)
          console.log(`🔥 Sprawdzono passę: ${streak} dni`)
        }
      }

      await this.updateConsistency(userId)
      console.log(`✅ Nastrój zapisany: ${mood}% (passa: ${streak} dni)`)
    } catch (error) {
      console.error('Błąd zapisywania nastroju:', error)
      throw error
    }
  },

  /**
   * 🎭 ZAPISUJE NASTRÓJ Z NOTATKĄ + XP + PASSA
   */
  async saveMoodWithNote(userId: string, mood: number, note?: string): Promise<void> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) {
        throw new Error('Nie znaleziono użytkownika')
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const existingEntryIndex = user.moodEntries.findIndex((entry: any) => {
        const entryDate = new Date(entry.timestamp)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })

      const newEntry = {
        mood,
        note: note || '',
        timestamp: today,
        date: today.toISOString().split('T')[0]
      }

      let updatedEntries
      const isNewEntry = existingEntryIndex === -1

      if (!isNewEntry) {
        // Aktualizuj istniejący wpis
        updatedEntries = [...user.moodEntries]
        updatedEntries[existingEntryIndex] = newEntry
      } else {
        // Dodaj nowy wpis
        updatedEntries = [newEntry, ...user.moodEntries]
      }

      // Oblicz passę
      const streak = calculateStreakFromMoods(updatedEntries)

      // Zaktualizuj profil
      await this.updateUserProfile(userId, {
        currentMood: mood,
        lastMoodUpdate: now,
        moodEntries: updatedEntries,
        streak
      })

      // 🎁 PRZYZNAJ XP ZA NASTRÓJ (tylko dla nowych wpisów)
      if (isNewEntry) {
        const isFirstMood = !user.hasAddedFirstMood
        
        if (isFirstMood) {
          await XPService.awardXP(userId, XPSource.FIRST_MOOD)
          await updateDoc(doc(db, 'users', userId), { hasAddedFirstMood: true })
          console.log('✅ +50 XP za pierwszy nastrój!')
        } else {
          await XPService.awardXP(userId, XPSource.MOOD_ENTRY)
          console.log('✅ +10 XP za dodanie nastroju z notatką')
        }

        // 🔥 PRZYZNAJ XP ZA PASSĘ
        if (streak >= 7 || streak >= 30) {
          await XPService.awardStreakXP(userId, streak)
          console.log(`🔥 Sprawdzono passę: ${streak} dni`)
        }
      }

      await this.updateConsistency(userId)
      console.log(`✅ Nastrój z notatką zapisany: ${mood}% (passa: ${streak} dni)`)
    } catch (error) {
      console.error('Błąd zapisywania nastroju z notatką:', error)
      throw error
    }
  },

  async getMoodHistory(userId: string, days: number = 30): Promise<any[]> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) {
        return []
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      return user.moodEntries
        .filter((entry: any) => new Date(entry.timestamp) >= cutoffDate)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('Błąd pobierania historii nastrojów:', error)
      return []
    }
  },

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
      throw new Error('Nie możesz dodać siebie jako znajomego')
    }

    const toUser = await this.findUserById(toUserId)
    if (!toUser) {
      throw new Error('Nie znaleziono użytkownika')
    }

    const existingRequest = await this.checkExistingRequest(fromUserId, toUserId)
    if (existingRequest) {
      throw new Error('Zaproszenie do tego użytkownika już istnieje')
    }

    const fromUser = await this.findUserById(fromUserId)
    if (!fromUser) {
      throw new Error('Nie znaleziono Twojego profilu')
    }

    if (fromUser.friends?.includes(toUserId)) {
      throw new Error('Już jesteście znajomymi')
    }

    const request: Omit<FriendRequest, 'id'> = {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date()
    }

    await addDoc(collection(db, 'friendRequests'), request)
    console.log(`✅ Zaproszenie wysłane od ${fromUserId} do ${toUserId}`)
  },

  async checkExistingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(requestsQuery)
    return !snapshot.empty
  },

  async acceptFriendRequest(requestId: string, currentUserId: string): Promise<void> {
    const requestRef = doc(db, 'friendRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) {
      throw new Error('Zaproszenie nie istnieje')
    }

    const request = requestDoc.data() as FriendRequest

    const fromUser = await this.findUserById(request.fromUserId)
    const toUser = await this.findUserById(request.toUserId)

    if (!fromUser || !toUser) {
      throw new Error('Nie znaleziono użytkowników')
    }

    await Promise.all([
      this.updateUserProfile(fromUser.uid, {
        friends: [...(fromUser.friends || []), request.toUserId]
      }),
      this.updateUserProfile(toUser.uid, {
        friends: [...(toUser.friends || []), request.fromUserId]
      }),
      updateDoc(requestRef, { status: 'accepted' })
    ])

    // 🎁 PRZYZNAJ XP ZA ZNAJOMYCH
    try {
      // Użytkownik który wysłał zaproszenie dostaje bonus XP
      await XPService.awardXP(request.fromUserId, XPSource.FRIEND_INVITED)
      console.log(`✅ +125 XP dla ${fromUser.displayName} (zaproszenie zaakceptowane)`)

      // Użytkownik który zaakceptował dostaje XP
      await XPService.awardXP(request.toUserId, XPSource.FRIEND_ADDED)
      console.log(`✅ +25 XP dla ${toUser.displayName} (dodano znajomego)`)
    } catch (error) {
      console.error('❌ Błąd przyznawania XP za znajomych:', error)
    }

    console.log(`✅ Zaproszenie zaakceptowane: ${fromUser.displayName} i ${toUser.displayName} są teraz znajomymi`)
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    const requestRef = doc(db, 'friendRequests', requestId)
    await updateDoc(requestRef, { status: 'rejected' })
    console.log('📭 Zaproszenie odrzucone')
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const user = await this.findUserById(userId)
    const friend = await this.findUserById(friendId)

    if (!user || !friend) {
      throw new Error('Nie znaleziono użytkowników')
    }

    await Promise.all([
      this.updateUserProfile(user.uid, {
        friends: user.friends?.filter((id: string) => id !== friendId) || []
      }),
      this.updateUserProfile(friend.uid, {
        friends: friend.friends?.filter((id: string) => id !== userId) || []
      })
    ])

    console.log(`👋 ${user.displayName} usunął ${friend.displayName} ze znajomych`)
  },

  async getFriends(userId: string): Promise<UserProfile[]> {
    const user = await this.findUserById(userId)
    if (!user) return []

    const friendIds = user.friends || []
    if (friendIds.length === 0) return []

    const friendsPromises = friendIds.map(id => this.findUserById(id))
    const friends = await Promise.all(friendsPromises)
    
    return friends.filter(Boolean) as UserProfile[]
  },

  async getFriendRequests(userId: string): Promise<(FriendRequest & { fromUserProfile?: UserProfile })[]> {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(requestsQuery)
    
    const requests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const request = { id: doc.id, ...doc.data() } as FriendRequest
        const fromUserProfile = await this.findUserById(request.fromUserId)
        return { ...request, fromUserProfile: fromUserProfile || undefined }
      })
    )
    
    console.log(`📨 Znaleziono ${requests.length} zaproszeń dla użytkownika ${userId}`)
    return requests
  },

  subscribeToFriends(userId: string, callback: (friends: UserProfile[]) => void) {
    const userRef = doc(db, 'users', userId)
    
    return onSnapshot(userRef, async (doc) => {
      if (!doc.exists()) {
        callback([])
        return
      }
      
      const user = doc.data()
      const friendIds = user.friends || []
      
      if (friendIds.length === 0) {
        callback([])
        return
      }
      
      const friends = await Promise.all(friendIds.map((id: string) => this.findUserById(id)))
      callback(friends.filter(Boolean) as UserProfile[])
    })
  },

  async addXP(userId: string, xpToAdd: number): Promise<void> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) return

      const newXP = user.xp + xpToAdd
      const newLevel = XPService.calculateLevel(newXP)

      await this.updateUserProfile(userId, {
        xp: newXP,
        level: newLevel
      })

      console.log(`✅ Dodano ${xpToAdd} XP użytkownikowi ${user.displayName}. Teraz ma ${newXP} XP (poziom ${newLevel})`)
    } catch (error) {
      console.error('Błąd dodawania XP:', error)
    }
  },

  async updateConsistency(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId)
      await this.updateUserProfile(userId, {
        consistency: stats.consistency,
        streak: stats.streak
      })
    } catch (error) {
      console.error('Błąd aktualizacji konsystencji:', error)
    }
  },

  async updateUserBio(userId: string, bio: string): Promise<void> {
    await this.updateUserProfile(userId, { bio })
  },

  async updateUserName(userId: string, displayName: string, firstName?: string, lastName?: string): Promise<void> {
    await this.updateUserProfile(userId, {
      displayName,
      firstName,
      lastName
    })
  },

  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snapshot = await getDocs(notificationsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
    } catch (error) {
      console.error('Błąd pobierania notyfikacji:', error)
      return []
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Błąd oznaczania notyfikacji jako przeczytanej:', error)
    }
  },

  async deleteUserAccount(uid: string): Promise<void> {
    try {
      console.log(`🗑️ Rozpoczynanie usuwania konta użytkownika: ${uid}`)
      
      // 1. Usuń profil użytkownika z Firestore
      const userRef = doc(db, 'users', uid)
      await deleteDoc(userRef)
      console.log('✅ Profil użytkownika usunięty z Firestore')
      
      // 2. Usuń dane związane z użytkownikiem
      await this.deleteUserData(uid)
      
      // 3. Usuń konto z Firebase Authentication
      // (To musi być wykonane po stronie klienta z reautentykacją)
      console.log('ℹ️ Konto użytkownika oznaczone do usunięcia z Authentication')
      
      console.log('✅ Wszystkie dane użytkownika zostały usunięte')
    } catch (error) {
      console.error('❌ Błąd podczas usuwania konta:', error)
      throw new Error('Nie udało się usunąć konta. Spróbuj ponownie.')
    }
  },

  async deleteUserData(uid: string): Promise<void> {
    try {
      console.log(`🧹 Czyszczenie danych użytkownika: ${uid}`)
      
      // Usuń zaproszenia do znajomych
      await this.deleteFriendRequests(uid)
      
      // Usuń powiązania znajomych
      await this.removeUserFromFriends(uid)
      
      // Tutaj możesz dodać usuwanie innych danych:
      // - notatki użytkownika
      // - zadania
      // - inne kolekcje powiązane z użytkownikiem
      
      console.log('✅ Wszystkie dane użytkownika zostały wyczyszczone')
    } catch (error) {
      console.error('❌ Błąd podczas czyszczenia danych użytkownika:', error)
      throw error
    }
  },

  async deleteFriendRequests(uid: string): Promise<void> {
    try {
      // Usuń zaproszenia wysłane PRZEZ użytkownika
      const sentRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', uid)
      )
      const sentRequestsSnapshot = await getDocs(sentRequestsQuery)
      
      const deleteSentPromises = sentRequestsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      
      // Usuń zaproszenia wysłane DO użytkownika
      const receivedRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', uid)
      )
      const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery)
      
      const deleteReceivedPromises = receivedRequestsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      
      await Promise.all([...deleteSentPromises, ...deleteReceivedPromises])
      console.log(`✅ Usunięto zaproszenia znajomych dla użytkownika: ${uid}`)
    } catch (error) {
      console.error('❌ Błąd podczas usuwania zaproszeń:', error)
    }
  },

  async removeUserFromFriends(uid: string): Promise<void> {
    try {
      // Znajdź wszystkich znajomych użytkownika
      const user = await this.getUserProfile(uid)
      if (!user) return
      
      const friendIds = user.friends || []
      
      // Usuń użytkownika z list znajomych wszystkich jego znajomych
      const updatePromises = friendIds.map(async (friendId: string) => {
        const friend = await this.getUserProfile(friendId)
        if (friend && friend.friends) {
          const updatedFriends = friend.friends.filter((id: string) => id !== uid)
          await this.updateUserProfile(friendId, { friends: updatedFriends })
        }
      })
      
      await Promise.all(updatePromises)
      console.log(`✅ Usunięto użytkownika z list znajomych: ${uid}`)
    } catch (error) {
      console.error('❌ Błąd podczas usuwania z list znajomych:', error)
    }
  },
}

export default userService