// src/app/api/ai-chat/route.ts - FINALNA WERSJA
import { NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant' // SZYBSZY I DARMOWY

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Brak wiadomości' }, { status: 400 })
    }

    // 🔥 GROQ - 100% DARMOWE BEZ KARTY
    const aiResponse = await callGroqAI(message)
    
    return NextResponse.json({ 
      response: aiResponse,
      model: GROQ_MODEL,
      source: 'groq_ai'
    })

  } catch (error: any) {
    console.error('AI Error:', error)
    return NextResponse.json(
      { error: 'AI tymczasowo niedostępny' },
      { status: 500 }
    )
  }
}

async function callGroqAI(userMessage: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "Jesteś asystentem wellbeing. Odpowiadaj po polsku, wspierajaco i naturalnie."
        },
        {
          role: "user", 
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || "Przepraszam, nie mogę teraz odpowiedzieć."
}

export async function GET() {
  return NextResponse.json({
    status: 'AI Chat API działa!',
    model: GROQ_MODEL,
    provider: 'Groq Cloud - 100% darmowe'
  })
}