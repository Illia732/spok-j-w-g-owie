// src/lib/friends-service.ts - CZĘŚĆ 1
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  arrayUnion
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FriendRequest } from '@/types/user'
import { XPService, XPSource } from '@/lib/xp-service'

interface Friendship {
  id: string
  userId: string
  friendId: string
  friendName: string
  friendEmail: string
  createdAt: Date
  moodVisibility: 'average' | 'detailed' | 'none'
  streak: number
  viaInviteLink?: boolean
}

interface FriendActivity {
  id: string
  userId: string
  type: 'mood_update' | 'streak_achievement' | 'level_up'
  description: string
  createdAt: Date
}

export interface InviteLink {
  id: string
  createdBy: string
  createdByName: string
  createdAt: Date
  expiresAt: Date
  usedBy: string[]
  maxUses: number
  isActive: boolean
  userType?: 'new' | 'existing'
}

// Funkcje pomocnicze poza obiektem friendsService
async function isNewUser(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) return true
    
    const userData = userDoc.data()
    
    // Sprawdź czy użytkownik ma mniej niż 3 wpisy nastroju
    const moodEntriesQuery = query(
      collection(db, 'moodEntries'),
      where('userId', '==', userId)
    )
    const moodEntries = await getDocs(moodEntriesQuery)
    
    // Sprawdź czy użytkownik ma mniej niż 10 XP
    const userXP = userData?.xp || 0
    
    // Użytkownik jest "NOWY" jeśli ma mniej niż 3 wpisy nastroju i mniej niż 10 XP
    return moodEntries.size < 3 && userXP < 10
  } catch (error) {
    console.error('Błąd sprawdzania typu użytkownika:', error)
    return false
  }
}

async function checkExistingFriendship(userId1: string, userId2: string): Promise<boolean> {
  const friendshipQuery = query(
    collection(db, 'friendships'),
    where('userId', '==', userId1),
    where('friendId', '==', userId2)
  )
  
  const snapshot = await getDocs(friendshipQuery)
  return !snapshot.empty
}

async function createFriendship(
  user1Id: string, 
  user2Id: string, 
  user1Name: string, 
  user2Name: string
): Promise<void> {
  // Pobierz dane użytkowników
  const [user1Doc, user2Doc] = await Promise.all([
    getDoc(doc(db, 'users', user1Id)),
    getDoc(doc(db, 'users', user2Id))
  ])

  const user1Data = user1Doc.data()
  const user2Data = user2Doc.data()

  // Utwórz przyjaźń dla obu użytkowników
  const friendship1 = {
    userId: user1Id,
    friendId: user2Id,
    friendName: user2Data?.displayName || user2Name,
    friendEmail: user2Data?.email || '',
    createdAt: serverTimestamp(),
    moodVisibility: 'average',
    streak: 0,
    viaInviteLink: true
  }

  const friendship2 = {
    userId: user2Id,
    friendId: user1Id,
    friendName: user1Data?.displayName || user1Name,
    friendEmail: user1Data?.email || '',
    createdAt: serverTimestamp(),
    moodVisibility: 'average',
    streak: 0,
    viaInviteLink: true
  }

  await Promise.all([
    addDoc(collection(db, 'friendships'), friendship1),
    addDoc(collection(db, 'friendships'), friendship2)
  ])
}

function generateInviteId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
// src/lib/friends-service.ts - CZĘŚĆ 2
// Główny obiekt serwisu
export const friendsService = {
  // Wysyłanie zaproszenia
  async sendFriendRequest(fromUserId: string, fromUserName: string, toUserId: string) {
    try {
      // Sprawdź czy zaproszenie już istnieje
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', 'in', ['pending', 'accepted'])
      )
      const existingRequest = await getDocs(existingRequestQuery)

      if (!existingRequest.empty) {
        throw new Error('Zaproszenie do tej osoby już istnieje')
      }

      // Utwórz zaproszenie
      const request: Omit<FriendRequest, 'id'> = {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: new Date()
      }

      await addDoc(collection(db, 'friendRequests'), request)
      console.log('📧 Zaproszenie wysłane')
    } catch (error) {
      console.error('Błąd wysyłania zaproszenia:', error)
      throw error
    }
  },

  // Akceptowanie zaproszenia
  async acceptFriendRequest(requestId: string, currentUserId: string) {
    try {
      const requestRef = doc(db, 'friendRequests', requestId)
      const requestDoc = await getDoc(requestRef)
      const request = requestDoc.data() as FriendRequest

      if (!request) throw new Error('Zaproszenie nie istnieje')
      
      const [fromUserDoc, toUserDoc] = await Promise.all([
        getDoc(doc(db, 'users', request.fromUserId)),
        getDoc(doc(db, 'users', request.toUserId))
      ])

      const fromUserData = fromUserDoc.data()
      const toUserData = toUserDoc.data()

      // Sprawdź czy użytkownik jest NOWY
      const userIsNew = await isNewUser(currentUserId)

      // Aktualizuj status zaproszenia
      await updateDoc(requestRef, {
        status: 'accepted'
      })

      // Utwórz przyjaźń dla obu użytkowników
      const friendship1 = {
        userId: request.fromUserId,
        friendId: request.toUserId,
        friendName: toUserData?.displayName || toUserData?.email || 'Użytkownik',
        friendEmail: toUserData?.email || '',
        createdAt: new Date(),
        moodVisibility: 'average',
        streak: 0
      }

      const friendship2 = {
        userId: request.toUserId,
        friendId: request.fromUserId,
        friendName: fromUserData?.displayName || fromUserData?.email || 'Użytkownik',
        friendEmail: fromUserData?.email || '',
        createdAt: new Date(),
        moodVisibility: 'average',
        streak: 0
      }

      await Promise.all([
        addDoc(collection(db, 'friendships'), friendship1),
        addDoc(collection(db, 'friendships'), friendship2)
      ])

      // 🎁 PRZYZNAJ XP DLA OBU UŻYTKOWNIKÓW
      try {
        if (userIsNew) {
          // NOWY użytkownik - 125 XP dla obojga
          await XPService.awardXP(request.fromUserId, XPSource.FRIEND_INVITED)
          await XPService.awardXP(request.toUserId, XPSource.FRIEND_VIA_LINK)
          console.log(`✅ +125 XP dla ${request.fromUserId} (zaproszenie NOWEGO użytkownika)`)
          console.log(`✅ +125 XP dla ${request.toUserId} (NOWY użytkownik zaakceptował)`)
        } else {
          // Istniejący użytkownik - 25 XP dla obojga
          await XPService.awardXP(request.fromUserId, XPSource.FRIEND_ADDED)
          await XPService.awardXP(request.toUserId, XPSource.FRIEND_ADDED)
          console.log(`✅ +25 XP dla ${request.fromUserId} (dodano znajomego)`)
          console.log(`✅ +25 XP dla ${request.toUserId} (dodano znajomego)`)
        }
      } catch (error) {
        console.error('❌ Błąd przyznawania XP za znajomych:', error)
      }
    } catch (error) {
      console.error('Błąd akceptowania zaproszenia:', error)
      throw error
    }
  },

  // Odrzucanie zaproszenia
  async rejectFriendRequest(requestId: string) {
    try {
      const requestRef = doc(db, 'friendRequests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Błąd odrzucania zaproszenia:', error)
      throw error
    }
  },

  // Usuwanie przyjaciela
  async removeFriend(userId: string, friendId: string) {
    try {
      // Znajdź i usuń obie strony przyjaźni
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('userId', 'in', [userId, friendId]),
        where('friendId', 'in', [userId, friendId])
      )

      const friendshipsSnapshot = await getDocs(friendshipsQuery)
      const deletePromises = friendshipsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      )

      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Błąd usuwania znajomego:', error)
      throw error
    }
  },

  // Pobieranie listy przyjaciół
  async getFriends(userId: string): Promise<Friendship[]> {
    try {
      const friendsQuery = query(
        collection(db, 'friendships'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(friendsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friendship[]
    } catch (error) {
      console.error('Błąd pobierania znajomych:', error)
      return []
    }
  },

  // Pobieranie zaproszeń
  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(requestsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[]
    } catch (error) {
      console.error('Błąd pobierania zaproszeń:', error)
      return []
    }
  },
  // src/lib/friends-service.ts - CZĘŚĆ 3
  // Subskrypcja przyjaciół (real-time)
  subscribeToFriends(userId: string, callback: (friends: Friendship[]) => void) {
    const friendsQuery = query(
      collection(db, 'friendships'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(friendsQuery, (snapshot) => {
      const friends = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friendship[]
      callback(friends)
    })
  },

  // Wyszukiwanie użytkowników
  async searchUsers(searchTerm: string, currentUserId: string): Promise<any[]> {
    try {
      if (searchTerm.length < 2) return []

      const usersQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      )

      const snapshot = await getDocs(usersQuery)
      const users = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        }))
        .filter(user => user.uid !== currentUserId)

      return users
    } catch (error) {
      console.error('Błąd wyszukiwania użytkowników:', error)
      return []
    }
  },

  // Pobieranie sugerowanych znajomych
  async getSuggestedFriends(userId: string): Promise<any[]> {
    try {
      // Prosta implementacja - zwraca pustą tablicę
      // Możesz rozbudować o bardziej zaawansowane sugestie
      return []
    } catch (error) {
      console.error('Błąd pobierania sugerowanych znajomych:', error)
      return []
    }
  },

  async generateInviteLink(
    userId: string, 
    userName: string,
    maxUses: number = 10,
    expiresInDays: number = 30
  ): Promise<string> {
    try {
      const inviteId = generateInviteId()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      const inviteLink: InviteLink = {
        id: inviteId,
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date(),
        expiresAt,
        usedBy: [],
        maxUses,
        isActive: true
      }

      await setDoc(doc(db, 'inviteLinks', inviteId), inviteLink)
      
      const inviteUrl = `${window.location.origin}/dashboard/friends?invite=${inviteId}`
      return inviteUrl
    } catch (error) {
      console.error('Błąd generowania linku zaproszenia:', error)
      throw error
    }
  },
  // src/lib/friends-service.ts - CZĘŚĆ 4
  /**
   * Obsługuje kliknięcie w link zaproszenia
   */
  async handleInviteClick(
    inviteId: string, 
    currentUserId: string
  ): Promise<{
    success: boolean
    message: string
    creatorName?: string
    alreadyFriends?: boolean
  }> {
    try {
      // Sprawdź czy link istnieje
      const inviteDoc = await getDoc(doc(db, 'inviteLinks', inviteId))
      if (!inviteDoc.exists()) {
        return { success: false, message: 'Link zaproszenia nie istnieje' }
      }

      const invite = inviteDoc.data() as InviteLink

      // Sprawdź czy link jest aktywny
      if (!invite.isActive) {
        return { success: false, message: 'Link zaproszenia jest nieaktywny' }
      }

      // Sprawdź czy link nie wygasł
      if (new Date() > invite.expiresAt) {
        return { success: false, message: 'Link zaproszenia wygasł' }
      }

      // Sprawdź czy limit użyć nie został przekroczony
      if (invite.usedBy.length >= invite.maxUses) {
        return { success: false, message: 'Link zaproszenia został już wykorzystany' }
      }

      // Sprawdź czy użytkownik już użył tego linku
      if (invite.usedBy.includes(currentUserId)) {
        return { success: false, message: 'Już wykorzystałeś ten link zaproszenia' }
      }

      // Sprawdź czy użytkownik nie zaprasza samego siebie
      if (invite.createdBy === currentUserId) {
        return { success: false, message: 'Nie możesz użyć własnego linku zaproszenia' }
      }

      // Sprawdź czy użytkownicy są już znajomymi
      const existingFriendship = await checkExistingFriendship(invite.createdBy, currentUserId)
      if (existingFriendship) {
        return { 
          success: false, 
          message: 'Już jesteście znajomymi!',
          alreadyFriends: true,
          creatorName: invite.createdByName
        }
      }

      return {
        success: true,
        message: 'Link zaproszenia jest ważny',
        creatorName: invite.createdByName
      }

    } catch (error) {
      console.error('Błąd obsługi linku zaproszenia:', error)
      return { success: false, message: 'Błąd sprawdzania linku zaproszenia' }
    }
  },

  async acceptInvite(
    inviteId: string, 
    currentUserId: string,
    currentUserName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Sprawdź ponownie link
      const inviteCheck = await this.handleInviteClick(inviteId, currentUserId)
      if (!inviteCheck.success) {
        return inviteCheck
      }

      const inviteDoc = await getDoc(doc(db, 'inviteLinks', inviteId))
      const invite = inviteDoc.data() as InviteLink

      // Sprawdź czy użytkownik jest NOWY
      const userIsNew = await isNewUser(currentUserId)

      // Dodaj znajomych
      await createFriendship(invite.createdBy, currentUserId, invite.createdByName, currentUserName)

      // Oznacz link jako użyty
      await updateDoc(doc(db, 'inviteLinks', inviteId), {
        usedBy: arrayUnion(currentUserId),
        lastUsedAt: serverTimestamp(),
        userType: userIsNew ? 'new' : 'existing'
      })

      // 🎁 PRZYZNAJ XP W ZALEŻNOŚCI OD TYPU UŻYTKOWNIKA
      if (userIsNew) {
        // NOWY użytkownik - 125 XP dla obojga
        await XPService.awardXP(currentUserId, XPSource.FRIEND_VIA_LINK)
        await XPService.awardXP(invite.createdBy, XPSource.FRIEND_INVITED)
        console.log(`✅ +125 XP dla ${currentUserId} (NOWY użytkownik przez link)`)
        console.log(`✅ +125 XP dla ${invite.createdBy} (zaprosił NOWEGO użytkownika)`)
        
        return {
          success: true,
          message: `🎉 Jesteście teraz znajomymi z ${invite.createdByName}! Oboje otrzymaliście +125 XP za zaproszenie nowego użytkownika!`
        }
      } else {
        // Istniejący użytkownik - 25 XP dla obojga
        await XPService.awardXP(currentUserId, XPSource.FRIEND_EXISTING_VIA_LINK)
        await XPService.awardXP(invite.createdBy, XPSource.FRIEND_ADDED)
        console.log(`✅ +25 XP dla ${currentUserId} (istniejący użytkownik przez link)`)
        console.log(`✅ +25 XP dla ${invite.createdBy} (dodano istniejącego znajomego)`)
        
        return {
          success: true,
          message: `🎉 Jesteście teraz znajomymi z ${invite.createdByName}! Oboje otrzymaliście +25 XP!`
        }
      }

    } catch (error) {
      console.error('Błąd akceptowania zaproszenia:', error)
      return { success: false, message: 'Błąd akceptowania zaproszenia' }
    }
  }
}