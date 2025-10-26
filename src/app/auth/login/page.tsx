// src/app/(auth)/login/page.tsx - ZINTEGROWANA WERSJA
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { authService } from '@/lib/auth-service'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserBlock } from '@/hooks/useUserBlock'
import { BlockedUserAlert } from '@/components/blocked-user-alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()
  const { isBlocked, blockData, loading: blockLoading } = useUserBlock()

  // Jeśli użytkownik jest już zalogowany i zablokowany, pokaż alert
  if (user && !blockLoading && isBlocked && blockData) {
    return <BlockedUserAlert />
  }

  // Jeśli użytkownik jest już zalogowany i NIE jest zablokowany, przekieruj do dashboard
  useEffect(() => {
    if (user && !blockLoading && !isBlocked) {
      router.push('/dashboard')
    }
  }, [user, blockLoading, isBlocked, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.login(email, password)
      // Przekierowanie nastąpi automatycznie przez useEffect powyżej
      // po załadowaniu danych użytkownika i sprawdzeniu blokady
    } catch (error: any) {
      console.error('Błąd logowania:', error)
      
      // Bardziej szczegółowe komunikaty błędów
      if (error.code === 'auth/invalid-credential') {
        setError('Nieprawidłowy email lub hasło')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Zbyt wiele nieudanych prób logowania. Spróbuj ponownie później.')
      } else if (error.code === 'auth/user-not-found') {
        setError('Nie znaleziono użytkownika o podanym adresie email')
      } else if (error.code === 'auth/wrong-password') {
        setError('Nieprawidłowe hasło')
      } else if (error.code === 'auth/user-disabled') {
        setError('To konto zostało zablokowane. Skontaktuj się z administratorem.')
      } else {
        setError('Błąd logowania: ' + (error.message || 'Nieznany błąd'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Pokazuj loading gdy sprawdzamy status użytkownika
  if (blockLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Sprawdzanie statusu konta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Zaloguj się</h1>
        <p className="text-gray-600 mt-2">Witaj z powrotem!</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="wpisz@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Wpisz swoje hasło"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200 font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Logowanie...
            </div>
          ) : (
            'Zaloguj się'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Nie masz konta?{' '}
          <Link 
            href="/auth/register" 
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>

      {/* Informacja o demo */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 text-center">
          <strong>Konto demo:</strong> demo@spokojwglowie.pl / demodemo
        </p>
      </div>
    </div>
  )
}