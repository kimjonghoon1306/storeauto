import { NextRequest, NextResponse } from 'next/server'

// tarry generate-content.js 방식 - apiKey를 클라이언트에서 받아 서버에서 호출
function removeNonKorean(text: string): string {
  if (!text) return ''
  return text
    .replace(/[一-鿿㐀-䶿]/g, '')
    .replace(/[\u3040-\u30FF]/g, '')
    .replace(/\*{2,}/g, '')
    .replace(/_{2,}/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, prompt } = await req.json()
    if (!provider || !apiKey || !prompt)
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })

    // ── Gemini ──
    if (provider === 'gemini') {
      const MODELS = ['gemini-2.0-flash','gemini-2.0-flash-lite','gemini-2.0-flash-exp','gemini-exp-1206','gemini-2.5-flash','gemini-2.5-flash-lite']
      let lastError = ''
      for (const model of MODELS) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8192 } }) }
          )
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            const msg = (err.error?.message || '').toLowerCase()
            const status = resp.status
            if (msg.includes('api key') || msg.includes('api_key') || status === 403)
              return NextResponse.json({ error: '🔑 Gemini API 키가 올바르지 않아요.' }, { status: 401 })
            if (status === 429 || status === 503 || status === 404 ||
              msg.includes('quota') || msg.includes('resource_exhausted') ||
              msg.includes('rate') || msg.includes('overloaded') || msg.includes('not found'))
              { lastError = `${model} 한도초과/미지원`; continue }
            lastError = `Gemini 오류 (${status})`; continue
          }
          const data = await resp.json()
          const text = removeNonKorean(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
          if (!text) { lastError = `${model} 빈 응답`; continue }
          return NextResponse.json({ text })
        } catch (e: unknown) {
          lastError = e instanceof Error ? e.message : '오류'; continue
        }
      }
      return NextResponse.json({ error: `⏳ Gemini 한도 초과 (${lastError}). Groq를 선택해주세요.` }, { status: 500 })
    }

    // ── OpenAI ──
    if (provider === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        return NextResponse.json({ error: `OpenAI 오류: ${err.error?.message || resp.status}` }, { status: resp.status })
      }
      const data = await resp.json()
      return NextResponse.json({ text: removeNonKorean(data.choices?.[0]?.message?.content || '') })
    }

    // ── Groq ──
    if (provider === 'groq') {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        return NextResponse.json({ error: `Groq 오류: ${err.error?.message || resp.status}` }, { status: resp.status })
      }
      const data = await resp.json()
      return NextResponse.json({ text: removeNonKorean(data.choices?.[0]?.message?.content || '') })
    }

    return NextResponse.json({ error: '지원하지 않는 provider' }, { status: 400 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
