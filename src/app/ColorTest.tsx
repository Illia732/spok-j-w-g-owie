export default function ColorTest() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Spokój w głowie
        </h1>
        <p className="text-lg text-text-secondary">
          Design System Test
        </p>
      </div>

      {/* Color Palette */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">
          Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-20 bg-primary rounded-lg shadow-sm"></div>
            <p className="text-sm text-text-secondary text-center">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-accent-green rounded-lg shadow-sm"></div>
            <p className="text-sm text-text-secondary text-center">Accent Green</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-accent-orange rounded-lg shadow-sm"></div>
            <p className="text-sm text-text-secondary text-center">Accent Orange</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 bg-accent-red rounded-lg shadow-sm"></div>
            <p className="text-sm text-text-secondary text-center">Accent Red</p>
          </div>
        </div>
      </section>

      {/* Typography Scale */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">
          Typography
        </h2>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-text-primary">Heading 1 - 36px</h1>
          <h2 className="text-3xl font-semibold text-text-primary">Heading 2 - 30px</h2>
          <h3 className="text-2xl font-semibold text-text-primary">Heading 3 - 24px</h3>
          <p className="text-base text-text-secondary">Body text - 16px</p>
          <p className="text-sm text-text-tertiary">Small text - 14px</p>
        </div>
      </section>

      {/* Glassmorphism Test */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">
          Glassmorphism
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
            <p className="text-text-secondary">This is a glassmorphism card with backdrop blur</p>
          </div>
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2 text-white">Gradient Card</h3>
            <p className="text-white/80">This card shows gradient background</p>
          </div>
        </div>
      </section>

      {/* Buttons Preview */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">
          Button Styles
        </h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-accent-green text-white rounded-lg font-medium">
            Success Button
          </button>
          <button className="px-4 py-2 border border-border-light text-text-primary rounded-lg font-medium">
            Outline Button
          </button>
        </div>
      </section>
    </div>
  )
}