// src/lib/referral-service.ts
import { db, auth } from './firebase'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore'

export interface ReferralData {
  referrerId: string
  referralCode: string // DODANE - teraz jest wymagane
  createdAt: any
  used: boolean
  isNewUser: boolean
  usedBy?: string
  usedAt?: any
}

class ReferralService {
  // GENEROWANIE UNIKALNEGO KODU REFERALNEGO
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // TWORZENIE LUB POBRANIE KODU REFERALNEGO
  async getOrCreateReferralCode(userId: string): Promise<string> {
    try {
      const referralRef = doc(db, 'referrals', userId)
      const referralSnap = await getDoc(referralRef)

      if (referralSnap.exists()) {
        const data = referralSnap.data()
        return data.referralCode
      } else {
        // GENERUJ NOWY KOD
        const referralCode = this.generateReferralCode()
        
        const referralData = {
          referrerId: userId,
          referralCode, // TERAZ ZMIENNA JEST ZDEFINIOWANA
          createdAt: serverTimestamp(),
          used: false,
          isNewUser: false
        }

        await setDoc(referralRef, referralData)
        return referralCode
      }
    } catch (error) {
      console.error('Błąd tworzenia/pobierania kodu referalnego:', error)
      throw error
    }
  }

  // UŻYCIE KODU REFERALNEGO
  async useReferralCode(referralCode: string, newUserId: string): Promise<boolean> {
    try {
      // Znajdź referral po kodzie
      const referralsRef = collection(db, 'referrals')
      const q = query(referralsRef, where('referralCode', '==', referralCode))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error('Nieprawidłowy kod referalny')
      }

      const referralDoc = querySnapshot.docs[0]
      const referralData = referralDoc.data()

      if (referralData.used) {
        throw new Error('Ten kod został już użyty')
      }

      if (referralData.referrerId === newUserId) {
        throw new Error('Nie możesz użyć własnego kodu')
      }

      // Aktualizuj referral
      await updateDoc(doc(db, 'referrals', referralDoc.id), {
        used: true,
        usedBy: newUserId,
        usedAt: serverTimestamp()
      })

      // Nagródź obu użytkowników
      const batch = writeBatch(db)

      // Nagroda dla polecającego
      const referrerStatsRef = doc(db, 'userStats', referralData.referrerId)
      batch.set(referrerStatsRef, {
        referralsCount: 1,
        lastReferralAt: serverTimestamp()
      }, { merge: true })

      // Nagroda dla nowego użytkownika
      const newUserStatsRef = doc(db, 'userStats', newUserId)
      batch.set(newUserStatsRef, {
        joinedWithReferral: true,
        referralCodeUsed: referralCode
      }, { merge: true })

      await batch.commit()
      return true

    } catch (error) {
      console.error('Błąd użycia kodu referalnego:', error)
      throw error
    }
  }

  // POBRANIE STATYSTYK REFERALI
  async getReferralStats(userId: string): Promise<{
    referralCode: string
    referralsCount: number
    lastReferralAt: any
  }> {
    try {
      const [referralSnap, statsSnap] = await Promise.all([
        getDoc(doc(db, 'referrals', userId)),
        getDoc(doc(db, 'userStats', userId))
      ])

      const referralData = referralSnap.exists() ? referralSnap.data() : null
      const statsData = statsSnap.exists() ? statsSnap.data() : {}

      return {
        referralCode: referralData?.referralCode || '',
        referralsCount: statsData?.referralsCount || 0,
        lastReferralAt: statsData?.lastReferralAt || null
      }
    } catch (error) {
      console.error('Błąd pobierania statystyk referali:', error)
      throw error
    }
  }

  // WERYFIKACJA KODU REFERALNEGO
  async validateReferralCode(referralCode: string): Promise<{
    isValid: boolean
    error?: string
  }> {
    try {
      if (!referralCode || referralCode.length !== 8) {
        return { isValid: false, error: 'Nieprawidłowy format kodu' }
      }

      const referralsRef = collection(db, 'referrals')
      const q = query(referralsRef, where('referralCode', '==', referralCode))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return { isValid: false, error: 'Nieprawidłowy kod referalny' }
      }

      const referralData = querySnapshot.docs[0].data()

      if (referralData.used) {
        return { isValid: false, error: 'Ten kod został już użyty' }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Błąd weryfikacji kodu referalnego:', error)
      return { isValid: false, error: 'Błąd weryfikacji kodu' }
    }
  }
}

export default new ReferralService()