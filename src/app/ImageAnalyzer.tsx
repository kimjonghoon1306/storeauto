'use client'

import { useState, useRef } from 'react'

interface AnalysisResult {
  productName: string
  category: string
  features: string[]
  targetCustomer: string
  priceRange: string
  extraInfo: string
}

interface Props {
  geminiKey: string
  openaiKey: string
  onResult: (result: AnalysisResult) => void
  onGoSettings: () => void
}

const CATEGORIES = [
  '패션의류', '패션잡화', '뷰티', '식품', '주방용품', '생활용품',
  '가구/인테리어', '디지털/가전', '스포츠/레저', '출산/육아',
  '반려동물', '문구/오피스', '자동차용품', '건강', '기타',
]

export default function ImageAnalyzer({ geminiKey, openaiKey, onResult, onGoSettings }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [imageMime, setImageMime] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasGeminiKey = !!geminiKey
  const hasOpenAIKey = !!openaiKey
  const canAnalyze = hasGeminiKey || hasOpenAIKey

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }
    setImageMime(file.type)
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setImageUrl(result)
      setImageBase64(result.split(',')[1])
      setDone(false)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleAnalyze = async () => {
    if (!imageBase64) { setError('이미지를 먼저 업로드해주세요.'); return }
    if (!canAnalyze) { setError('settings'); return }

    setLoading(true)
    setError('')

    const prompt = `이 상품 이미지를 분석해서 아래 JSON 형식으로만 응답하세요. 다른 텍스트 금지.
카테고리는 반드시 다음 중 하나: ${CATEGORIES.join(', ')}

{"productName":"상품명(구체적으로)","category":"카테고리","features":["특징1","특징2","특징3","특징4"],"targetCustomer":"타겟고객","priceRange":"예상가격대","extraInfo":"추가정보"}

한글만. 쌍따옴표 값 안에 사용 금지.`

    try {
      let text = ''

      if (hasGeminiKey) {
        // Gemini Vision
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: imageMime, data: imageBase64 } }
                ]
              }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
          }
        )
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err?.error?.message || 'Gemini 오류')
        }
        const data = await res.json()
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else {
        // OpenAI Vision
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 1024,
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBase64}` } }
              ]
            }]
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err?.error?.message || 'OpenAI 오류')
        }
        const data = await res.json()
        text = data.choices?.[0]?.message?.content || ''
      }

      const cleaned = text.replace(/```json|```/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('이미지에서 상품 정보를 인식하지 못했습니다.')
      const parsed: AnalysisResult = JSON.parse(jsonMatch[0])
      if (!parsed.productName) throw new Error('상품 정보 추출 실패. 다른 이미지를 시도해보세요.')

      onResult(parsed)
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setImageUrl('')
    setImageBase64('')
    setDone(false)
    setError('')
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '20px', overflow: 'hidden', marginBottom: '0',
    }}>
      <style>{`
        @keyframes imgFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* 헤더 토글 */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          padding: 'clamp(16px,3vw,20px) clamp(16px,4vw,28px)',
          display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' as const,
          background: isOpen
            ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, transparent 100%)',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
          animation: 'imgFloat 3s ease-in-out infinite',
        }}>🖼️</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 900, fontSize: 'clamp(14px,3vw,16px)', color: 'var(--text)' }}>
              AI 이미지 분석
            </p>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.3)',
            }}>선택사항</span>
            {done && (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(0,229,160,0.15)', color: 'var(--green)',
                border: '1px solid rgba(0,229,160,0.3)',
              }}>✓ 분석 완료</span>
            )}
          </div>
          <p style={{ fontSize: 'clamp(11px,2.5vw,12px)', color: 'var(--text-muted)', marginTop: '3px' }}>
            {isOpen ? '상품 이미지 업로드 → AI가 상품 정보 자동 입력 → 트렌드 검색 자동 연결' : '클릭해서 펼치면 이미지로 상품 정보를 자동 입력할 수 있어요'}
          </p>
        </div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', transition: 'transform 0.3s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}>▾</div>
      </button>

      {isOpen && (
        <div style={{ padding: 'clamp(16px,3vw,24px) clamp(16px,4vw,28px)' }}>

          {/* 기능 설명 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', color: '#818cf8' }}>📖 기능 설명</p>
              <button onClick={() => setShowGuide(v => !v)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>{showGuide ? '접기 ▲' : '자세히 ▼'}</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.7 }}>
              상품 이미지를 업로드하면 AI가 자동으로 상품명, 카테고리, 특징, 타겟 고객을 분석합니다.
            </p>
            {showGuide && (
              <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
                {[
                  { icon: '📸', text: '상품 사진, 패키지 사진, 상세페이지 캡처 등 어떤 이미지든 가능합니다.' },
                  { icon: '⚡', text: '분석 완료 후 상품명이 트렌드 검색창에 자동으로 입력됩니다.' },
                  { icon: '✏️', text: '자동 입력된 내용은 아래 입력폼에서 직접 수정할 수 있습니다.' },
                  { icon: '🔑', text: 'Gemini 또는 OpenAI 키가 필요합니다. Groq는 이미지 분석을 지원하지 않습니다.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 키 없을 때 안내 */}
          {!canAnalyze && (
            <div style={{
              background: 'rgba(255,107,53,0.06)', border: '1px dashed rgba(255,107,53,0.3)',
              borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px', fontWeight: 700 }}>
                Gemini 또는 OpenAI 키가 필요합니다
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Groq는 이미지 분석을 지원하지 않습니다
              </p>
              <button onClick={onGoSettings} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>⚙️ 키 설정하기</button>
            </div>
          )}

          {/* 이미지 업로드 영역 */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              border: `2px dashed ${imageUrl ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
              borderRadius: '14px', padding: '20px', textAlign: 'center',
              background: imageUrl ? 'rgba(99,102,241,0.05)' : 'var(--surface2)',
              cursor: canAnalyze ? 'pointer' : 'default',
              transition: 'all 0.2s', marginBottom: '12px',
            }}
            onClick={() => canAnalyze && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {imageUrl ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={imageUrl} alt="업로드된 이미지" style={{
                  maxWidth: '100%', maxHeight: '240px', borderRadius: '10px',
                  objectFit: 'contain', display: 'block', margin: '0 auto',
                }} />
                <button
                  onClick={e => { e.stopPropagation(); reset() }}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: '28px', height: '28px',
                    cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            ) : (
              <div style={{ opacity: canAnalyze ? 1 : 0.4 }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🖼️</div>
                <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 700, marginBottom: '4px' }}>
                  클릭하거나 이미지를 드래그해서 올려주세요
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  JPG, PNG, WEBP 지원
                </p>
              </div>
            )}
          </div>

          {error && error !== 'settings' && (
            <p style={{
              fontSize: '13px', color: '#ff6666', marginBottom: '12px',
              padding: '10px 14px', background: 'rgba(255,68,68,0.08)', borderRadius: '8px',
            }}>{error}</p>
          )}

          {/* 분석 버튼 */}
          {imageUrl && (
            <button
              onClick={handleAnalyze}
              disabled={loading || !canAnalyze}
              style={{
                width: '100%', padding: 'clamp(13px,3vw,15px)',
                background: loading
                  ? 'var(--surface2)'
                  : done
                  ? 'linear-gradient(135deg, #00e5a0, #00b37a)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: loading ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: 'clamp(14px,3vw,15px)', fontWeight: 800,
                cursor: loading || !canAnalyze ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.3s',
                boxShadow: !loading ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '16px' }}>⟳</span>
                  AI가 이미지를 분석중입니다...
                </span>
              ) : done ? (
                '✓ 분석 완료 — 다시 분석하려면 클릭'
              ) : (
                '🔍 AI 이미지 분석 시작'
              )}
            </button>
          )}

          {done && (
            <div style={{
              marginTop: '12px', padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '18px' }}>✓</span>
              <p style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 700 }}>
                상품 정보가 자동 입력됐습니다. 아래 입력폼에서 확인 후 수정하세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
