import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/5 to-purple-600/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Spokój w głowie</h1>
          <p className="text-gray-600 mt-2">Zaloguj się do swojego konta</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Logowanie</CardTitle>
            <CardDescription>Wprowadź swoje dane, aby się zalogować</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Adres email</label>
              <Input id="email" type="email" placeholder="wprowadź@email.com" className="w-full" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Hasło</label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">Zapomniałeś hasła?</Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" className="w-full" />
            </div>

            <Button className="w-full" size="lg">Zaloguj się</Button>

            <div className="text-center text-sm text-gray-600">
              Nie masz konta?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">Zarejestruj się</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}