import { NextRequest, NextResponse } from 'next/server'

// tarry 프로젝트 generate-content.js 방식 그대로 - apiKey를 클라이언트에서 받아 서버에서 호출
export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, prompt } = await req.json()
    if (!provider || !apiKey || !prompt)
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })

    if (provider === 'gemini') {
      const GEMINI_MODELS = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-exp',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
      ]
      let lastError = ''
      for (const model of GEMINI_MODELS) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
              }),
            }
          )
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            const msg = (err.error?.message || '').toLowerCase()
            const status = resp.status
            if (msg.includes('api key') || msg.includes('api_key') || status === 403)
              return NextResponse.json({ error: '🔑 Gemini API 키가 올바르지 않아요.' }, { status: 401 })
            if (status === 429 || status === 503 || status === 404 ||
              msg.includes('quota') || msg.includes('resource_exhausted') ||
              msg.includes('rate') || msg.includes('overloaded') || msg.includes('not found')) {
              lastError = `${model} 한도초과/미지원`; continue
            }
            lastError = `Gemini 오류 (${status})`; continue
          }
          const data = await resp.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (!text) { lastError = `${model} 빈 응답`; continue }
          return NextResponse.json({ text })
        } catch (e: unknown) {
          lastError = e instanceof Error ? e.message : '알 수 없는 오류'
          continue
        }
      }
      return NextResponse.json({ error: `⏳ Gemini 한도 초과 (${lastError}). 잠시 후 다시 시도하거나 Groq를 선택해주세요.` }, { status: 500 })
    }

    return NextResponse.json({ error: '지원하지 않는 provider' }, { status: 400 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
