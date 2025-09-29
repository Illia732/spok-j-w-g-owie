export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo i copyright */}
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm text-gray-600">
              © 2024 Spokój w głowie. Wszelkie prawa zastrzeżone.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Polityka prywatności
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Warunki użytkowania
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Wsparcie
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}