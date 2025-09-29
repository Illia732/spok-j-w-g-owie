import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/5 to-purple-600/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Spokój w głowie</h1>
          <p className="text-gray-600 mt-2">Stwórz nowe konto</p>
        </div>

        {/* Register Form */}
        <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Rejestracja</CardTitle>
            <CardDescription>
              Wprowadź dane, aby stworzyć konto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Imię
                </label>
                <Input
                  id="firstName"
                  placeholder="Jan"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Nazwisko
                </label>
                <Input
                  id="lastName"
                  placeholder="Kowalski"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adres email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="wprowadź@email.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Hasło
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Minimum 8 znaków, w tym jedna wielka litera i cyfra
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Potwierdź hasło
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Akceptuję{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  warunki użytkowania
                </Link>
              </label>
            </div>

            <Button className="w-full" size="lg">
              Zarejestruj się
            </Button>

            <div className="text-center text-sm text-gray-600">
              Masz już konto?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Zaloguj się
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}