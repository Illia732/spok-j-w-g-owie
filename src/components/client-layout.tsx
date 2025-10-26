// src/components/client-layout.tsx
'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { BlockedUserAlert } from '@/components/blocked-user-alert'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isBlocked, blockData, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  // Jeśli użytkownik jest zablokowany, pokaż alert
  if (isBlocked && blockData) {
    return <BlockedUserAlert />
  }

  return <>{children}</>
}