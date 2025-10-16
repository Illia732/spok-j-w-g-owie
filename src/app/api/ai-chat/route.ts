// src/app/api/ai-chat/route.ts

import { NextResponse } from 'next/server'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const ACTIVE_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

export async function POST(request: Request) {

console.log('🔵 API Route: Rozpoczynam...')

try {

const body = await request.json()

const { message } = body

console.log('📨 Odebrana wiadomość:', message)

if (!message) {

return NextResponse.json({ error: 'Brak wiadomości' }, { status: 400 })

}

console.log('🚀 Wywołuję OpenRouter...')

const aiResponse = await callOpenRouterAI(message)

console.log('✅ Sukces!')

return NextResponse.json({

response: aiResponse,

timestamp: new Date().toISOString(),

model: ACTIVE_MODEL,

source: 'openrouter_ai'

})

} catch (error: any) {

console.error('💥 CRITICAL ERROR:', error)

return NextResponse.json(

{

error: 'Internal Server Error',

message: error.message

},

{ status: 500 }

)

}

}

async function callOpenRouterAI(userMessage: string): Promise<string> {

console.log('🔗 Łączę z OpenRouter...')

const requestBody = {

model: ACTIVE_MODEL,

messages: [

{

role: 'system',

content: `Jesteś asystentem wellbeing w aplikacji dla młodzieży. Odpowiadaj po polsku, przyjaźnie i wspierajaco. Mow naturalnie.`

},

{

role: 'user',

content: userMessage

}

],

max_tokens: 500,

temperature: 0.7

}

// 🔥 WAŻNE: Używamy tylko ASCII w headers!

const response = await fetch(OPENROUTER_API_URL, {

method: 'POST',

headers: {

'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,

'Content-Type': 'application/json',

'HTTP-Referer': 'https://spokojwglowie.pl', // TYLKO ASCII

'X-Title': 'Spokoj w Glowie - Wellbeing App' // BEZ POLSKICH ZNAKÓW

},

body: JSON.stringify(requestBody)

})

console.log('📥 OpenRouter status:', response.status)

if (!response.ok) {

const errorText = await response.text()

console.error('❌ OpenRouter error:', errorText)

throw new Error(`OpenRouter API error: ${response.status}`)

}

const data = await response.json()

console.log('📄 OpenRouter response received')

const responseText = data.choices[0]?.message?.content

if (!responseText) {

console.error('❌ Brak treści w odpowiedzi:', data)

throw new Error('No response content from AI')

}

return responseText

}

export async function GET() {

return NextResponse.json({

status: 'API działa!',

model: ACTIVE_MODEL

})

}