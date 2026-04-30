import { NextRequest, NextResponse } from 'next/server'

/**
 * ✅ 키 정책 (수정됨)
 * - 관리자 키(admin_config): 관리자 전용. 일반 회원 API 호출에 절대 폴백하지 않음
 * - 회원 키: 각 회원이 마이페이지에서 직접 입력한 키만 사용
 * - 키 미입력 회원 → AI 사용 불가 + 안내 메시지 반환
 */

function toKoreanError(msg: string): string {
  if (!msg) return '알 수 없는 오류가 발생했어요.'
  if (msg.includes('quota') || msg.includes('limit') || msg.includes('RESOURCE_EXHAUSTED')) return '⏳ API 사용 한도를 초과했어요. 잠시 후 다시 시도해주세요.'
  if (msg.includes('invalid') || msg.includes('API key') || msg.includes('api_key') || msg.includes('401') || msg.includes('403')) return '🔑 API 키가 올바르지 않아요. 마이페이지에서 키를 확인해주세요.'
  if (msg.includes('429')) return '⏳ 요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return '🔧 AI 서버에 일시적인 문제가 발생했어요.'
  if (msg.includes('billing') || msg.includes('insufficient_quota')) return '💳 API 크레딧이 부족해요.'
  return '⚠️ 오류가 발생했어요. 다시 시도해주세요.'
}

const NO_KEY_ERROR = (provider: string) =>
  `🔑 ${provider} API 키가 없어요. 마이페이지 → API 키 탭에서 입력해주세요.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, provider, userGemini, userOpenai, userGroq } = body

    if (!prompt) return NextResponse.json({ error: '프롬프트가 없어요.' }, { status: 400 })

    // provider 미지정 시 gemini 기본값 (관리자 DB 조회 제거)
    const resolvedProvider = provider || 'gemini'

    let text = ''

    if (resolvedProvider === 'gemini') {
      // ✅ 회원 키만 사용 — 관리자 키 폴백 없음
      const geminiKey = userGemini || ''
      if (!geminiKey) return NextResponse.json({ error: NO_KEY_ERROR('Gemini') }, { status: 400 })

      const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest']
      let lastErr = ''
      for (const model of MODELS) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }) }
        )
        if (!res.ok) {
          const e = await res.json()
          const msg = (e?.error?.message || '').toLowerCase()
          if (res.status === 401 || res.status === 403 || msg.includes('api_key') || msg.includes('api key'))
            return NextResponse.json({ error: '🔑 Gemini API 키가 올바르지 않아요. 마이페이지에서 키를 확인해주세요.' }, { status: 401 })
          lastErr = e?.error?.message || `${model} 오류(${res.status})`; continue
        }
        const data = await res.json()
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (!text) { lastErr = '빈 응답'; continue }
        break
      }
      if (!text) return NextResponse.json({ error: toKoreanError(lastErr) }, { status: 500 })

    } else if (resolvedProvider === 'openai') {
      // ✅ 회원 키만 사용 — 관리자 키 폴백 없음
      const openaiKey = userOpenai || ''
      if (!openaiKey) return NextResponse.json({ error: NO_KEY_ERROR('OpenAI') }, { status: 400 })

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: toKoreanError(e?.error?.message || '') }, { status: res.status }) }
      const data = await res.json()
      text = data.choices?.[0]?.message?.content || ''

    } else if (resolvedProvider === 'groq') {
      // ✅ 회원 키만 사용 — 관리자 키 폴백 없음
      const groqKey = userGroq || ''
      if (!groqKey) return NextResponse.json({ error: NO_KEY_ERROR('Groq') }, { status: 400 })

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: toKoreanError(e?.error?.message || '') }, { status: res.status }) }
      const data = await res.json()
      text = data.choices?.[0]?.message?.content || ''

    } else {
      return NextResponse.json({ error: `지원하지 않는 AI예요: ${resolvedProvider}` }, { status: 400 })
    }

    if (!text) return NextResponse.json({ error: '😅 AI가 응답을 생성하지 못했어요. 다시 시도해주세요.' }, { status: 500 })
    return NextResponse.json({ text })

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? toKoreanError(e.message) : '서버 오류가 발생했어요.' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
