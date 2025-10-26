// src/lib/referral-service.ts
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Referral {
  id: string
  referrerId: string
  referralCode: string
  createdAt: Date
  used: boolean
  usedBy?: string
  usedAt?: Date
  isNewUser: boolean
}

export const referralService = {
  /**
   * 🔗 GENERUJE UNIKALNY KOD ZAPROSZENIOWY
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      // Sprawdź czy użytkownik już ma aktywny kod
      const existingQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', userId),
        where('used', '==', false)
      )
      const existingSnapshot = await getDocs(existingQuery)
      
      if (!existingSnapshot.empty) {
        const existingCode = existingSnapshot.docs[0].data().referralCode
        console.log('✅ Użytkownik już ma aktywny kod:', existingCode)
        return existingCode
      }

      // Generuj nowy unikalny kod
      let referralCode: string
      let isUnique = false
      
      while (!isUnique) {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        const codeQuery = query(
          collection(db, 'referrals'),
          where('referralCode', '==', referralCode)
        )
        const codeSnapshot = await getDocs(codeQuery)
        isUnique = codeSnapshot.empty
      }

      // Zapisz kod w Firestore
      const referralData = {
        referrerId: userId,
        referralCode,
        createdAt: serverTimestamp(),
        used: false,
        isNewUser: false // Domyślnie dla istniejących użytkowników
      }

      await addDoc(collection(db, 'referrals'), referralData)
      console.log('✅ Wygenerowano nowy kod zaproszeniowy:', referralCode)
      
      return referralCode!

    } catch (error) {
      console.error('❌ Błąd generowania kodu zaproszeniowego:', error)
      throw new Error('Nie udało się wygenerować kodu zaproszeniowego')
    }
  },

  /**
   * 🔍 SPRAWDZA KOD ZAPROSZENIOWY
   */
  async validateReferralCode(referralCode: string): Promise<{
    isValid: boolean
    referrerId?: string
    isNewUser?: boolean
    referralId?: string
  }> {
    try {
      const referralQuery = query(
        collection(db, 'referrals'),
        where('referralCode', '==', referralCode),
        where('used', '==', false)
      )
      const referralSnapshot = await getDocs(referralQuery)
      
      if (referralSnapshot.empty) {
        return { isValid: false }
      }

      const referralDoc = referralSnapshot.docs[0]
      const referralData = referralDoc.data()
      
      return {
        isValid: true,
        referrerId: referralData.referrerId,
        isNewUser: referralData.isNewUser,
        referralId: referralDoc.id
      }
    } catch (error) {
      console.error('❌ Błąd walidacji kodu:', error)
      return { isValid: false }
    }
  },

  /**
   * 🎁 OZNACZA KOD JAKO UŻYTY + USTAWIA TYP UŻYTKOWNIKA
   */
  async markReferralAsUsed(
    referralId: string, 
    usedByUserId: string, 
    isNewUser: boolean
  ): Promise<void> {
    try {
      const referralRef = doc(db, 'referrals', referralId)
      await updateDoc(referralRef, {
        used: true,
        usedBy: usedByUserId,
        usedAt: serverTimestamp(),
        isNewUser
      })
      console.log(`✅ Kod oznaczony jako użyty przez: ${usedByUserId} (nowy użytkownik: ${isNewUser})`)
    } catch (error) {
      console.error('❌ Błąd oznaczania kodu jako użytego:', error)
      throw error
    }
  },

  /**
   * 📊 POBIRA STATYSTYKI ZAPROSZEŃ UŻYTKOWNIKA
   */
  async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number
    activeCodes: number
    newUsersReferred: number
    existingUsersReferred: number
  }> {
    try {
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', userId)
      )
      const snapshot = await getDocs(referralsQuery)
      
      const referrals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Referral[]

      const totalReferrals = referrals.filter(ref => ref.used).length
      const activeCodes = referrals.filter(ref => !ref.used).length
      const newUsersReferred = referrals.filter(ref => ref.used && ref.isNewUser).length
      const existingUsersReferred = referrals.filter(ref => ref.used && !ref.isNewUser).length

      return {
        totalReferrals,
        activeCodes,
        newUsersReferred,
        existingUsersReferred
      }
    } catch (error) {
      console.error('❌ Błąd pobierania statystyk zaproszeń:', error)
      return {
        totalReferrals: 0,
        activeCodes: 0,
        newUsersReferred: 0,
        existingUsersReferred: 0
      }
    }
  },

  /**
   * 🔗 GENERUJE PEŁNY LINK ZAPROSZENIOWY
   */
  generateReferralLink(referralCode: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://spokojwglowie.pl'
    
    return `${baseUrl}/auth/register?ref=${referralCode}`
  }
}