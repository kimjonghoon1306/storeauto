'use client'

import { useState, useRef } from 'react'
import { ProductInput, GeneratedResult } from '@/lib/types'
import { buildPrompt } from '@/lib/prompt'

const CATEGORIES = [
  '패션의류', '패션잡화', '뷰티', '식품', '주방용품', '생활용품',
  '가구/인테리어', '디지털/가전', '스포츠/레저', '출산/육아',
  '반려동물', '문구/오피스', '자동차용품', '건강', '기타',
]

const PROMOTIONS = ['무료배송', '할인중', '당일배송', '사은품증정', '신상품', '한정수량']

export default function Home() {
  const [input, setInput] = useState<ProductInput>({
    productName: '',
    category: '',
    features: [],
    targetCustomer: '',
    priceRange: '',
    promotions: [],
    extraInfo: '',
  })
  const [featureInput, setFeatureInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const addFeature = () => {
    const val = featureInput.trim()
    if (val && input.features.length < 8 && !input.features.includes(val)) {
      setInput(prev => ({ ...prev, features: [...prev.features, val] }))
      setFeatureInput('')
    }
  }

  const removeFeature = (f: string) => {
    setInput(prev => ({ ...prev, features: prev.features.filter(x => x !== f) }))
  }

  const togglePromo = (p: string) => {
    setInput(prev => ({
      ...prev,
      promotions: prev.promotions.includes(p)
        ? prev.promotions.filter(x => x !== p)
        : [...prev.promotions, p],
    }))
  }

  const handleSubmit = async () => {
    if (!input.productName || !input.category || input.features.length === 0 || !input.targetCustomer || !input.priceRange) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    if (!apiKey.trim()) {
      setError('Gemini API 키를 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const prompt = buildPrompt(input)

      // 브라우저에서 직접 Gemini API 호출 (Vercel 서버 IP 우회)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData?.error?.message || `API 오류 (${res.status})`)
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = text.replace(/```json|```/g, '').trim()
      const parsed: GeneratedResult = JSON.parse(cleaned)

      setResult(parsed)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyText(text, id)}
      style={{
        background: copied === id ? 'var(--green)' : 'var(--surface2)',
        border: '1px solid var(--border)',
        color: copied === id ? '#000' : 'var(--text-muted)',
        borderRadius: '6px',
        padding: '4px 12px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
      }}
    >
      {copied === id ? '✓ 복사됨' : '복사'}
    </button>
  )

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 900,
            fontSize: '13px',
            letterSpacing: '2px',
            padding: '4px 10px',
            borderRadius: '4px',
          }}>STORE AUTO</div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>AI 상품설명 자동화</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, lineHeight: 1.15 }}>
          스마트스토어 상세페이지<br />
          <span style={{ color: 'var(--accent)' }}>10초</span>면 완성
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '15px' }}>
          상품 정보만 입력하면 키워드 · 설명 · FAQ · HTML까지 한 번에
        </p>
      </div>

      {/* 입력 폼 */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'grid', gap: '24px' }}>

          {/* API 키 입력 */}
          <div style={{
            background: 'rgba(255,107,53,0.08)',
            border: '1px solid rgba(255,107,53,0.3)',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <Label>Gemini API 키 <Required /></Label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza... (Google AI Studio에서 발급)"
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              🔒 키는 브라우저에서만 사용되며 서버에 저장되지 않습니다 ·{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                키 발급받기 →
              </a>
            </p>
          </div>

          {/* 상품명 */}
          <div>
            <Label>상품명 <Required /></Label>
            <input
              type="text"
              value={input.productName}
              onChange={e => setInput(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="예: 프리미엄 등산화 방수 트레킹화"
              style={inputStyle}
            />
          </div>

          {/* 카테고리 */}
          <div>
            <Label>카테고리 <Required /></Label>
            <select
              value={input.category}
              onChange={e => setInput(prev => ({ ...prev, category: e.target.value }))}
              style={inputStyle}
            >
              <option value="">카테고리 선택</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 핵심 특징 */}
          <div>
            <Label>핵심 특징 <Required /> <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(최대 8개)</span></Label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="예: 방수, 경량, 미끄럼방지 (입력 후 Enter)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addFeature} style={addBtnStyle}>추가</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {input.features.map(f => (
                <span key={f} className="tag">
                  {f}
                  <button onClick={() => removeFeature(f)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* 타겟 고객 / 가격대 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label>타겟 고객 <Required /></Label>
              <input
                type="text"
                value={input.targetCustomer}
                onChange={e => setInput(prev => ({ ...prev, targetCustomer: e.target.value }))}
                placeholder="예: 30~40대 등산 남성"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>가격대 <Required /></Label>
              <input
                type="text"
                value={input.priceRange}
                onChange={e => setInput(prev => ({ ...prev, priceRange: e.target.value }))}
                placeholder="예: 89,000원"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 프로모션 */}
          <div>
            <Label>프로모션 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(해당 항목 선택)</span></Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PROMOTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePromo(p)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    border: input.promotions.includes(p) ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: input.promotions.includes(p) ? 'rgba(255,107,53,0.15)' : 'var(--surface2)',
                    color: input.promotions.includes(p) ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 추가 정보 */}
          <div>
            <Label>추가 정보 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(선택)</span></Label>
            <textarea
              value={input.extraInfo}
              onChange={e => setInput(prev => ({ ...prev, extraInfo: e.target.value }))}
              placeholder="예: 국내 제조, 1년 AS 보장, 사이즈 235~280mm"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* 에러 */}
          {error && (
            <div style={{ color: '#ff4444', fontSize: '13px', background: 'rgba(255,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.3)' }}>
              {error}
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? 'var(--surface2)' : 'var(--accent)',
              color: loading ? 'var(--text-muted)' : '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              letterSpacing: '0.5px',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span style={{ marginLeft: '4px' }}>AI 생성 중...</span>
              </span>
            ) : '✦ 상품 설명 자동 생성'}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <div ref={resultRef} className="fade-up" style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%' }} />
            <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>생성 완료</span>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🔍 네이버 검색 최적화 키워드</h3>
              <CopyBtn text={result.keywords.join(', ')} id="keywords" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.keywords.map((k, i) => (
                <span key={i} style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '13px',
                  color: 'var(--accent2)',
                }}>{k}</span>
              ))}
            </div>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>✦ 핵심 카피</h3>
              <CopyBtn text={result.oneLiner} id="oneliner" />
            </div>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent2)' }}>{result.oneLiner}</p>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>📝 상세 설명</h3>
              <CopyBtn text={result.description} id="desc" />
            </div>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-line', color: 'var(--text)' }}>{result.description}</p>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>👤 이런 분께 추천</h3>
              <CopyBtn text={result.recommendation} id="rec" />
            </div>
            <p style={{ lineHeight: 2, whiteSpace: 'pre-line', color: 'var(--text)' }}>{result.recommendation}</p>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🛒 구매 유도 멘트</h3>
              <CopyBtn text={result.cta} id="cta" />
            </div>
            <p style={{ lineHeight: 1.8, color: 'var(--accent)', fontWeight: 500 }}>{result.cta}</p>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>❓ FAQ</h3>
              <CopyBtn text={result.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')} id="faq" />
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {result.faq.map((item, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '14px' }}>
                  <p style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>Q. {item.q}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>A. {item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="result-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3>{'</>'} HTML 코드 (스마트스토어 바로 붙여넣기)</h3>
              <CopyBtn text={result.htmlCode} id="html" />
            </div>
            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '240px',
              overflowY: 'auto',
            }}>
              <pre className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {result.htmlCode}
              </pre>
            </div>
          </div>

          <button
            onClick={() => copyText(
              `[키워드]\n${result.keywords.join(', ')}\n\n[카피]\n${result.oneLiner}\n\n[상세설명]\n${result.description}\n\n[추천고객]\n${result.recommendation}\n\n[구매유도]\n${result.cta}\n\n[FAQ]\n${result.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}`,
              'all'
            )}
            style={{
              background: copied === 'all' ? 'var(--green)' : 'var(--surface2)',
              color: copied === 'all' ? '#000' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {copied === 'all' ? '✓ 전체 복사 완료!' : '📋 전체 텍스트 복사'}
          </button>
        </div>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
      {children}
    </label>
  )
}

function Required() {
  return <span style={{ color: 'var(--accent)', marginLeft: '2px' }}>*</span>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '12px 14px',
  color: 'var(--text)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const addBtnStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: '8px',
  padding: '0 16px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  whiteSpace: 'nowrap',
}
