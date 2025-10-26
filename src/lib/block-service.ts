// src/lib/block-service.ts
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  getDoc,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from './firebase'

export interface BlockUserData {
  userId: string
  email: string
  displayName: string
  reason: string
  isPermanent?: boolean
  days?: number
}

export interface BlockedUser {
  id: string
  userId: string
  email: string
  displayName: string
  blockedBy: string
  blockedByEmail: string
  reason: string
  blockedAt: Date
  expiresAt?: Date | null
  isPermanent: boolean
  isActive: boolean
}

class BlockService {
  /**
   * 🚫 SPRAWDŹ CZY UŻYTKOWNIK JEST ZABLOKOWANY
   */
  async isUserBlocked(userId: string): Promise<{ isBlocked: boolean; blockData?: BlockedUser }> {
    try {
      console.log('🟡 Sprawdzanie blokady dla użytkownika:', userId)

      // Sprawdź w kolekcji blockedUsers
      const blockedQuery = query(
        collection(db, 'blockedUsers'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      )
      
      const snapshot = await getDocs(blockedQuery)
      
      if (snapshot.empty) {
        console.log('🟡 Brak aktywnej blokady w blockedUsers')
        return { isBlocked: false }
      }

      const blockData = snapshot.docs[0].data() as BlockedUser
      blockData.id = snapshot.docs[0].id

      console.log('🟡 Znaleziono aktywną blokadę:', blockData)

      // Sprawdź czy blokada nie wygasła
      if (blockData.expiresAt) {
        const expiresAt = blockData.expiresAt instanceof Date ? blockData.expiresAt : new Date(blockData.expiresAt)
        const now = new Date()
        
        console.log('🟡 Sprawdzanie daty wygaśnięcia:', { expiresAt, now })
        
        if (expiresAt < now) {
          console.log('🟡 Blokada wygasła, deaktywacja...')
          await this.deactivateBlock(blockData.id)
          return { isBlocked: false }
        }
      }

      console.log('✅ Użytkownik jest zablokowany')
      return { isBlocked: true, blockData }
    } catch (error) {
      console.error('❌ Błąd sprawdzania blokady:', error)
      return { isBlocked: false }
    }
  }

  /**
   * 🔒 ZABLOKUJ UŻYTKOWNIKA - POPRAWIONA WERSJA
   */
  async blockUser(blockData: BlockUserData, adminUser: any): Promise<void> {
    try {
      console.log('🟡 === ROZPOCZĘCIE BLOKOWANIA ===')
      console.log('Block Data:', blockData)
      console.log('Admin User:', adminUser)

      const { userId, email, displayName, reason, isPermanent = false, days = 0 } = blockData

      // Walidacja danych wejściowych
      if (!userId || !email || !reason) {
        throw new Error('Brak wymaganych danych: userId, email, reason')
      }

      if (!adminUser || !adminUser.uid) {
        throw new Error('Brak danych administratora')
      }

      // Sprawdź czy użytkownik już jest zablokowany
      console.log('🟡 Sprawdzanie czy użytkownik jest już zablokowany...')
      const { isBlocked } = await this.isUserBlocked(userId)
      if (isBlocked) {
        throw new Error('Użytkownik jest już zablokowany')
      }

      const blockedAt = new Date()
      
      // POPRAWIONE: Poprawna obsługa expiresAt - NIGDY nie może być undefined
      let expiresAt: Date | null = null
      let expiresAtTimestamp: Timestamp | null = null

      if (!isPermanent && days > 0) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + days)
        expiresAtTimestamp = Timestamp.fromDate(expiresAt)
        console.log('🟡 Blokada tymczasowa do:', expiresAt)
      } else {
        console.log('🟡 Blokada permanentna')
      }

      // 1. Zapisz w kolekcji blockedUsers - POPRAWIONE: expiresAt nigdy undefined
      console.log('🟡 Zapis do kolekcji blockedUsers...')
      const blockDoc = {
        userId,
        email,
        displayName: displayName || email,
        blockedBy: adminUser.uid,
        blockedByEmail: adminUser.email,
        reason,
        blockedAt: Timestamp.fromDate(blockedAt), // Używaj Timestamp zamiast Date
        expiresAt: expiresAtTimestamp, // Używaj Timestamp lub null, NIGDY undefined
        isPermanent,
        isActive: true
      }

      console.log('🟡 Dane do zapisu w blockedUsers:', blockDoc)
      
      await addDoc(collection(db, 'blockedUsers'), blockDoc)
      console.log('✅ Dokument dodany do blockedUsers')

      // 2. Zaktualizuj profil użytkownika
      console.log('🟡 Aktualizacja profilu użytkownika...')
      const userRef = doc(db, 'users', userId)
      
      const updateData: any = {
        isBlocked: true,
        blockReason: reason,
        blockedAt: serverTimestamp(),
        blockedBy: adminUser.uid,
      }

      // Dodaj pola związane z czasem blokady
      if (expiresAtTimestamp) {
        updateData.blockExpiresAt = expiresAtTimestamp
        updateData.blockUntil = expiresAtTimestamp
      } else {
        // Dla blokad permanentnych ustaw null
        updateData.blockExpiresAt = null
        updateData.blockUntil = null
      }

      // Wyczyść stare/konfliktowe pola
      updateData.blockedReason = null

      console.log('🟡 Dane do aktualizacji profilu:', updateData)
      
      await updateDoc(userRef, updateData)
      console.log('✅ Profil użytkownika zaktualizowany')

      console.log(`✅ Użytkownik ${email} został zablokowany pomyślnie`)
    } catch (error) {
      console.error('❌ === BŁĄD BLOKOWANIA ===', error)
      if (error instanceof Error) {
        console.error('Szczegóły błędu:', error.message)
        console.error('Stack trace:', error.stack)
      }
      throw error
    }
  }

  /**
   * 🔓 ODBlOKUJ UŻYTKOWNIKA
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      console.log('🟡 Rozpoczynanie odblokowywania użytkownika:', userId)

      // Znajdź aktywną blokadę
      const blockedQuery = query(
        collection(db, 'blockedUsers'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      )
      
      const snapshot = await getDocs(blockedQuery)
      
      if (!snapshot.empty) {
        const blockDoc = snapshot.docs[0]
        console.log('🟡 Deaktywacja blokady w kolekcji blockedUsers...')
        await updateDoc(blockDoc.ref, {
          isActive: false,
          unblockedAt: serverTimestamp()
        })
        console.log('✅ Blokada deaktywowana')
      }

      // Zaktualizuj profil użytkownika - WYCZYŚĆ WSZYSTKIE POLA BLOKADY
      console.log('🟡 Czyszczenie pól blokady w profilu użytkownika...')
      const userRef = doc(db, 'users', userId)
      
      const updateData = {
        isBlocked: false,
        blockReason: null,
        blockedReason: null,
        blockedAt: null,
        blockedBy: null,
        blockExpiresAt: null,
        blockUntil: null
      }

      await updateDoc(userRef, updateData)
      console.log('✅ Wszystkie pola blokady wyczyszczone')

      console.log(`✅ Użytkownik ${userId} został odblokowany`)
    } catch (error) {
      console.error('❌ Błąd odblokowania użytkownika:', error)
      throw error
    }
  }

  /**
   * 📋 POBIERZ LISTĘ ZABLOKOWANYCH UŻYTKOWNIKÓW
   */
  async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const blockedQuery = query(
        collection(db, 'blockedUsers'),
        where('isActive', '==', true),
        orderBy('blockedAt', 'desc')
      )
      
      const snapshot = await getDocs(blockedQuery)
      const blockedUsers = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          blockedAt: data.blockedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || null
        } as BlockedUser
      })

      console.log(`✅ Pobrano ${blockedUsers.length} zablokowanych użytkowników`)
      return blockedUsers
    } catch (error) {
      console.error('❌ Błąd pobierania zablokowanych użytkowników:', error)
      return []
    }
  }

  /**
   * ⏰ DEAKTYWUJ WYGASŁĄ BLOKADĘ
   */
  private async deactivateBlock(blockId: string): Promise<void> {
    try {
      const blockRef = doc(db, 'blockedUsers', blockId)
      await updateDoc(blockRef, {
        isActive: false,
        autoUnblockedAt: serverTimestamp()
      })
      console.log(`✅ Blokada ${blockId} deaktywowana (wygasła)`)
    } catch (error) {
      console.error('❌ Błąd deaktywacji blokady:', error)
    }
  }

  /**
   * 🔄 SPRAWDŹ WSZYSTKIE WYGASŁE BLOKADY
   */
  async checkExpiredBlocks(): Promise<void> {
    try {
      console.log('🟡 Sprawdzanie wygasłych blokad...')
      
      const activeBlocksQuery = query(
        collection(db, 'blockedUsers'),
        where('isActive', '==', true)
      )
      
      const snapshot = await getDocs(activeBlocksQuery)
      const now = new Date()
      let expiredCount = 0

      for (const blockDoc of snapshot.docs) {
        const blockData = blockDoc.data()
        if (blockData.expiresAt) {
          const expiresAt = blockData.expiresAt.toDate()
          if (expiresAt < now) {
            await this.deactivateBlock(blockDoc.id)
            
            // Odblokuj użytkownika
            const userRef = doc(db, 'users', blockData.userId)
            await updateDoc(userRef, {
              isBlocked: false,
              blockReason: null,
              blockedReason: null,
              blockedAt: null,
              blockedBy: null,
              blockExpiresAt: null,
              blockUntil: null
            })
            
            expiredCount++
          }
        }
      }

      if (expiredCount > 0) {
        console.log(`✅ Odblokowano ${expiredCount} użytkowników z powodu wygasłych blokad`)
      }
    } catch (error) {
      console.error('❌ Błąd sprawdzania wygasłych blokad:', error)
    }
  }

  /**
   * 📧 SPRAWDŹ CZY EMAIL JEST ZABLOKOWANY
   */
  async isEmailBlocked(email: string): Promise<{ isBlocked: boolean; blockData?: any }> {
    try {
      // Najpierw znajdź użytkownika po emailu
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase()),
        limit(1)
      )
      
      const userSnapshot = await getDocs(usersQuery)
      
      if (userSnapshot.empty) {
        return { isBlocked: false }
      }

      const userDoc = userSnapshot.docs[0]
      const userId = userDoc.id

      // Sprawdź czy użytkownik jest zablokowany
      return await this.isUserBlocked(userId)

    } catch (error) {
      console.error('❌ Błąd sprawdzania blokady email:', error)
      return { isBlocked: false }
    }
  }

  /**
   * 📊 POBIERZ STATYSTYKI BLOKAD
   */
  async getBlockStats(): Promise<{
    totalBlocked: number
    permanentBlocks: number
    temporaryBlocks: number
    expiredThisWeek: number
  }> {
    try {
      const blockedUsers = await this.getBlockedUsers()
      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const expiredThisWeek = blockedUsers.filter(user => {
        if (!user.expiresAt) return false
        return user.expiresAt >= weekAgo && user.expiresAt <= now
      }).length

      const stats = {
        totalBlocked: blockedUsers.length,
        permanentBlocks: blockedUsers.filter(user => user.isPermanent).length,
        temporaryBlocks: blockedUsers.filter(user => !user.isPermanent).length,
        expiredThisWeek
      }

      console.log('📊 Statystyki blokad:', stats)
      return stats
    } catch (error) {
      console.error('❌ Błąd pobierania statystyk blokad:', error)
      return {
        totalBlocked: 0,
        permanentBlocks: 0,
        temporaryBlocks: 0,
        expiredThisWeek: 0
      }
    }
  }

  /**
   * 🔎 WYSZUKAJ ZABLOKOWANYCH UŻYTKOWNIKÓW
   */
  async searchBlockedUsers(searchTerm: string): Promise<BlockedUser[]> {
    try {
      const blockedUsers = await this.getBlockedUsers()
      
      if (!searchTerm.trim()) {
        return blockedUsers
      }

      const term = searchTerm.toLowerCase()
      const filteredUsers = blockedUsers.filter(user =>
        user.email.toLowerCase().includes(term) ||
        user.displayName.toLowerCase().includes(term) ||
        user.reason.toLowerCase().includes(term)
      )

      console.log(`🔎 Znaleziono ${filteredUsers.length} użytkowników dla zapytania: "${searchTerm}"`)
      return filteredUsers
    } catch (error) {
      console.error('❌ Błąd wyszukiwania zablokowanych użytkowników:', error)
      return []
    }
  }

  /**
   * ⏰ ZAPLANUJ SPRAWDZANIE WYGASŁYCH BLOKAD
   */
  scheduleExpiredBlocksCheck(): NodeJS.Timeout {
    // Sprawdzaj wygasłe blokady co godzinę
    return setInterval(() => {
      this.checkExpiredBlocks()
    }, 60 * 60 * 1000)
  }

  /**
   * 🗑️ USUŃ BLOKADĘ
   */
  async deleteBlock(blockId: string): Promise<void> {
    try {
      const blockRef = doc(db, 'blockedUsers', blockId)
      await deleteDoc(blockRef)
      console.log(`✅ Usunięto blokadę: ${blockId}`)
    } catch (error) {
      console.error('❌ Błąd usuwania blokady:', error)
      throw error
    }
  }

  /**
   * 📝 ZMIEŃ POWÓD BLOKADY
   */
  async updateBlockReason(blockId: string, newReason: string): Promise<void> {
    try {
      const blockRef = doc(db, 'blockedUsers', blockId)
      await updateDoc(blockRef, {
        reason: newReason,
        updatedAt: serverTimestamp()
      })

      // Zaktualizuj również w profilu użytkownika
      const blockDoc = await getDoc(blockRef)
      if (blockDoc.exists()) {
        const blockData = blockDoc.data()
        const userRef = doc(db, 'users', blockData.userId)
        await updateDoc(userRef, {
          blockReason: newReason
        })
      }

      console.log(`✅ Zaktualizowano powód blokady: ${blockId}`)
    } catch (error) {
      console.error('❌ Błąd aktualizacji powodu blokady:', error)
      throw error
    }
  }

  /**
   * ⏱️ PRZEDŁUŻ BLOKADĘ
   */
  async extendBlock(blockId: string, additionalDays: number): Promise<void> {
    try {
      const blockRef = doc(db, 'blockedUsers', blockId)
      const blockDoc = await getDoc(blockRef)
      
      if (!blockDoc.exists()) {
        throw new Error('Blokada nie istnieje')
      }

      const blockData = blockDoc.data()
      let newExpiresAt: Date

      if (blockData.expiresAt) {
        const currentExpiresAt = blockData.expiresAt.toDate()
        newExpiresAt = new Date(currentExpiresAt)
        newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays)
      } else {
        newExpiresAt = new Date()
        newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays)
      }

      await updateDoc(blockRef, {
        expiresAt: Timestamp.fromDate(newExpiresAt),
        updatedAt: serverTimestamp()
      })

      // Zaktualizuj również w profilu użytkownika
      const userRef = doc(db, 'users', blockData.userId)
      await updateDoc(userRef, {
        blockExpiresAt: Timestamp.fromDate(newExpiresAt),
        blockUntil: Timestamp.fromDate(newExpiresAt)
      })

      console.log(`✅ Przedłużono blokadę o ${additionalDays} dni: ${blockId}`)
    } catch (error) {
      console.error('❌ Błąd przedłużania blokady:', error)
      throw error
    }
  }

  /**
   * 🚫 SPRAWDŹ STATUS BLOKADY (dla komponentów)
   */
  async checkUserBlockStatus(userId: string): Promise<{ isBlocked: boolean; blockData?: any }> {
    return await this.isUserBlocked(userId)
  }
}

export const blockService = new BlockService()

// Automatyczne uruchomienie sprawdzania wygasłych blokad przy starcie aplikacji
if (typeof window !== 'undefined') {
  blockService.scheduleExpiredBlocksCheck()
}