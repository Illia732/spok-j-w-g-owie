import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
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
          <p className="text-gray-600 mt-2">Resetowanie hasła</p>
        </div>

        {/* Forgot Password Form */}
        <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Zapomniałeś hasła?</CardTitle>
            <CardDescription>
              Wprowadź swój email, a wyślemy Ci link do resetowania hasła
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button className="w-full" size="lg">
              Wyślij link resetujący
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Wróć do logowania
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}