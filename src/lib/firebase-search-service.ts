import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface SearchableUser {
  uid: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  avatarUrl?: string
  level: number
  streak: number
  currentMood?: number
}

export const firebaseSearchService = {
  async searchUsers(searchTerm: string, currentUserId: string): Promise<SearchableUser[]> {
    try {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        return []
      }

      console.log(`🔍 Szukam: "${searchTerm}"`)

      const usersRef = collection(db, 'users')
      
      // 3 zapytania do Firebase
      const displayNameQuery = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(10)
      )

      const firstNameQuery = query(
        usersRef,
        where('firstName', '>=', searchTerm),
        where('firstName', '<=', searchTerm + '\uf8ff'),
        limit(10)
      )

      const emailQuery = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff'), 
        limit(10)
      )

      const [displayNameSnapshot, firstNameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(displayNameQuery),
        getDocs(firstNameQuery),
        getDocs(emailQuery)
      ])

      // Połącz wyniki i usuń duplikaty
      const allResults = new Map()

      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          const userData = doc.data()
          if (userData.uid !== currentUserId) {
            allResults.set(doc.id, {
              uid: doc.id,
              email: userData.email || '',
              displayName: userData.displayName || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              avatarUrl: userData.avatarUrl,
              level: userData.level || 1,
              streak: userData.streak || 0,
              currentMood: userData.currentMood
            })
          }
        })
      }

      processSnapshot(displayNameSnapshot)
      processSnapshot(firstNameSnapshot)  
      processSnapshot(emailSnapshot)

      const results = Array.from(allResults.values())
      
      console.log(`✅ Znaleziono ${results.length} użytkowników`)
      return results.slice(0, 10)

    } catch (error) {
      console.error('❌ Błąd wyszukiwania Firebase:', error)
      return []
    }
  },

  async getAllUsers(currentUserId: string): Promise<SearchableUser[]> {
    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)
      
      const users: SearchableUser[] = []
      snapshot.forEach((doc) => {
        const userData = doc.data()
        if (userData.uid !== currentUserId) {
          users.push({
            uid: doc.id,
            email: userData.email || '',
            displayName: userData.displayName || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            avatarUrl: userData.avatarUrl,
            level: userData.level || 1,
            streak: userData.streak || 0,
            currentMood: userData.currentMood,
          })
        }
      })
      
      return users
    } catch (error) {
      console.error('Błąd pobierania użytkowników:', error)
      return []
    }
  }
}