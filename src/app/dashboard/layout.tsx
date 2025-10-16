// src/app/(dashboard)/layout.tsx
import ProtectedRoute from '@/components/protected-route'
import MainLayout from '@/components/layout/main-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  )
}