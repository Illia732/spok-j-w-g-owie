// src/lib/friends-service.ts
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
  getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FriendRequest } from '@/types/user' // 👈 USUWAMY FriendActivity

// 👇 DODAJEMY BRAKUJĄCE TYPY
interface Friendship {
  id: string
  userId: string
  friendId: string
  friendName: string
  createdAt: Date
  moodVisibility: 'average' | 'detailed' | 'none'
  streak: number
}

interface FriendActivity {
  id: string
  userId: string
  type: 'mood_update' | 'streak_achievement' | 'level_up'
  description: string
  createdAt: Date
}

export const friendsService = {
  // Wysyłanie zaproszenia
  async sendFriendRequest(fromUserId: string, toUserEmail: string) {
    // Najpierw znajdź użytkownika po emailu
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', toUserEmail.toLowerCase())
    )
    const userSnapshot = await getDocs(usersQuery)
    
    if (userSnapshot.empty) {
      throw new Error('Nie znaleziono użytkownika o podanym adresie email')
    }

    const toUser = userSnapshot.docs[0]
    const toUserId = toUser.id
    const toUserData = toUser.data()

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

    // Pobierz dane nadawcy
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId))
    const fromUserData = fromUserDoc.data()

    // Utwórz zaproszenie
    const request: Omit<FriendRequest, 'id'> = {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date()
    }

    await addDoc(collection(db, 'friendRequests'), request)
  },

  // Akceptowanie zaproszenia
  async acceptFriendRequest(requestId: string) {
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

    // Aktualizuj status zaproszenia
    await updateDoc(requestRef, {
      status: 'accepted'
    })

    // Utwórz przyjaźń dla obu użytkowników
    const friendship1: Omit<Friendship, 'id'> = {
      userId: request.fromUserId,
      friendId: request.toUserId,
      friendName: toUserData?.displayName || toUserData?.email || 'Uytkownik',
      createdAt: new Date(),
      moodVisibility: 'average',
      streak: 0
    }

    const friendship2: Omit<Friendship, 'id'> = {
      userId: request.toUserId,
      friendId: request.fromUserId,
      friendName: fromUserData?.displayName || fromUserData?.email || 'Uytkownik',
      createdAt: new Date(),
      moodVisibility: 'average',
      streak: 0
    }

    await Promise.all([
      addDoc(collection(db, 'friendships'), friendship1),
      addDoc(collection(db, 'friendships'), friendship2)
    ])
  },

  // Odrzucanie zaproszenia
  async rejectFriendRequest(requestId: string) {
    const requestRef = doc(db, 'friendRequests', requestId)
    await updateDoc(requestRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    })
  },

  // Usuwanie przyjaciela
  async removeFriend(friendshipId: string) {
    const friendshipRef = doc(db, 'friendships', friendshipId)
    const friendshipDoc = await getDoc(friendshipRef)
    const friendship = friendshipDoc.data() as Friendship

    if (!friendship) return

    // Znajdź i usuń obie strony przyjaźni
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('userId', 'in', [friendship.userId, friendship.friendId]),
      where('friendId', 'in', [friendship.userId, friendship.friendId])
    )

    const friendshipsSnapshot = await getDocs(friendshipsQuery)
    const deletePromises = friendshipsSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    )

    await Promise.all(deletePromises)
  },

  // Pobieranie listy przyjaciół
  async getFriends(userId: string): Promise<Friendship[]> {
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
  },

  // Pobieranie zaproszeń
  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
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
  },

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
  }
}