// src/components/providers/auth-provider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface AuthUser extends User {
  role: 'user' | 'admin';
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  isAdmin?: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

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
            isAdmin: userData?.role === 'admin'
          }
          
          setUser(authUser)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Jeśli nie ma danych w Firestore, ustaw domyślne wartości
          const authUser: AuthUser = {
            ...firebaseUser,
            role: 'user',
            isAdmin: false
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

export function useAuth() {
  return useContext(AuthContext)
}