'use client'

import { useState } from 'react'

const CATEGORIES = [
  '패션의류','패션잡화','뷰티','식품','주방용품','생활용품',
  '가구/인테리어','디지털/가전','스포츠/레저','출산/육아',
  '반려동물','문구/오피스','자동차용품','건강','기타',
]

interface ProductResult {
  productName: string
  category: string
  features: string[]
  targetCustomer: string
  priceRange: string
  extraInfo: string
}

interface Props {
  callAI: (prompt: string) => Promise<string>
  onResult: (result: ProductResult) => void
  onGoSettings: () => void
  hasKey: boolean
}

const SITE_BADGES = [
  { label: '스마트스토어', color: '#03c75a' },
  { label: '쿠팡', color: '#e7261f' },
  { label: '11번가', color: '#ff0000' },
  { label: '옥션', color: '#e42d2d' },
  { label: 'G마켓', color: '#0066cc' },
  { label: '카카오', color: '#FEE500', textColor: '#333' },
  { label: '자사몰', color: '#6366f1' },
]

export default function URLAnalyzer({ callAI, onResult, onGoSettings, hasKey }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{name:string; price:string; image:string; host:string} | null>(null)
  const [done, setDone] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const handleFetch = async () => {
    if (!url.trim()) { setError('URL을 입력해주세요.'); return }
    if (!hasKey) { setError('settings'); return }
    setLoading(true); setError(''); setPreview(null); setDone(false)

    try {
      // 1단계: 서버에서 페이지 내용 가져오기
      const fetchRes = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const fetchData = await fetchRes.json()
      if (!fetchRes.ok) throw new Error(fetchData.error || '페이지를 불러올 수 없어요.')

      const { extracted } = fetchData

      // 2단계: AI로 상품 정보 구조화
      const aiPrompt = `다음은 온라인 쇼핑몰 상품 페이지에서 추출한 정보입니다.
이 내용을 분석해서 상품 정보를 JSON 형식으로만 반환해주세요. 다른 텍스트 금지.
카테고리는 반드시 다음 중 하나: ${CATEGORIES.join(', ')}
한글만 사용. 쌍따옴표 값 안에 쌍따옴표 사용 금지.

[사이트] ${extracted.host}
[제목] ${extracted.title}
[설명] ${extracted.description}
[가격] ${extracted.price || '미확인'}
[구조화 데이터] ${extracted.jsonLd || '없음'}
[페이지 본문 (일부)] ${extracted.bodyText.slice(0, 2000)}

분석이 어렵더라도 최대한 추정해서 반드시 아래 JSON으로만 응답:
{"productName":"상품명","category":"카테고리","features":["특징1","특징2","특징3","특징4"],"targetCustomer":"타겟고객","priceRange":"가격대","extraInfo":"추가정보"}`

      const aiText = await callAI(aiPrompt)
      const cleaned = aiText.replace(/```json|```/gi, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('상품 정보를 인식하지 못했습니다. 다른 URL을 시도해보세요.')
      const parsed: ProductResult = JSON.parse(jsonMatch[0])
      if (!parsed.productName) throw new Error('상품 정보 추출 실패. 다른 URL을 시도해보세요.')

      // OG 이미지 추출
      const ogImgMatch = extracted.bodyText.match(/og:image.*?content="([^"]+)"/)
      const imgUrl = ogImgMatch?.[1] || ''

      setPreview({
        name: parsed.productName,
        price: parsed.priceRange,
        image: imgUrl,
        host: extracted.host,
      })

      onResult(parsed)
      setDone(true)

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setUrl(''); setPreview(null); setDone(false); setError('')
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '20px', overflow: 'hidden', marginBottom: '0',
    }}>
      <style>{`
        @keyframes urlFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes urlSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* 헤더 토글 */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          padding: 'clamp(16px,3vw,20px) clamp(16px,4vw,28px)',
          display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' as const,
          background: isOpen
            ? 'linear-gradient(135deg,rgba(16,185,129,0.15) 0%,rgba(16,185,129,0.03) 100%)'
            : 'linear-gradient(135deg,rgba(16,185,129,0.07) 0%,transparent 100%)',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg,#10b981,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
          animation: 'urlFloat 3s ease-in-out infinite',
        }}>🔗</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 900, fontSize: 'clamp(14px,3vw,16px)', color: 'var(--text)' }}>
              URL로 상품 정보 불러오기
            </p>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(16,185,129,0.15)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)',
            }}>선택사항</span>
            {done && (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(0,229,160,0.15)', color: 'var(--green)',
                border: '1px solid rgba(0,229,160,0.3)',
              }}>✓ 불러오기 완료</span>
            )}
          </div>
          <p style={{ fontSize: 'clamp(11px,2.5vw,12px)', color: 'var(--text-muted)', marginTop: '3px' }}>
            {isOpen ? '쇼핑몰 상품 URL → AI가 상품명·특징·가격 자동 추출 → 입력폼 자동 완성' : '🛒 상품 URL 하나로 입력폼을 자동으로 채워줍니다. 클릭해서 펼쳐보세요'}
          </p>
        </div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', transition: 'transform 0.3s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0,
        }}>▾</div>
      </button>

      {isOpen && (
        <div style={{ padding: 'clamp(16px,3vw,24px) clamp(16px,4vw,28px)' }}>

          {/* 지원 사이트 */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>지원 쇼핑몰</p>
              <button onClick={() => setShowGuide(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {showGuide ? '접기 ▲' : '상세 ▼'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SITE_BADGES.map((s, i) => (
                <span key={i} style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${s.color}18`, color: s.color === '#FEE500' ? '#b8a000' : s.color, border: `1px solid ${s.color}33` }}>{s.label}</span>
              ))}
            </div>
            {showGuide && (
              <div style={{ marginTop: '10px', padding: '12px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <p>• 상품 상세 페이지 URL을 입력해주세요 (검색 결과 URL ✕)</p>
                <p>• 로그인 필요 페이지는 불러올 수 없어요</p>
                <p>• AI가 직접 텍스트를 분석해서 추출하므로 대부분의 쇼핑몰 지원</p>
                <p>• 정보가 부정확하면 입력폼에서 직접 수정하세요</p>
              </div>
            )}
          </div>

          {/* 키 없을 때 안내 */}
          {!hasKey && (
            <div style={{
              background: 'rgba(255,107,53,0.06)', border: '1px dashed rgba(255,107,53,0.3)',
              borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px', fontWeight: 700 }}>
                AI 키가 필요합니다
              </p>
              <button onClick={onGoSettings} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>⚙️ 키 설정하기</button>
            </div>
          )}

          {/* URL 입력 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); setDone(false) }}
                onKeyDown={e => e.key === 'Enter' && !loading && handleFetch()}
                placeholder="https://smartstore.naver.com/... 또는 쿠팡, 11번가 URL"
                disabled={loading || !hasKey}
                style={{
                  width: '100%', background: 'var(--surface2)', border: `1px solid ${error && error !== 'settings' ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                  borderRadius: '12px', padding: '12px 40px 12px 14px', color: 'var(--text)',
                  fontSize: 'clamp(13px,3vw,14px)', outline: 'none', fontFamily: 'inherit',
                  opacity: !hasKey ? 0.5 : 1, boxSizing: 'border-box' as const,
                }}
              />
              {url && (
                <button onClick={reset} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '4px' }}>×</button>
              )}
            </div>
            <button
              onClick={handleFetch}
              disabled={loading || !hasKey || !url.trim()}
              style={{
                padding: '12px clamp(14px,3vw,20px)',
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg,#10b981,#059669)',
                color: loading ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: 'clamp(13px,3vw,14px)', fontWeight: 800,
                cursor: loading || !hasKey || !url.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0,
                transition: 'all 0.2s', boxShadow: !loading && hasKey ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', animation: 'urlSpin 1s linear infinite' }}>⟳</span>
                  분석중
                </span>
              ) : '불러오기'}
            </button>
          </div>

          {error && error !== 'settings' && (
            <p style={{ fontSize: '13px', color: '#ff6666', marginBottom: '12px', padding: '10px 14px', background: 'rgba(255,68,68,0.08)', borderRadius: '8px' }}>{error}</p>
          )}

          {/* 완료 미리보기 */}
          {done && preview && (
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green)' }}>
                  {preview.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {preview.host} · {preview.price || '가격 확인'}
                </p>
              </div>
              <button onClick={reset} style={{ background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: 'var(--green)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>다시</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
