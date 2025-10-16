// src/app/(auth)/login/page.tsx - POPRAWIONE
'use client'
import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { authService } from '@/lib/auth-service'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  // Jeśli użytkownik jest już zalogowany, przekieruj do dashboard
  if (user) {
    router.push('/dashboard')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.login(email, password)
      router.push('/dashboard')
    } catch (error: any) {
      setError('Błąd logowania: ' + error.message)
    } finally {
      setLoading(false)
    }
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
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Nie masz konta?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}