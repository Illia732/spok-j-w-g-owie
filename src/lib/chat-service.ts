import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
  type: 'text' | 'image' | 'system'
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageTime: Date
  unreadCount: number
  participantProfiles?: any[] // Dane użytkowników w konwersacji
}

export const chatService = {
  // Utwórz nową konwersację
  async createConversation(user1Id: string, user2Id: string): Promise<string> {
    const participants = [user1Id, user2Id].sort()
    const conversationId = participants.join('_')
    
    const conversationRef = doc(db, 'conversations', conversationId)
    const conversationSnap = await getDoc(conversationRef)
    
    if (!conversationSnap.exists()) {
      await updateDoc(conversationRef, {
        participants,
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp()
      })
    }
    
    return conversationId
  },

  // Wyślij wiadomość
  async sendMessage(conversationId: string, senderId: string, receiverId: string, content: string): Promise<void> {
    const messageData = {
      conversationId,
      senderId,
      receiverId,
      content: content.trim(),
      timestamp: serverTimestamp(),
      read: false,
      type: 'text'
    }

    // Dodaj wiadomość
    await addDoc(collection(db, 'messages'), messageData)
    
    // Aktualizuj konwersację
    const conversationRef = doc(db, 'conversations', conversationId)
    await updateDoc(conversationRef, {
      lastMessage: content,
      lastMessageTime: serverTimestamp()
    })
  },

  // Pobierz konwersacje użytkownika
  async getConversations(userId: string): Promise<Conversation[]> {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    )
    
    const snapshot = await getDocs(conversationsQuery)
    const conversations: Conversation[] = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const conversation: Conversation = {
        id: doc.id,
        participants: data.participants,
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        unreadCount: 0
      }

      // Pobierz nieprzeczytane wiadomości
      const unreadQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', doc.id),
        where('receiverId', '==', userId),
        where('read', '==', false)
      )
      const unreadSnapshot = await getDocs(unreadQuery)
      conversation.unreadCount = unreadSnapshot.size

      conversations.push(conversation)
    }

    return conversations
  },

  // Pobierz wiadomości z konwersacji
  async getMessages(conversationId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(messagesQuery)
    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    } as ChatMessage)).reverse()

    return messages
  },

  // Oznacz wiadomości jako przeczytane
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const unreadQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    )
    
    const snapshot = await getDocs(unreadQuery)
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    )
    
    await Promise.all(updatePromises)
  },

  // Real-time subscription do konwersacji
  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    )
    
    return onSnapshot(conversationsQuery, async (snapshot) => {
      const conversations: Conversation[] = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          
          const unreadQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', doc.id),
            where('receiverId', '==', userId),
            where('read', '==', false)
          )
          const unreadSnapshot = await getDocs(unreadQuery)
          
          return {
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            unreadCount: unreadSnapshot.size
          }
        })
      )
      
      callback(conversations)
    })
  },

  // Real-time subscription do wiadomości
  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    )
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ChatMessage))
      
      callback(messages)
    })
  },

  // Sprawdź czy konwersacja istnieje
  async getConversationBetweenUsers(user1Id: string, user2Id: string): Promise<string | null> {
    const participants = [user1Id, user2Id].sort()
    const conversationId = participants.join('_')
    
    const conversationRef = doc(db, 'conversations', conversationId)
    const conversationSnap = await getDoc(conversationRef)
    
    return conversationSnap.exists() ? conversationId : null
  }
}