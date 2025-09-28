
export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Spokój w głowie
          </h1>
          <p className="text-lg text-gray-600">
            Design System Test
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-20 bg-primary rounded-lg shadow-sm"></div>
              <p className="text-sm text-gray-600 text-center">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-green-500 rounded-lg shadow-sm"></div>
              <p className="text-sm text-gray-600 text-center">Accent Green</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-orange-500 rounded-lg shadow-sm"></div>
              <p className="text-sm text-gray-600 text-center">Accent Orange</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-red-500 rounded-lg shadow-sm"></div>
              <p className="text-sm text-gray-600 text-center">Accent Red</p>
            </div>
          </div>
        </section>

        {/* Typography Scale */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Typography
          </h2>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-gray-900">Heading 1 - 36px</h1>
            <h2 className="text-3xl font-semibold text-gray-900">Heading 2 - 30px</h2>
            <h3 className="text-2xl font-semibold text-gray-900">Heading 3 - 24px</h3>
            <p className="text-base text-gray-600">Body text - 16px</p>
            <p className="text-sm text-gray-500">Small text - 14px</p>
          </div>
        </section>

        {/* Glassmorphism Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Glassmorphism
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
              <p className="text-gray-600">This is a glassmorphism card with backdrop blur</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2 text-white">Gradient Card</h3>
              <p className="text-white/80">This card shows gradient background</p>
            </div>
          </div>
        </section>

        {/* Buttons Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Button Styles
          </h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium">
              Success Button
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg font-medium">
              Outline Button
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
