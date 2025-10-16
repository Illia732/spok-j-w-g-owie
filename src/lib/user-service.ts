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
  limit
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { firebaseSearchService } from './firebase-search-service'

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
      updatedAt: new Date()
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
        lastMoodUpdate: data.lastMoodUpdate?.toDate()
      } as UserProfile
    } catch (error) {
      console.error('Błąd pobierania profilu:', error)
      return null
    }
  },

  // ✅ POPRAWIONE - używa firebaseSearchService
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
            updatedAt: new Date()
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

  // ✅ DODANA FUNKCJA calculateStreak
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
      
      if (moodEntries.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastEntryDate: null
        }
      }

      // Sortuj wpisy od najnowszego do najstarszego
      const sortedEntries = [...moodEntries].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let lastProcessedDate: Date | null = null

      for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = new Date(sortedEntries[i].timestamp)
        entryDate.setHours(0, 0, 0, 0)
        
        if (i === 0) {
          // Sprawdź czy najnowszy wpis jest z dzisiaj lub wczoraj
          const diffTime = today.getTime() - entryDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays <= 1) {
            currentStreak = 1
            tempStreak = 1
            lastProcessedDate = entryDate
          }
        } else {
          const prevEntryDate = new Date(sortedEntries[i - 1].timestamp)
          prevEntryDate.setHours(0, 0, 0, 0)
          
          const diffTime = prevEntryDate.getTime() - entryDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            // Kolejny dzień streak
            tempStreak++
            if (i === 1) {
              currentStreak = tempStreak
            }
          } else if (diffDays > 1) {
            // Przerwa w streak - zresetuj temp streak
            tempStreak = 0
          }
        }
        
        // Aktualizuj najdłuższy streak
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
      }

      return {
        currentStreak: Math.max(currentStreak, tempStreak),
        longestStreak: Math.max(longestStreak, currentStreak, tempStreak),
        lastEntryDate: sortedEntries.length > 0 ? new Date(sortedEntries[0].timestamp) : null
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

  // ✅ DODANA FUNKCJA calculateAdvancedStreak
  async calculateAdvancedStreak(userId: string): Promise<StreakData> {
    return this.calculateStreak(userId) // Używamy tej samej implementacji
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
      
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (moodEntries.length > 0) {
        const sortedEntries = [...moodEntries].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        
        const latestEntry = sortedEntries[0]
        const latestEntryDate = new Date(latestEntry.timestamp)
        latestEntryDate.setHours(0, 0, 0, 0)
        
        const isToday = latestEntryDate.getTime() === today.getTime()
        
        if (isToday) {
          streak = 1
          for (let i = 1; i < sortedEntries.length; i++) {
            const currentEntryDate = new Date(sortedEntries[i].timestamp)
            currentEntryDate.setHours(0, 0, 0, 0)
            
            const expectedDate = new Date(today)
            expectedDate.setDate(expectedDate.getDate() - i)
            
            if (currentEntryDate.getTime() === expectedDate.getTime()) {
              streak++
            } else {
              break
            }
          }
        }
      }

      const last30Days = 30
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

  // ✅ DODANE FUNKCJE DO ZARZĄDZANIA NASTROJAMI
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
        return entryDate.getTime() === today.getTime()
      })

      const newEntry = {
        mood,
        timestamp: today,
        date: today.toISOString().split('T')[0]
      }

      let updatedEntries
      if (existingEntryIndex !== -1) {
        // Aktualizuj istniejący wpis
        updatedEntries = [...user.moodEntries]
        updatedEntries[existingEntryIndex] = newEntry
      } else {
        // Dodaj nowy wpis
        updatedEntries = [newEntry, ...user.moodEntries]
      }

      await this.updateUserProfile(userId, {
        currentMood: mood,
        lastMoodUpdate: now,
        moodEntries: updatedEntries
      })

      console.log(`✅ Nastrój zapisany: ${mood}% dla użytkownika ${user.displayName}`)
    } catch (error) {
      console.error('Błąd zapisywania nastroju:', error)
      throw error
    }
  },

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
        return entryDate.getTime() === today.getTime()
      })

      const newEntry = {
        mood,
        note: note || '',
        timestamp: today,
        date: today.toISOString().split('T')[0]
      }

      let updatedEntries
      if (existingEntryIndex !== -1) {
        // Aktualizuj istniejący wpis
        updatedEntries = [...user.moodEntries]
        updatedEntries[existingEntryIndex] = newEntry
      } else {
        // Dodaj nowy wpis
        updatedEntries = [newEntry, ...user.moodEntries]
      }

      await this.updateUserProfile(userId, {
        currentMood: mood,
        lastMoodUpdate: now,
        moodEntries: updatedEntries
      })

      console.log(`✅ Nastrój z notatką zapisany: ${mood}% dla użytkownika ${user.displayName}`)
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
        return { ...request, fromUserProfile }
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
      
      const friends = await Promise.all(friendIds.map(id => this.findUserById(id)))
      callback(friends.filter(Boolean) as UserProfile[])
    })
  },

  // ✅ DODANE FUNKCJE DO ZARZĄDZANIA POZIOMEM I XP
  async addXP(userId: string, xpToAdd: number): Promise<void> {
    try {
      const user = await this.getUserProfile(userId)
      if (!user) return

      const newXP = user.xp + xpToAdd
      const newLevel = Math.floor(newXP / 100) + 1 // 100 XP na poziom

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
        consistency: stats.consistency
      })
    } catch (error) {
      console.error('Błąd aktualizacji konsystencji:', error)
    }
  },

  // ✅ DODANE FUNKCJE DO ZARZĄDZANIA PROFILAMI
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

  // ✅ DODANE FUNKCJE DO OBSŁUGI NOTYFIKACJI
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
  }
}

export default userService