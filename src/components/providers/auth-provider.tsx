'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export interface AuthUser extends User {
  role: 'user' | 'admin'
  isAdmin: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Pobierz dodatkowe dane użytkownika z Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          const userData = userDoc.data()
          const authUser: AuthUser = {
            ...firebaseUser,
            role: userData?.role || 'user',
            isAdmin: userData?.role === 'admin',
          }
          setUser(authUser)
          
          // 📅 PRZYZNAJ XP ZA DZIENNY LOGIN
          try {
            const { XPService } = await import('@/lib/xp-service')
            await XPService.awardDailyLoginXP(firebaseUser.uid)
            console.log('✅ Sprawdzono dzienny login XP')
          } catch (error) {
            console.error('❌ Błąd sprawdzania dziennego loginu:', error)
          }
          
        } catch (error) {
          console.error('Error fetching user ', error)
          const authUser: AuthUser = {
            ...firebaseUser,
            role: 'user',
            isAdmin: false,
          }
          setUser(authUser)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
