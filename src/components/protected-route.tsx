// src/components/protected-route.tsx
'use client'
import { useAuth } from '@/components/providers/auth-provider'
import { redirect } from 'next/navigation'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}