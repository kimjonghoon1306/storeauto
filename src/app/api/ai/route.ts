import { NextRequest, NextResponse } from 'next/server'

function removeNonKorean(text: string): string {
  if (!text) return ''
  return text
    .replace(/[一-鿿㐀-䶿]/g, '')       // 한자 제거
    .replace(/[぀-ヿ]/g, '')    // 일본어 제거
    .replace(/\*{2,}/g, '')             // ** 강조 제거
    .replace(/^#{3,}\s+/gm, '')         // ### 이상 헤더 제거
    .replace(/_{2,}/g, '')              // __ 제거
    .replace(/ {2,}/g, ' ')             // 연속 공백 정리
    .replace(/
{3,}/g, '

')         // 연속 줄바꿈 정리
    .trim()
}


/**
 * ✅ 키 정책 (수정됨)
 * - 관리자 키(admin_config): 관리자 전용. 일반 회원 API 호출에 절대 폴백하지 않음
 * - 회원 키: 각 회원이 마이페이지에서 직접 입력한 키만 사용
 * - 키 미입력 회원 → AI 사용 불가 + 안내 메시지 반환
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function getAdminKey(keyName: string): Promise<string> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_config?key=eq.${keyName}&select=value&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const data = await res.json()
    return Array.isArray(data) && data[0]?.value ? data[0].value : ''
  } catch { return '' }
}

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
    const { prompt, provider, userGemini, userOpenai, userGroq, isAdmin } = body

    if (!prompt) return NextResponse.json({ error: '프롬프트가 없어요.' }, { status: 400 })

    // provider 미지정 시 gemini 기본값 (관리자 DB 조회 제거)
    const resolvedProvider = provider || (isAdmin ? await getAdminKey('default_ai_provider') : '') || 'gemini'

    let text = ''

    if (resolvedProvider === 'gemini') {
      // ✅ 회원 키만 사용 — 관리자 키 폴백 없음
      const geminiKey = userGemini || (isAdmin ? await getAdminKey('gemini_key') : '')
      if (!geminiKey) return NextResponse.json({ error: NO_KEY_ERROR('Gemini') }, { status: 400 })

      const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-exp', 'gemini-exp-1206', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
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
            return NextResponse.json({ error: '🔑 Gemini API 키가 올바르지 않아요. 관리자 페이지에서 키를 확인해주세요.' }, { status: 401 })
          if (res.status === 429 || res.status === 503 || res.status === 404 || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('not found') || msg.includes('overloaded'))
            { lastErr = `${model} 한도초과/미지원`; continue } // 다음 모델로 시도
          lastErr = e?.error?.message || `${model} 오류(${res.status})`; continue
        }
        const data = await res.json()
        text = removeNonKorean(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
        if (!text) { lastErr = '빈 응답'; continue }
        break
      }
      if (!text) return NextResponse.json({ error: lastErr === 'quota' ? '⏳ Gemini 무료 한도를 초과했어요. 잠시 후 다시 시도하거나 다른 AI(Groq 무료)를 선택해주세요.' : toKoreanError(lastErr) }, { status: 500 })

    } else if (resolvedProvider === 'openai') {
      // ✅ 회원 키만 사용 — 관리자 키 폴백 없음
      const openaiKey = userOpenai || (isAdmin ? await getAdminKey('openai_key') : '')
      if (!openaiKey) return NextResponse.json({ error: NO_KEY_ERROR('OpenAI') }, { status: 400 })

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: toKoreanError(e?.error?.message || '') }, { status: res.status }) }
      const data = await res.json()
      text = removeNonKorean(data.choices?.[0]?.message?.content || '')

    } else if (resolvedProvider === 'groq') {
      // ✅ 회원 키만 사용 — 관리자 키 폴백 없음
      const groqKey = userGroq || (isAdmin ? await getAdminKey('groq_key') : '')
      if (!groqKey) return NextResponse.json({ error: NO_KEY_ERROR('Groq') }, { status: 400 })

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: toKoreanError(e?.error?.message || '') }, { status: res.status }) }
      const data = await res.json()
      text = removeNonKorean(data.choices?.[0]?.message?.content || '')

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
