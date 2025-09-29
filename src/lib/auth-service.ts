import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

interface UserData {
  firstName: string
  lastName: string
  email: string
  createdAt: Date
  role: 'user' | 'admin'
}

export const authService = {
  // Rejestracja użytkownika
  async register(email: string, password: string, userData: Omit<UserData, 'email' | 'createdAt' | 'role'>): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Aktualizuj profil użytkownika
    await updateProfile(userCredential.user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    })

    // Zapisz dodatkowe dane użytkownika w Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: email,
      createdAt: new Date(),
      role: 'user',
      xp: 0,
      level: 1,
      streak: 0,
      unlockedMasks: []
    } as UserData)

    return userCredential
  },

  // Logowanie użytkownika
  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password)
  },

  // Wylogowanie
  async logout(): Promise<void> {
    return await signOut(auth)
  },

  // Resetowanie hasła
  async resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(auth, email)
  },

  // Pobierz dane użytkownika z Firestore
  async getUserData(userId: string): Promise<UserData | null> {
    const userDoc = await getDoc(doc(db, 'users', userId))
    return userDoc.exists() ? userDoc.data() as UserData : null
  }
}