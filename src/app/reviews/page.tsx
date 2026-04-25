'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'dark' | 'light' | 'pink'
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
  pink:  { bg: '#1a0a14', surface: '#241018', surface2: '#2e1520', border: '#4a2035', accent: '#ff4d8f', text: '#fff0f5', muted: '#cc88aa', green: '#ff80c0' },
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
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<ReviewItem[]>([])
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write')
  const [hoverRating, setHoverRating] = useState<StarRating | null>(null)

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

  const handleGenerate = async () => {
    if (!reviewText.trim()) return
    setLoading(true)
    setGeneratedReply('')
    try {
      const toneGuide = {
        warm: '따뜻하고 친근하게. 고객을 가족처럼 대하는 느낌. 감사함을 충분히 표현.',
        professional: '전문적이고 격식있게. 브랜드 신뢰감을 높이는 톤. 간결하고 명확하게.',
        apologetic: '진심으로 사과하고 해결책을 제시. 불편을 드려 죄송한 마음을 충분히 표현.',
        excited: '밝고 에너지 넘치게. 이모지 1~2개 사용. 고객이 기분 좋아지는 톤.',
      }
      const prompt = `스마트스토어 판매자입니다. 고객 리뷰에 답글을 작성해주세요.

상품명: ${productName || '저희 상품'}
별점: ${rating}점 (${STAR_LABELS[rating]})
고객 리뷰 내용: ${reviewText}
답글 톤: ${toneGuide[tone]}

규칙:
- 2~4문장으로 작성
- 자연스러운 한국어
- 판매자 입장에서 작성
- 마크다운 기호 사용 금지
- 답글 텍스트만 출력 (설명 없이)`

      const reply = await callAI(prompt)
      const cleaned = reply.replace(/[*#_`]/g, '').trim()
      setGeneratedReply(cleaned)

      const newItem: ReviewItem = {
        id: Date.now(),
        rating,
        content: reviewText,
        reply: cleaned,
        date: new Date().toLocaleString('ko-KR'),
        productName: productName || '미입력',
        done: false,
      }
      setHistory(prev => {
        const updated = [newItem, ...prev].slice(0, 50)
        try { localStorage.setItem('storeauto_reviews', JSON.stringify(updated)) } catch {}
        return updated
      })
    } catch (e: unknown) {
      setGeneratedReply(e instanceof Error ? `오류: ${e.message}` : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
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
              {(['dark','light','pink'] as const).map(th => (
                <button key={th} onClick={() => setTheme(th)} style={{
                  padding: '7px 12px', borderRadius: '8px', fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: theme === th ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                  background: theme === th ? `${t.accent}22` : t.surface2,
                  transition: 'all 0.15s',
                }}>{th === 'dark' ? '🌙' : th === 'light' ? '☀️' : '🌸'}</button>
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {([
            { key: 'write', label: '✍️ 답글 작성', badge: null },
            { key: 'history', label: '📋 답글 기록', badge: history.length > 0 ? history.length : null },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: 'clamp(12px,2.5vw,14px)', borderRadius: '12px',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              fontSize: 'clamp(13px,2.5vw,14px)',
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
            {generatedReply && (
              <div className="fade-up" style={{
                background: t.surface, border: `2px solid ${t.accent}`,
                borderRadius: '14px', padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: t.accent }}>✨ 생성된 답글</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => {
                      navigator.clipboard.writeText(generatedReply)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }} style={{
                      background: copied ? t.green : `${t.accent}20`,
                      color: copied ? '#000' : t.accent,
                      border: `1px solid ${copied ? t.green : t.accent}`,
                      borderRadius: '8px', padding: '6px 14px', fontSize: '13px',
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{copied ? '✓ 복사됨!' : '📋 복사'}</button>
                    <button onClick={handleGenerate} style={{
                      background: t.surface2, color: t.muted,
                      border: `1px solid ${t.border}`,
                      borderRadius: '8px', padding: '6px 14px', fontSize: '13px',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>↺ 재생성</button>
                  </div>
                </div>
                <p style={{ fontSize: 'clamp(14px,3vw,15px)', color: t.text, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                  {generatedReply}
                </p>
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

