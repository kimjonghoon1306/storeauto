import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPrompt } from '@/lib/prompt'
import { ProductInput, GeneratedResult } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const input: ProductInput = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = buildPrompt(input)
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // JSON 파싱
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed: GeneratedResult = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
