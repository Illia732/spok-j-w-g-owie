import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { texts, targetLang = 'en' } = await request.json()
    
    // Azure Translator API
    const response = await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=pl&to=${targetLang}`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
          'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          texts.map(text => ({ Text: text }))
        )
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Azure Translator error:', error)
      throw new Error(`Azure API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Budujemy obiekt tłumaczeń
    const translations = {}
    data.forEach((item, index) => {
      translations[texts[index]] = item.translations[0].text
    })

    console.log(`✅ Translated ${texts.length} texts`)
    return NextResponse.json({ translations })
    
  } catch (error) {
    console.error('Translation error:', error)
    
    // Fallback - zwróć oryginalne teksty
    const { texts } = await request.json()
    const fallback = {}
    texts.forEach(text => fallback[text] = text)
    
    return NextResponse.json({ translations: fallback })
  }
}