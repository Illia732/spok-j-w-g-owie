// src/lib/auth-service.ts - POPRAWIONA WERSJA
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import userService from './user-service' // 👈 DODAJEMY IMPORT

export interface UserData {
  uid: string
  email: string
  firstName: string
  lastName: string
  currentMask: string
  level: number
  xp: number
  streak: number
  unlockedMasks: string[]
  createdAt: Date
  role: 'user' | 'admin'
}

export const authService = {
  async register(
    email: string, 
    password: string, 
    userData: { firstName: string; lastName: string }
  ): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      })

      // 👇 DODAJEMY AUTOMATYCZNE WYKRYWANIE ADMINA
      const isAdmin = email.endsWith('@admin.com') || email.endsWith('@spokojwglowie.pl')
      const userRole: 'user' | 'admin' = isAdmin ? 'admin' : 'user'

      // Zapisz dane użytkownika w Firestore
      const userDoc: UserData = {
        uid: userCredential.user.uid,
        email: email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        currentMask: 'calm',
        level: 1,
        xp: 0,
        streak: 0,
        unlockedMasks: ['calm'],
        createdAt: new Date(), // 👈 DODAJEMY PRZECINEK!
        role: userRole
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc)
      
      console.log(`✅ Użytkownik zarejestrowany z rolą: ${userRole}`)
      return userCredential
      
    } catch (error) {
      console.error('Błąd rejestracji:', error)
      throw error
    }
  },

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Błąd logowania:', error)
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Błąd wylogowania:', error)
      throw error
    }
  },

  // 👇 DODAJEMY NOWE FUNKCJE
  async isUserAdmin(uid: string): Promise<boolean> {
    try {
      const userData = await userService.getUserProfile(uid)
      return userData?.role === 'admin'
    } catch (error) {
      console.error('Błąd sprawdzania roli:', error)
      return false
    }
  },

  async getUserRole(uid: string): Promise<'user' | 'admin' | null> {
    try {
      const userData = await userService.getUserProfile(uid)
      return userData?.role || null
    } catch (error) {
      console.error('Błąd pobierania roli:', error)
      return null
    }
  }
}

export interface UserData {
  uid: string
  email: string
  firstName: string
  lastName: string
  currentMask: string
  level: number
  xp: number
  streak: number
  unlockedMasks: string[]
  createdAt: Date
  role: 'user' | 'admin'
  // 👇 DODAJEMY NOWE POLA
  moodHistory?: MoodEntry[]
  currentMood?: number
  lastMoodUpdate?: Date
}

export interface MoodEntry {
  date: string // ISO date string "2024-01-15"
  mood: number // 0-100
  timestamp: any // Firestore timestamp
  note?: string // Opcjonalna notatka
}


export default authService