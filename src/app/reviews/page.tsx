'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'dark' | 'light' | 'yellow'
type StarRating = 1 | 2 | 3 | 4 | 5
type ReplyTone = 'warm' | 'professional' | 'apologetic' | 'excited'

interface ReviewItem {
  id: number
  rating: StarRating
  content: string
  reply: string
  date: string
  productName: string
  done: boolean
}

const THEMES = {
  dark:  { bg: '#0a0a0f', surface: '#13131a', surface2: '#1c1c28', border: '#2a2a3a', accent: '#ff6b35', text: '#f0f0f5', muted: '#8888aa', green: '#00e5a0' },
  light: { bg: '#f5f5f7', surface: '#ffffff', surface2: '#ebebef', border: '#d0d0dc', accent: '#ff6b35', text: '#1a1a2e', muted: '#666688', green: '#00b37a' },
  yellow: { bg: '#0a0900', surface: '#1a1500', surface2: '#1e1a00', border: '#3a3000', accent: '#ff6b35', text: '#fff8dc', muted: '#aa9900', green: '#00e5a0' },
}

const STAR_COLORS: Record<StarRating, string> = {
  5: '#00e5a0', 4: '#6ee7b7', 3: '#fbbf24', 2: '#f97316', 1: '#ef4444'
}
const STAR_LABELS: Record<StarRating, string> = {
  5: '최고예요!', 4: '좋아요', 3: '보통이에요', 2: '별로예요', 1: '최악이에요'
}
const TONE_LABELS: Record<ReplyTone, { label: string; emoji: string; color: string }> = {
  warm:         { label: '따뜻하게',     emoji: '🤗', color: '#f59e0b' },
  professional: { label: '전문적으로',   emoji: '👔', color: '#6366f1' },
  apologetic:   { label: '사과하며',     emoji: '🙏', color: '#ec4899' },
  excited:      { label: '신나게',       emoji: '🎉', color: '#00e5a0' },
}

export default function ReviewsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [keys, setKeys] = useState({ gemini: '', openai: '', groq: '' })
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq'>('gemini')

  const [rating, setRating] = useState<StarRating>(5)
  const [reviewText, setReviewText] = useState('')
  const [productName, setProductName] = useState('')
  const [tone, setTone] = useState<ReplyTone>('warm')
  const [loading, setLoading] = useState(false)
  const [generatedReply, setGeneratedReply] = useState('')
  const [replyVersions, setReplyVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState(0)
  const [replyError, setReplyError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<ReviewItem[]>([])
  const [activeTab, setActiveTab] = useState<'write' | 'batch' | 'history'>('write')
  const [hoverRating, setHoverRating] = useState<StarRating | null>(null)
  const [charLimit, setCharLimit] = useState<number>(0) // 0 = 제한없음
  const [versionCount, setVersionCount] = useState<2 | 3>(3)
  const [isMalicious, setIsMalicious] = useState(false)
  // 대량처리
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState<{review: string; reply: string; done: boolean}[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchCancelled, setBatchCancelled] = useState(false)

  const t = THEMES[theme]

  useEffect(() => {
    document.body.style.background = t.bg
    try {
      const savedKeys = localStorage.getItem('storeauto_keys')
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys)
        setKeys(parsed)
        if (parsed.gemini) setProvider('gemini')
        else if (parsed.openai) setProvider('openai')
        else if (parsed.groq) setProvider('groq')
      }
      const savedTheme = localStorage.getItem('storeauto_theme') as Theme
      if (savedTheme) setTheme(savedTheme)
      const savedHistory = localStorage.getItem('storeauto_reviews')
      if (savedHistory) setHistory(JSON.parse(savedHistory))
    } catch {}
  }, [])

  const callAI = useCallback(async (prompt: string): Promise<string> => {
    const key = provider === 'gemini' ? keys.gemini : provider === 'openai' ? keys.openai : keys.groq
    if (!key) throw new Error('AI 키가 없습니다. 설정 페이지에서 키를 등록해주세요.')

    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
          }),
        }
      )
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key.trim()}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }),
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } else {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key.trim()}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }),
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    }
  }, [provider, keys])

  const detectMalicious = (text: string): boolean => {
    const kw = ['환불','신고','고소','사기','거짓','허위','최악','쓰레기','엉터리','가짜','짝퉁','소비자원','공정위']
    return kw.some(k => text.includes(k))
  }

  const handleGenerate = async () => {
    if (!reviewText.trim()) return
    setLoading(true)
    setGeneratedReply('')
    setReplyVersions([])
    setReplyError('')
    const malicious = detectMalicious(reviewText)
    setIsMalicious(malicious)
    try {
      const toneGuide = {
        warm: '따뜻하고 친근하게. 고객을 가족처럼 대하는 느낌. 감사함을 충분히 표현.',
        professional: '전문적이고 격식있게. 브랜드 신뢰감을 높이는 톤. 간결하고 명확하게.',
        apologetic: '진심으로 사과하고 해결책을 제시. 불편을 드려 죄송한 마음을 충분히 표현.',
        excited: '밝고 에너지 넘치게. 이모지 1~2개 사용. 고객이 기분 좋아지는 톤.',
      }
      const charGuide = charLimit > 0 ? `\n- 반드시 ${charLimit}자 이내로 작성` : ''
      const malGuide = malicious ? '\n- 주의: 분쟁/악성 가능성 리뷰. 감정적 대응 금지. 정중하고 사실 기반. 필요시 고객센터 안내.' : ''
      const basePrompt = `스마트스토어 판매자입니다. 고객 리뷰에 답글을 작성해주세요.\n상품명: ${productName || '저희 상품'}\n별점: ${rating}점 (${STAR_LABELS[rating]})\n고객 리뷰: ${reviewText}\n답글 톤: ${toneGuide[tone]}\n규칙: 2~4문장, 자연스러운 한국어, 판매자 입장, 마크다운 금지${charGuide}${malGuide}\n답글 텍스트만 출력`
      const promises = Array.from({ length: versionCount }, (_, vi) =>
        callAI(basePrompt + `\n(버전${vi + 1}: 앞 버전과 다른 표현으로)`)
      )
      const results = await Promise.all(promises)
      const cleaned = results.map(r => r.replace(/[*#_`]/g, '').trim()).filter(Boolean)
      if (!cleaned.length) throw new Error('AI 응답이 비어있습니다.')
      setReplyVersions(cleaned)
      setSelectedVersion(0)
      setGeneratedReply(cleaned[0])
      const newItem: ReviewItem = {
        id: Date.now(), rating, content: reviewText, reply: cleaned[0],
        date: new Date().toLocaleString('ko-KR'), productName: productName || '미입력', done: false,
      }
      setHistory(prev => {
        const updated = [newItem, ...prev].slice(0, 50)
        try { localStorage.setItem('storeauto_reviews', JSON.stringify(updated)) } catch {}
        return updated
      })
    } catch (e: unknown) {
      setReplyError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleBatch = async () => {
    const reviews = batchInput.split('\n').map(r => r.trim()).filter(Boolean)
    if (!reviews.length) return
    setBatchLoading(true)
    setBatchResults([])
    setBatchProgress(0)
    setBatchCancelled(false)
    const results: {review: string; reply: string; done: boolean}[] = []
    for (let i = 0; i < reviews.length; i++) {
      if (batchCancelled) break
      const review = reviews[i]
      try {
        const charGuide = charLimit > 0 ? ` ${charLimit}자 이내.` : ''
        const malGuide = detectMalicious(review) ? ' (주의:분쟁가능. 정중하게 사실기반으로.)' : ''
        const prompt = `판매자 리뷰 답글. 상품:${productName||'상품'}. 리뷰:${review}. 톤:따뜻하게.${charGuide}${malGuide} 2~3문장, 답글만 출력.`
        const reply = await callAI(prompt)
        results.push({ review, reply: reply.replace(/[*#_`]/g, '').trim(), done: false })
      } catch {
        results.push({ review, reply: '⚠️ 생성 실패', done: false })
      }
      setBatchProgress(i + 1)
      setBatchResults([...results])
      if (i < reviews.length - 1) await new Promise(r => setTimeout(r, 300))
    }
    setBatchLoading(false)
  }

  const toggleDone = (id: number) => {
    setHistory(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, done: !h.done } : h)
      try { localStorage.setItem('storeauto_reviews', JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const deleteItem = (id: number) => {
    setHistory(prev => {
      const updated = prev.filter(h => h.id !== id)
      try { localStorage.setItem('storeauto_reviews', JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const pendingCount = history.filter(h => !h.done).length
  const doneCount = history.filter(h => h.done).length

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans KR', sans-serif; background: ${t.bg}; color: ${t.text}; min-height: 100vh; }
    @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .fade-up { animation: fadeUp 0.4s ease forwards; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${t.surface}; }
    ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
    textarea, input { font-family: 'Noto Sans KR', sans-serif; }
  `

  return (
    <>
      <style>{css}</style>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,20px) 100px' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => router.push('/')} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: '10px', padding: '8px 16px', color: t.muted,
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← 메인으로</button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {((['dark','light','yellow'] as const)).map(th => (
                <button key={th} onClick={() => setTheme(th)} style={{
                  padding: '7px 12px', borderRadius: '8px', fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: theme === th ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                  background: theme === th ? `${t.accent}22` : t.surface2,
                  transition: 'all 0.15s',
                }}>{th === 'dark' ? '🌙' : th === 'light' ? '☀️' : '⭐'}</button>
              ))}
            </div>
          </div>

          {/* 타이틀 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', boxShadow: '0 8px 32px rgba(245,158,11,0.35)',
                animation: 'float1 3s ease-in-out infinite',
              }}>💬</div>
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(22px,5vw,32px)', fontWeight: 900, color: t.text, lineHeight: 1.2 }}>
                리뷰 답글 관리
              </h1>
              <p style={{ fontSize: 'clamp(12px,2.5vw,14px)', color: t.muted, marginTop: '4px' }}>
                AI가 고객 리뷰에 맞는 최적의 답글을 자동 생성합니다
              </p>
            </div>
          </div>

          {/* 컨트롤 타워 스탯 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
            {[
              { label: '전체 리뷰', value: history.length, color: t.accent, emoji: '📊', anim: 'float1' },
              { label: '답글 대기', value: pendingCount, color: '#f59e0b', emoji: '⏳', anim: 'float2' },
              { label: '답글 완료', value: doneCount, color: t.green, emoji: '✅', anim: 'float3' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: '14px', padding: 'clamp(12px,2.5vw,16px)',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  fontSize: '28px', marginBottom: '6px',
                  display: 'inline-block', animation: `${stat.anim} ${2.5 + i * 0.5}s ease-in-out infinite`,
                }}>{stat.emoji}</div>
                <p style={{ fontSize: 'clamp(22px,5vw,28px)', fontWeight: 900, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {([
            { key: 'write', label: '✍️ 답글 작성', badge: null },
            { key: 'batch', label: '📦 대량처리', badge: null },
            { key: 'history', label: '📋 기록', badge: history.length > 0 ? history.length : null },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: 'clamp(10px,2.5vw,13px)', borderRadius: '12px',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              fontSize: 'clamp(12px,2.5vw,13px)',
              border: activeTab === tab.key ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              background: activeTab === tab.key ? `${t.accent}18` : t.surface,
              color: activeTab === tab.key ? t.accent : t.muted,
              transition: 'all 0.2s', position: 'relative' as const,
            }}>
              {tab.label}
              {tab.badge && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: t.accent, color: '#fff', borderRadius: '50%',
                  width: '20px', height: '20px', fontSize: '11px', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* 공통 설정 바 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '8px 12px' }}>
            <span style={{ fontSize: '12px', color: t.muted, whiteSpace: 'nowrap' }}>글자수 제한</span>
            <select value={charLimit} onChange={e => setCharLimit(Number(e.target.value))} style={{ background: 'transparent', border: 'none', color: t.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
              <option value={0}>제한없음</option>
              <option value={100}>100자</option>
              <option value={150}>150자</option>
              <option value={200}>200자</option>
              <option value={300}>300자</option>
            </select>
          </div>
          {activeTab === 'write' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '8px 12px' }}>
              <span style={{ fontSize: '12px', color: t.muted, whiteSpace: 'nowrap' }}>버전 수</span>
              <select value={versionCount} onChange={e => setVersionCount(Number(e.target.value) as 2 | 3)} style={{ background: 'transparent', border: 'none', color: t.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                <option value={2}>2가지</option>
                <option value={3}>3가지</option>
              </select>
            </div>
          )}
        </div>

        {/* 대량처리 탭 */}
        {activeTab === 'batch' && (
          <div className="fade-up" style={{ display: 'grid', gap: '16px' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.muted, marginBottom: '8px', letterSpacing: '0.5px' }}>📦 대량 리뷰 처리</p>
              <p style={{ fontSize: '12px', color: t.muted, marginBottom: '12px', lineHeight: 1.6 }}>리뷰를 한 줄에 하나씩 입력하세요. 한 번에 최대 20개까지 처리할 수 있어요.</p>
              <textarea
                value={batchInput}
                onChange={e => setBatchInput(e.target.value)}
                placeholder={'배송이 너무 빨라서 좋았어요!\n제품 품질이 기대 이하였어요.\n포장이 꼼꼼해서 마음에 들어요.\n사이즈가 맞지 않아서 아쉬워요.'}
                rows={8}
                style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '12px', color: t.text, fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.7 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: t.muted }}>{batchInput.split('\n').filter(r => r.trim()).length}개 리뷰 입력됨</span>
                <button onClick={handleBatch} disabled={batchLoading || !batchInput.trim()} style={{ padding: '10px 24px', background: batchLoading ? t.border : `linear-gradient(135deg, ${t.accent}, #ff8c5a)`, border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: batchLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {batchLoading ? `처리 중... (${batchProgress}/${batchInput.split('\n').filter(r => r.trim()).length})` : '🚀 일괄 생성'}
                </button>
                {batchLoading && (
                  <button onClick={() => setBatchCancelled(true)} style={{ padding: '10px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⛔ 취소
                  </button>
                )}
              </div>
            </div>

            {batchResults.length > 0 && (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: t.text }}>생성 결과 ({batchResults.length}건)</p>
                  <button onClick={() => {
                    const text = batchResults.map((r, i) => `[${i+1}] 리뷰: ${r.review}\n    답글: ${r.reply}`).join('\n\n')
                    navigator.clipboard.writeText(text)
                  }} style={{ padding: '6px 12px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.muted, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    📋 전체 복사
                  </button>
                </div>
                {batchResults.map((r, i) => (
                  <div key={i} style={{ background: t.surface, border: `1px solid ${r.reply.includes('⚠️') ? '#ef4444' : t.border}`, borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '12px', color: t.muted, marginBottom: '6px' }}>리뷰 {i+1}{detectMalicious(r.review) ? ' 🚨 악성 가능성' : ''}</div>
                    <div style={{ fontSize: '13px', color: t.muted, marginBottom: '8px', padding: '8px', background: t.surface2, borderRadius: '8px', lineHeight: 1.6 }}>{r.review}</div>
                    <div style={{ fontSize: '14px', color: t.text, lineHeight: 1.7, marginBottom: '8px' }}>{r.reply}</div>
                    <button onClick={() => navigator.clipboard.writeText(r.reply)} style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.muted, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>복사</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 답글 작성 탭 */}
        {activeTab === 'write' && (
          <div className="fade-up" style={{ display: 'grid', gap: '16px' }}>

            {/* AI 선택 */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.muted, marginBottom: '12px', letterSpacing: '0.5px' }}>AI 선택</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { key: 'gemini', label: '✦ Gemini', badge: '일부무료', color: '#f59e0b', hasKey: !!keys.gemini },
                  { key: 'openai', label: '⬡ OpenAI', badge: '유료', color: '#ef4444', hasKey: !!keys.openai },
                  { key: 'groq',   label: '⚡ Groq',   badge: '무료',   color: t.green,   hasKey: !!keys.groq },
                ] as const).map(p => (
                  <button key={p.key} onClick={() => setProvider(p.key)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                    fontFamily: 'inherit', border: provider === p.key ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                    background: provider === p.key ? `${t.accent}18` : t.surface2,
                    transition: 'all 0.15s',
                  }}>
                    <p style={{ fontSize: 'clamp(12px,2.5vw,13px)', fontWeight: 700, color: provider === p.key ? t.accent : t.text }}>{p.label}</p>
                    <p style={{ fontSize: '10px', color: p.color, marginTop: '2px', fontWeight: 600 }}>{p.badge}</p>
                    {!p.hasKey && <p style={{ fontSize: '10px', color: '#ff6666', marginTop: '1px' }}>키 없음</p>}
                  </button>
                ))}
              </div>
              {!keys.gemini && !keys.openai && !keys.groq && (
                <button onClick={() => router.push('/settings')} style={{
                  marginTop: '12px', width: '100%', background: t.accent, color: '#fff',
                  border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>⚙️ 키 설정하러 가기</button>
              )}
            </div>

            {/* 상품명 */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.muted, marginBottom: '10px', letterSpacing: '0.5px' }}>상품명 (선택)</p>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="예: 영광 법성포 굴비 선물세트"
                style={{
                  width: '100%', background: t.surface2, border: `1px solid ${t.border}`,
                  borderRadius: '10px', padding: '12px 14px', color: t.text,
                  fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            {/* 별점 선택 */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.muted, marginBottom: '14px', letterSpacing: '0.5px' }}>고객 별점</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([1,2,3,4,5] as StarRating[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={{
                        fontSize: 'clamp(24px,6vw,32px)', background: 'none', border: 'none',
                        cursor: 'pointer', transition: 'transform 0.15s',
                        transform: (hoverRating || rating) >= s ? 'scale(1.2)' : 'scale(1)',
                        filter: (hoverRating || rating) >= s ? 'none' : 'grayscale(1) opacity(0.3)',
                      }}
                    >⭐</button>
                  ))}
                </div>
                <div style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                  background: `${STAR_COLORS[hoverRating || rating]}20`,
                  color: STAR_COLORS[hoverRating || rating],
                  border: `1px solid ${STAR_COLORS[hoverRating || rating]}40`,
                }}>
                  {rating}점 — {STAR_LABELS[rating]}
                </div>
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.muted, marginBottom: '10px', letterSpacing: '0.5px' }}>
                고객 리뷰 내용 <span style={{ color: t.accent }}>*</span>
              </p>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="고객이 남긴 리뷰 내용을 붙여넣거나 직접 입력하세요&#10;예: 포장이 너무 꼼꼼하게 되어있고 맛도 최고예요! 다음에도 꼭 구매할게요."
                rows={4}
                style={{
                  width: '100%', background: t.surface2, border: `1px solid ${t.border}`,
                  borderRadius: '10px', padding: '12px 14px', color: t.text,
                  fontSize: '14px', outline: 'none', resize: 'vertical' as const, lineHeight: 1.7,
                }}
              />
            </div>

            {/* 답글 톤 선택 */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: t.muted, marginBottom: '12px', letterSpacing: '0.5px' }}>답글 톤</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(Object.entries(TONE_LABELS) as [ReplyTone, typeof TONE_LABELS[ReplyTone]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setTone(key)} style={{
                    padding: '12px', borderRadius: '10px', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left' as const,
                    border: tone === key ? `2px solid ${val.color}` : `1px solid ${t.border}`,
                    background: tone === key ? `${val.color}15` : t.surface2,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '20px' }}>{val.emoji}</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: tone === key ? val.color : t.text, marginTop: '4px' }}>{val.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={loading || !reviewText.trim()}
              style={{
                width: '100%', padding: 'clamp(15px,3vw,18px)',
                background: loading || !reviewText.trim()
                  ? t.surface2
                  : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
                color: loading || !reviewText.trim() ? t.muted : '#fff',
                border: 'none', borderRadius: '14px', fontSize: 'clamp(14px,3vw,16px)',
                fontWeight: 800, cursor: loading || !reviewText.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.3s',
                boxShadow: !loading && reviewText.trim() ? '0 8px 32px rgba(245,158,11,0.3)' : 'none',
                letterSpacing: '0.5px',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  AI가 답글을 작성중입니다...
                </span>
              ) : '✨ AI 답글 자동 생성'}
            </button>

            {/* 생성된 답글 */}
            {replyError && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', fontSize: '13px', color: '#ff6666' }}>⚠️ {replyError}</div>
            )}

            {isMalicious && generatedReply && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '13px', color: '#f87171', lineHeight: 1.6 }}>
                🚨 <strong>악성/분쟁 가능성 리뷰 감지</strong> — 답글이 신중하게 작성됐어요. 감정적 표현 없이 정중하게 대응하세요. 필요시 고객센터 직접 연락을 유도하세요.
              </div>
            )}

            {generatedReply && (
              <div className="fade-up" style={{ background: t.surface, border: `2px solid ${t.accent}`, borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: t.accent }}>✨ 생성된 답글</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { navigator.clipboard.writeText(generatedReply); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ background: copied ? t.green : `${t.accent}20`, color: copied ? '#000' : t.accent, border: `1px solid ${copied ? t.green : t.accent}`, borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? '✓ 복사됨!' : '📋 복사'}</button>
                    <button onClick={handleGenerate} style={{ background: t.surface2, color: t.muted, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↺ 재생성</button>
                  </div>
                </div>

                {/* 버전 선택 탭 */}
                {replyVersions.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {replyVersions.map((_, vi) => (
                      <button key={vi} onClick={() => { setSelectedVersion(vi); setGeneratedReply(replyVersions[vi]) }} style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: selectedVersion === vi ? `2px solid ${t.accent}` : `1px solid ${t.border}`, background: selectedVersion === vi ? `${t.accent}20` : t.surface2, color: selectedVersion === vi ? t.accent : t.muted, transition: 'all 0.15s' }}>
                        버전 {vi + 1}
                      </button>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: 'clamp(14px,3vw,15px)', color: t.text, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                  {generatedReply}
                </p>
                {charLimit > 0 && (
                  <p style={{ fontSize: '12px', color: generatedReply.length > charLimit ? '#ef4444' : t.green, marginTop: '8px', fontWeight: 700 }}>
                    {generatedReply.length}자 / 제한 {charLimit}자 {generatedReply.length > charLimit ? '⚠️ 초과' : '✓'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 기록 탭 */}
        {activeTab === 'history' && (
          <div className="fade-up">
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float1 3s ease-in-out infinite' }}>💬</div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: t.text, marginBottom: '8px' }}>아직 생성된 답글이 없어요</p>
                <p style={{ fontSize: '13px', color: t.muted }}>답글 작성 탭에서 첫 번째 답글을 만들어보세요!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ fontSize: '13px', color: t.muted }}>총 {history.length}개 · 미완료 {pendingCount}개</p>
                  <button onClick={() => {
                    if (confirm('전체 기록을 삭제할까요?')) {
                      setHistory([])
                      localStorage.removeItem('storeauto_reviews')
                    }
                  }} style={{
                    background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                    color: '#ff6666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                  }}>🗑️ 전체 삭제</button>
                </div>
                {history.map(item => (
                  <div key={item.id} style={{
                    background: t.surface, border: `1px solid ${item.done ? t.border : t.accent}`,
                    borderRadius: '14px', padding: '18px', opacity: item.done ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px' }}>{'⭐'.repeat(item.rating)}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                          background: `${STAR_COLORS[item.rating]}20`, color: STAR_COLORS[item.rating],
                        }}>{item.rating}점</span>
                        <span style={{ fontSize: '12px', color: t.muted }}>{item.productName}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => toggleDone(item.id)} style={{
                          background: item.done ? `${t.green}20` : t.surface2,
                          border: `1px solid ${item.done ? t.green : t.border}`,
                          borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
                          color: item.done ? t.green : t.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                        }}>{item.done ? '✓ 완료' : '완료 처리'}</button>
                        <button onClick={() => deleteItem(item.id)} style={{
                          background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)',
                          borderRadius: '6px', padding: '4px 8px', fontSize: '12px',
                          color: '#ff6666', cursor: 'pointer', fontFamily: 'inherit',
                        }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '11px', color: t.muted, marginBottom: '4px', fontWeight: 700 }}>고객 리뷰</p>
                      <p style={{ fontSize: '13px', color: t.text, lineHeight: 1.7 }}>{item.content}</p>
                    </div>
                    <div style={{ background: t.surface2, borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${t.accent}` }}>
                      <p style={{ fontSize: '11px', color: t.accent, marginBottom: '4px', fontWeight: 700 }}>AI 답글</p>
                      <p style={{ fontSize: '13px', color: t.text, lineHeight: 1.7 }}>{item.reply}</p>
                    </div>
                    <p style={{ fontSize: '11px', color: t.muted, marginTop: '8px', textAlign: 'right' }}>{item.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 플로팅 메인 버튼 */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
        <button onClick={() => router.push('/')} style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', border: 'none', borderRadius: '50px',
          padding: '11px 18px', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          animation: 'float2 3s ease-in-out infinite',
          whiteSpace: 'nowrap',
        }}>🏠 메인</button>
        <button onClick={() => router.push('/settings')} style={{
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#fff', border: 'none', borderRadius: '50px',
          padding: '11px 18px', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
          animation: 'float3 2.5s ease-in-out infinite',
          whiteSpace: 'nowrap',
        }}>⚙️ 키 설정</button>
      </div>
    </>
  )
}
