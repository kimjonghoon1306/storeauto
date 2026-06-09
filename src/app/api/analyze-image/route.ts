import { NextRequest, NextResponse } from 'next/server'

// Gemini 비전 모델 폴백 순서 (무료 → 유료, 이미지 지원 모델만)
const GEMINI_VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]

function toKoreanError(msg: string): string {
  if (!msg) return '알 수 없는 오류가 발생했어요.'
  const m = msg.toLowerCase()
  if (m.includes('quota') || m.includes('resource_exhausted')) return '⏳ API 사용 한도를 초과했어요. 잠시 후 다시 시도해주세요.'
  if (m.includes('invalid') || m.includes('api key') || m.includes('api_key') || m.includes('401') || m.includes('403')) return '🔑 API 키가 올바르지 않아요. 마이페이지에서 키를 확인해주세요.'
  if (m.includes('429')) return '⏳ 요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
  if (m.includes('500') || m.includes('502') || m.includes('503')) return '🔧 AI 서버에 일시적인 문제가 발생했어요. 다시 시도해주세요.'
  if (m.includes('billing') || m.includes('insufficient_quota')) return '💳 API 크레딧이 부족해요.'
  return '⚠️ 오류가 발생했어요. 다시 시도해주세요.'
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageMime, prompt, geminiKey, openaiKey } = await req.json()

    if (!imageBase64 || !prompt) {
      return NextResponse.json({ error: '이미지와 프롬프트가 필요합니다.' }, { status: 400 })
    }

    const mime = imageMime || 'image/jpeg'

    // ── OpenAI Vision (키가 있으면 우선 시도) ──────────────────────
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } },
            ],
          }],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content || ''
        if (text) return NextResponse.json({ text, provider: 'openai' })
      } else {
        const e = await res.json()
        const msg = (e?.error?.message || '').toLowerCase()
        if (res.status === 401 || res.status === 403 || msg.includes('api key') || msg.includes('invalid')) {
          return NextResponse.json({ error: toKoreanError(e?.error?.message || '') }, { status: 401 })
        }
        // 그 외 OpenAI 오류는 Gemini로 폴백
      }
    }

    // ── Gemini Vision (여러 모델 순서대로 시도) ───────────────────
    if (geminiKey) {
      let lastErr = ''

      for (const model of GEMINI_VISION_MODELS) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mime, data: imageBase64 } },
                ],
              }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
          }
        )

        if (!res.ok) {
          const e = await res.json()
          const msg = (e?.error?.message || '').toLowerCase()
          // 키 오류면 즉시 반환
          if (res.status === 401 || res.status === 403 || msg.includes('api_key') || msg.includes('api key')) {
            return NextResponse.json({ error: '🔑 Gemini API 키가 올바르지 않아요. 마이페이지에서 키를 확인해주세요.' }, { status: 401 })
          }
          // 모델 미지원·할당량 초과는 다음 모델 시도
          lastErr = e?.error?.message || `${model} 오류(${res.status})`
          continue
        }

        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (!text) { lastErr = '빈 응답'; continue }

        return NextResponse.json({ text, provider: 'gemini' })
      }

      return NextResponse.json({ error: toKoreanError(lastErr) }, { status: 500 })
    }

    return NextResponse.json(
      { error: '🔑 API 키가 없어요. 마이페이지 → API 키 탭에서 Gemini(무료) 또는 OpenAI 키를 등록해주세요.' },
      { status: 400 }
    )

  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? toKoreanError(e.message) : '서버 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
