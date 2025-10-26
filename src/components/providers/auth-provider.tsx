// src/components/providers/auth-provider.tsx - POPRAWIONA WERSJA
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { blockService } from '@/lib/block-service'

export interface AuthUser extends User {
  role: 'user' | 'admin'
  isAdmin: boolean
  isBlocked?: boolean
  blockedReason?: string
  blockData?: any
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
  isBlocked: boolean
  blockData: any
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isBlocked: false,
  blockData: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockData, setBlockData] = useState<any>(null)
  const router = useRouter()

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setIsBlocked(false)
      setBlockData(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Błąd wylogowania:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sprawdź czy użytkownik jest zablokowany
        try {
          const { isBlocked: blocked, blockData: data } = await blockService.isUserBlocked(firebaseUser.uid)
          
          if (blocked) {
            console.log('🚫 Użytkownik zablokowany:', firebaseUser.uid)
            setIsBlocked(true)
            setBlockData(data)
            
            // Ustaw użytkownika z informacją o blokadzie
            const blockedUser: AuthUser = {
              ...firebaseUser,
              role: 'user',
              isAdmin: false,
              isBlocked: true,
              blockedReason: data?.reason,
              blockData: data
            }
            setUser(blockedUser)
            setLoading(false)
            return
          }

          // Jeśli nie jest zablokowany, pobierz dane użytkownika
          setIsBlocked(false)
          setBlockData(null)
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          const userData = userDoc.data()
          
          const authUser: AuthUser = {
            ...firebaseUser,
            role: userData?.role || 'user',
            isAdmin: userData?.role === 'admin',
            isBlocked: false
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
          console.error('Błąd sprawdzania blokady:', error)
          // W przypadku błędu, pozwól na dostęp
          setIsBlocked(false)
          setBlockData(null)
          
          const authUser: AuthUser = {
            ...firebaseUser,
            role: 'user',
            isAdmin: false,
            isBlocked: false
          }
          setUser(authUser)
        }
      } else {
        setUser(null)
        setIsBlocked(false)
        setBlockData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    logout,
    isBlocked,
    blockData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)