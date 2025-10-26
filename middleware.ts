// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase-admin'
import { getFirestore, getDocs, query, collection, where } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

let firebaseApp
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

const db = getFirestore(firebaseApp)

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = request.nextUrl.pathname

  // Sprawdź token uwierzytelniający dla chronionych ścieżek
  const session = request.cookies.get('session')?.value
  
  if (session) {
    try {
      // Zweryfikuj token sesji Firebase
      const decodedToken = await auth.verifySessionCookie(session, true)
      const userId = decodedToken.uid

      // SPRAWDŹ CZY UŻYTKOWNIK JEST ZABLOKOWANY
      const isBlocked = await checkIfUserIsBlocked(userId)
      
      if (isBlocked) {
        console.log('🚫 Użytkownik zablokowany - przekierowanie do /blocked')
        // Jeśli użytkownik jest zablokowany, przekieruj na stronę blokady
        const blockedUrl = new URL('/blocked', request.url)
        return NextResponse.redirect(blockedUrl)
      }

      // Sprawdź uprawnienia do panelu admina
      if (pathname.startsWith('/admin')) {
        const isAdmin = await checkIfUserIsAdmin(userId)
        if (!isAdmin) {
          // Jeśli nie jest adminem, przekieruj na dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

    } catch (error) {
      console.error('Błąd weryfikacji tokenu:', error)
      // Token nieprawidłowy - przekieruj do loginu
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } else {
    // Brak sesji - przekieruj do loginu dla chronionych ścieżek
    // ALE pozwól na rejestrację i login
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/mood') || 
        pathname.startsWith('/articles') ||
        pathname.startsWith('/games') ||
        pathname.startsWith('/ai') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/admin')) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

/**
 * Sprawdza czy użytkownik jest zablokowany
 */
async function checkIfUserIsBlocked(userId: string): Promise<boolean> {
  try {
    const blockedUsersQuery = query(
      collection(db, 'blockedUsers'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    )
    
    const snapshot = await getDocs(blockedUsersQuery)
    
    if (snapshot.empty) {
      return false
    }

    const blockData = snapshot.docs[0].data()
    
    // Sprawdź czy blokada nie wygasła
    if (blockData.expiresAt) {
      const expiresAt = blockData.expiresAt.toDate ? blockData.expiresAt.toDate() : new Date(blockData.expiresAt)
      const now = new Date()
      
      if (expiresAt < now) {
        // Blokada wygasła
        return false
      }
    }

    return true

  } catch (error) {
    console.error('Błąd sprawdzania blokady użytkownika:', error)
    return false
  }
}

/**
 * Sprawdza czy użytkownik jest administratorem
 */
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', userId)
    )
    
    const snapshot = await getDocs(userQuery)
    
    if (snapshot.empty) {
      return false
    }

    const userData = snapshot.docs[0].data()
    return userData.role === 'admin'

  } catch (error) {
    console.error('Błąd sprawdzania uprawnień admina:', error)
    return false
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/mood/:path*',
    '/articles/:path*',
    '/games/:path*',
    '/ai/:path*',
    '/profile/:path*',
    '/admin/:path*'
  ]
}