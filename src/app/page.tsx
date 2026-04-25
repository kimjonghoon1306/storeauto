'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DetailPageBuilder from './DetailPageBuilder'
import TrendSearch from './TrendSearch'
import ImageAnalyzer from './ImageAnalyzer'
import GuideModal from './GuideModal'
import { ProductInput, GeneratedResult } from '@/lib/types'


const CATEGORIES = [
  '패션의류', '패션잡화', '뷰티', '식품', '주방용품', '생활용품',
  '가구/인테리어', '디지털/가전', '스포츠/레저', '출산/육아',
  '반려동물', '문구/오피스', '자동차용품', '건강', '기타',
]

const PROMOTIONS = ['무료배송', '할인중', '당일배송', '사은품증정', '신상품', '한정수량']

export default function Home() {
  const [input, setInput] = useState<ProductInput>({
    productName: '', category: '', features: [],
    targetCustomer: '', priceRange: '', promotions: [], extraInfo: '',
  })
  const [featureInput, setFeatureInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<{id: number; date: string; productName: string; result: GeneratedResult}[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light' | 'pink'>('dark')

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`
  }, [theme])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('storeauto_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const [persona, setPersona] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq'>('gemini')
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [naverClientId, setNaverClientId] = useState('')
  const [naverClientSecret, setNaverClientSecret] = useState('')
  const router = useRouter()

  // 설정 페이지에서 저장한 키 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('storeauto_keys')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.gemini) setGeminiKey(parsed.gemini)
        if (parsed.openai) setOpenaiKey(parsed.openai)
        if (parsed.groq) setGroqKey(parsed.groq)
        if (parsed.naverClient) setNaverClientId(parsed.naverClient)
        if (parsed.naverSecret) setNaverClientSecret(parsed.naverSecret)
      }
      const savedTheme = localStorage.getItem('storeauto_theme')
      if (savedTheme) setTheme(savedTheme as 'dark' | 'light' | 'pink')
    } catch {}
  }, [])
  const [regenLoading, setRegenLoading] = useState<string | null>(null)
  const [seoKeyword, setSeoKeyword] = useState('')
  const [trendQuery, setTrendQuery] = useState('')
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

  // 공통 AI 호출 함수
  const callAI = useCallback(async (prompt: string): Promise<string> => {
    let text = ''
    if (provider === 'gemini') {
      const GEMINI_MODELS = ['gemini-2.0-flash','gemini-2.0-flash-lite','gemini-2.5-flash','gemini-1.5-flash-latest']
      let lastErr = ''
      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }) }
          )
          if (!res.ok) {
            const errData = await res.json()
            const msg = (errData?.error?.message || '').toLowerCase()
            const status = res.status
            if (status === 401 || status === 403 || msg.includes('api key') || msg.includes('api_key')) throw new Error('Gemini API 키가 잘못되었습니다.')
            lastErr = `${model} 오류(${status})`; continue
          }
          const data = await res.json()
          text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (!text) { lastErr = `${model} 빈 응답`; continue }
          break
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : ''
          if (msg.includes('API 키')) throw e
          lastErr = msg; continue
        }
      }
      if (!text) throw new Error(`생성 실패: ${lastErr}`)
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey.trim()}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(`OpenAI 오류: ${e?.error?.message || ''}`) }
      const data = await res.json()
      text = data.choices?.[0]?.message?.content || ''
    } else {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey.trim()}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(`Groq 오류: ${e?.error?.message || ''}`) }
      const data = await res.json()
      text = data.choices?.[0]?.message?.content || ''
    }
    return text
  }, [provider, geminiKey, openaiKey, groqKey])

  // 섹션별 재생성
  type RegenSection = 'keywords' | 'oneLiner' | 'description' | 'recommendation' | 'cta' | 'faq'
  const handleRegen = async (section: RegenSection) => {
    if (!result) return
    setRegenLoading(section)
    try {
      const noHanja = '절대 한자, 일본어, 중국어 사용 금지. 오직 한글, 영어, 숫자만 사용.'
      const sectionPrompts: Record<RegenSection, string> = {
        keywords: `다음 상품의 네이버 검색 최적화 키워드 10개를 새롭게 생성해주세요.
상품명: ${input.productName}, 카테고리: ${input.category}, 특징: ${input.features.join(', ')}, 타겟: ${input.targetCustomer}
${noHanja}
JSON 배열로만 응답: ["키워드1","키워드2","키워드3","키워드4","키워드5","키워드6","키워드7","키워드8","키워드9","키워드10"]`,
        oneLiner: `다음 상품의 핵심을 담은 감성적인 한 줄 카피를 새롭게 1개만 만들어주세요.
상품명: ${input.productName}, 특징: ${input.features.join(', ')}, 타겟: ${input.targetCustomer}
${noHanja} 따옴표 없이 카피 텍스트만 출력하세요. 25자 내외.`,
        description: `다음 상품의 상세 설명을 새롭게 작성해주세요. 700자 이상, 줄바꿈은 \n 사용, 쌍따옴표 금지.
상품명: ${input.productName}, 카테고리: ${input.category}, 특징: ${input.features.join(', ')}, 가격: ${input.priceRange}, 타겟: ${input.targetCustomer}
${noHanja} 텍스트만 출력하세요.`,
        recommendation: `다음 상품을 추천하는 3가지 타입의 고객을 구체적 상황으로 묘사해주세요. 줄바꿈은 \n 사용, 쌍따옴표 금지.
상품명: ${input.productName}, 특징: ${input.features.join(', ')}, 타겟: ${input.targetCustomer}
${noHanja} 텍스트만 출력하세요.`,
        cta: `다음 상품의 구매 유도 멘트를 새롭게 3~4문장으로 작성해주세요. 긴급성과 혜택 강조. 줄바꿈은 \n 사용, 쌍따옴표 금지.
상품명: ${input.productName}, 프로모션: ${input.promotions.join(', ') || '없음'}, 가격: ${input.priceRange}
${noHanja} 텍스트만 출력하세요.`,
        faq: `다음 상품에 대해 실제 구매자가 궁금해할 FAQ 5개를 새롭게 만들어주세요.
상품명: ${input.productName}, 카테고리: ${input.category}, 특징: ${input.features.join(', ')}
${noHanja} 쌍따옴표 금지.
JSON 배열로만 응답: [{"q":"질문1","a":"답변1"},{"q":"질문2","a":"답변2"},{"q":"질문3","a":"답변3"},{"q":"질문4","a":"답변4"},{"q":"질문5","a":"답변5"}]`,
      }

      const text = await callAI(sectionPrompts[section])
      const cleaned = text.replace(/\`\`\`json|\`\`\`/g, '').trim()

      setResult(prev => {
        if (!prev) return prev
        if (section === 'keywords') {
          try { return { ...prev, keywords: JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] || '[]') } } catch { return prev }
        }
        if (section === 'faq') {
          try { return { ...prev, faq: JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] || '[]') } } catch { return prev }
        }
        return { ...prev, [section]: cleaned }
      })
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '재생성 중 오류가 발생했습니다.')
    } finally {
      setRegenLoading(null)
    }
  }

  const handleSubmit = async () => {
    if (!input.productName || !input.category || input.features.length === 0 || !input.targetCustomer || !input.priceRange) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    const currentKey = provider === 'gemini' ? geminiKey : provider === 'openai' ? openaiKey : groqKey
    if (!currentKey.trim()) {
      setError(`${provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Groq'} API 키를 입력해주세요.`)
      return
    }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const PERSONA_GUIDES: Record<string, string> = {
        A: '친근한 이웃 언니/오빠처럼 써주세요. 솔직하고 편한 구어체, 단점도 언급하되 결국 추천. 이거 진짜 써봤는데요, 처음엔 저도 반신반의했어요 같은 표현 사용.',
        B: '전문가 큐레이터처럼 써주세요. 구체적 수치와 기술적 근거 중심, 객관적이고 신뢰감 있는 톤, 비슷한 제품과의 차별점 명확히 제시.',
        C: '감성 스토리텔러처럼 써주세요. 사용 전 불편함 → 발견 → 사용 후 변화 스토리 구조, 감정 이입, 계절감과 일상 장면 묘사.',
        D: '실속파 소비자처럼 써주세요. 가성비, 실용성, 직접 비교 중심. 이 가격에 이 퀄리티면, 돈 아깝지 않아요 같은 표현.',
      }
      const prompt = `당신은 대한민국 최고의 스마트스토어 상품 상세페이지 전문 카피라이터입니다.

[상품 정보]
- 상품명: ${input.productName}
- 카테고리: ${input.category}
- 핵심 특징: ${input.features.join(', ')}
- 타겟 고객: ${input.targetCustomer}
- 가격대: ${input.priceRange}
- 프로모션: ${input.promotions.length > 0 ? input.promotions.join(', ') : '없음'}
- 추가 정보: ${input.extraInfo || '없음'}
${seoKeyword ? `- SEO 타겟 키워드: ${seoKeyword} (이 키워드를 description, recommendation, cta 전체에 자연스럽게 최소 5회 이상 반드시 포함)` : ''}

[글쓰기 스타일] ${PERSONA_GUIDES[persona]}

[작성 원칙]
1. AI 느낌 절대 금지, 실제 사람이 쓴 것처럼
2. 키워드를 자연스럽게 7회 이상 녹여내기
3. description은 반드시 700자 이상${seoKeyword ? `
4. SEO 타겟 키워드 "${seoKeyword}"를 description에 5회 이상 자연스럽게 포함` : ''}
4. recommendation은 3가지 타입 고객을 구체적 상황으로 각 2~3문장
5. faq는 실제 구매자가 궁금해할 현실적 질문과 상세한 답변
6. cta는 긴급성과 혜택 강조 3~4문장
7. 절대로 JSON 값 안에 쌍따옴표 사용 금지. 줄바꿈은 \\n 으로만

아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:

{
  "keywords": ["키워드1","키워드2","키워드3","키워드4","키워드5","키워드6","키워드7","키워드8","키워드9","키워드10"],
  "oneLiner": "감성적이고 클릭하고 싶은 한 줄 카피 25자 내외",
  "description": "700자 이상 상세 설명. 줄바꿈은 \\n 사용",
  "recommendation": "3가지 타입 고객 묘사. 줄바꿈은 \\n 사용",
  "cta": "구매 유도 멘트 3~4문장. 줄바꿈은 \\n 사용",
  "faq": [
    {"q": "질문1", "a": "답변1"},
    {"q": "질문2", "a": "답변2"},
    {"q": "질문3", "a": "답변3"},
    {"q": "질문4", "a": "답변4"},
    {"q": "질문5", "a": "답변5"}
  ],
  "htmlCode": ""
}`
      const text = await callAI(prompt)

      const cleaned = text.replace(/```json|```/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('응답에서 JSON을 찾을 수 없습니다.')

      // htmlCode 필드 내부의 줄바꿈/따옴표로 인한 JSON 파싱 오류 방지
      let jsonStr = jsonMatch[0]
      try {
        JSON.parse(jsonStr)
      } catch {
        // htmlCode 값만 추출해서 따로 처리
        jsonStr = jsonStr.replace(
          /"htmlCode"\s*:\s*"([\s\S]*?)"(?=\s*[}])/,
          (_, v) => `"htmlCode": ${JSON.stringify(v.replace(/\\n/g, '\n'))}`
        )
        // 그래도 안되면 htmlCode를 빈값으로
        try {
          JSON.parse(jsonStr)
        } catch {
          jsonStr = jsonStr.replace(/"htmlCode"\s*:\s*"[\s\S]*?"(?=\s*[}])/, '"htmlCode": ""')
        }
      }
      const parsed: GeneratedResult = JSON.parse(jsonStr)
      setResult(parsed)
      // 히스토리 저장
      const newItem = {
        id: Date.now(),
        date: new Date().toLocaleString('ko-KR'),
        productName: input.productName,
        result: parsed,
      }
      setHistory(prev => {
        const updated = [newItem, ...prev].slice(0, 20)
        try { localStorage.setItem('storeauto_history', JSON.stringify(updated)) } catch {}
        return updated
      })
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

  const RegenBtn = ({ section, label }: { section: 'keywords' | 'oneLiner' | 'description' | 'recommendation' | 'cta' | 'faq'; label: string }) => (
    <button
      onClick={() => handleRegen(section)}
      disabled={regenLoading !== null}
      style={{
        background: regenLoading === section ? 'var(--surface2)' : 'rgba(255,107,53,0.1)',
        border: '1px solid var(--accent)', color: regenLoading === section ? 'var(--text-muted)' : 'var(--accent)',
        borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
        cursor: regenLoading !== null ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap' as const, fontWeight: 600,
        transition: 'all 0.2s',
      }}
    >
      {regenLoading === section ? '⟳ 생성중...' : `↺ ${label} 재생성`}
    </button>
  )

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyText(text, id)}
      style={{
        background: copied === id ? 'var(--green)' : 'var(--surface2)',
        border: '1px solid var(--border)', color: copied === id ? '#000' : 'var(--text-muted)',
        borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      {copied === id ? '✓ 복사됨' : '복사'}
    </button>
  )

  return (
    <>
      <GuideModal />


      <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 20px) 80px' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 'clamp(28px, 5vw, 48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'var(--accent)', color: '#fff', fontWeight: 900,
                fontSize: 'clamp(11px, 2.5vw, 13px)', letterSpacing: '2px',
                padding: '4px 10px', borderRadius: '4px',
              }}>STORE AUTO</div>
              <span style={{ color: 'var(--text-muted)', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>AI 상품설명 자동화</span>
            </div>
            {/* 설정 + 히스토리 + 테마 버튼 */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/settings')} style={{
                padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                borderRadius: '8px', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid var(--accent)', background: 'rgba(255,107,53,0.1)',
                color: 'var(--accent)', transition: 'all 0.15s',
              }}>⚙️ 키 설정</button>
              <button onClick={() => router.push('/reviews')} style={{
                padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                borderRadius: '8px', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b', transition: 'all 0.15s',
              }}>💬 리뷰 답글</button>
              {history.length > 0 && (
                <button onClick={() => setShowHistory(v => !v)} style={{
                  padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                  borderRadius: '8px', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text-muted)', transition: 'all 0.15s',
                }}>📋 기록 ({history.length})</button>
              )}
              {([
                { key: 'dark', label: '🌙' },
                { key: 'light', label: '☀️' },
                { key: 'pink', label: '🌸' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setTheme(t.key)} style={{
                  padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                  borderRadius: '8px', fontSize: 'clamp(14px, 3vw, 16px)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: theme === t.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: theme === t.key ? 'rgba(255,107,53,0.15)' : 'var(--surface2)',
                  transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 48px)', fontWeight: 900, lineHeight: 1.15 }}>
            스마트스토어 상세페이지<br />
            <span style={{ color: 'var(--accent)' }}>10초</span>면 완성
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: 'clamp(13px, 3vw, 15px)' }}>
            상품 정보만 입력하면 키워드 · 설명 · FAQ · HTML까지 한 번에
          </p>
        </div>

        {/* 히스토리 패널 */}
        {showHistory && history.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '20px', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--accent)' }}>📋 생성 기록</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  총 {history.length}개 · 이 기기 브라우저에만 저장됩니다
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  if (confirm('기록을 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.')) {
                    setHistory([])
                    localStorage.removeItem('storeauto_history')
                  }
                }} style={{
                  background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                  color: '#ff6666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                }}>🗑️ 전체 초기화</button>
                <button onClick={() => setShowHistory(false)} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px',
                  padding: '6px 12px', fontSize: '12px', color: 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>닫기</button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {history.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '12px 16px', gap: '12px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => {
                      setResult(item.result)
                      setInput(prev => ({ ...prev, productName: item.productName }))
                      setShowHistory(false)
                      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                    }} style={{
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>불러오기</button>
                    <button onClick={() => {
                      const updated = history.filter(h => h.id !== item.id)
                      setHistory(updated)
                      try { localStorage.setItem('storeauto_history', JSON.stringify(updated)) } catch {}
                    }} style={{
                      background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)',
                      borderRadius: '6px', padding: '6px 10px', fontSize: '12px',
                      color: '#ff6666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 입력 폼 */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px',
        }}>
          <div style={{ display: 'grid', gap: 'clamp(16px, 3vw, 24px)' }}>

            {/* AI 이미지 분석 */}
            <ImageAnalyzer
              geminiKey={geminiKey}
              openaiKey={openaiKey}
              onResult={(result) => {
                setInput(prev => ({
                  ...prev,
                  productName: result.productName || prev.productName,
                  category: result.category || prev.category,
                  features: result.features?.length ? result.features : prev.features,
                  targetCustomer: result.targetCustomer || prev.targetCustomer,
                  priceRange: result.priceRange || prev.priceRange,
                  extraInfo: result.extraInfo || prev.extraInfo,
                }))
                if (result.productName) setTrendQuery(result.productName)
              }}
              onGoSettings={() => router.push('/settings')}
            />

            {/* 네이버 트렌드 & AI 키워드 */}
            <TrendSearch
              onKeywordSelect={(kw) => setSeoKeyword(kw)}
              onClearSeoKeyword={() => setSeoKeyword('')}
              callAI={callAI}
              naverClientId={naverClientId}
              naverClientSecret={naverClientSecret}
              onGoSettings={() => router.push('/settings')}
              initialQuery={trendQuery}
            />

            {/* 페르소나 선택 */}
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: 'clamp(14px, 3vw, 16px)',
            }}>
              <Label>글쓰기 스타일 선택</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {([
                  { key: 'A', emoji: '👥', label: '친근한 언니/오빠', desc: '솔직하고 편한 구어체' },
                  { key: 'B', emoji: '🎓', label: '전문가 큐레이터', desc: '데이터 중심 신뢰감' },
                  { key: 'C', emoji: '✨', label: '감성 스토리텔러', desc: '감정 이입 스토리' },
                  { key: 'D', emoji: '💰', label: '실속파 소비자', desc: '가성비·실용성 중심' },
                ] as const).map(p => (
                  <button key={p.key} onClick={() => setPersona(p.key)} style={{
                    padding: 'clamp(10px, 2vw, 12px)', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                    border: persona === p.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: persona === p.key ? 'rgba(255,107,53,0.1)' : 'var(--bg)',
                    transition: 'all 0.15s',
                  }}>
                    <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: 700, color: persona === p.key ? 'var(--accent)' : 'var(--text)', marginBottom: '2px' }}>
                      {p.emoji} {p.label}
                    </p>
                    <p style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: 'var(--text-muted)' }}>{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI 선택 + 키 상태 표시 */}
            <div style={{
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: '10px', padding: 'clamp(14px, 3vw, 16px)',
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {([
                  { key: 'gemini', label: '✦ Gemini', badge: '일부무료', badgeColor: '#f59e0b', hasKey: !!geminiKey, cap: '글쓰기만 가능', capColor: '#f59e0b' },
                  { key: 'openai', label: '⬡ OpenAI', badge: '유료',    badgeColor: '#ef4444', hasKey: !!openaiKey, cap: '이미지분석 + 글쓰기', capColor: '#34d399' },
                  { key: 'groq',   label: '⚡ Groq',   badge: '무료',    badgeColor: '#00e5a0', hasKey: !!groqKey,   cap: '글쓰기만 가능', capColor: '#60a5fa' },
                ] as const).map(p => (
                  <button key={p.key} onClick={() => setProvider(p.key)} style={{
                    flex: 1, padding: 'clamp(8px, 2vw, 10px)', borderRadius: '8px',
                    fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    border: provider === p.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: provider === p.key ? 'var(--accent)' : 'var(--surface2)',
                    color: provider === p.key ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s',
                    position: 'relative' as const,
                  }}>
                    <span style={{ display: 'block' }}>{p.label}</span>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, marginTop: '2px',
                      color: provider === p.key ? 'rgba(255,255,255,0.85)' : p.badgeColor,
                    }}>{p.badge}</span>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, marginTop: '3px',
                      color: provider === p.key ? 'rgba(255,255,255,0.9)' : p.capColor,
                    }}>{p.cap}</span>
                  </button>
                ))}
              </div>

              {/* 키 상태 표시 */}
              {(provider === 'gemini' ? geminiKey : provider === 'openai' ? openaiKey : groqKey) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>
                      {provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Groq'} 키 등록됨
                    </span>
                  </div>
                  <button onClick={() => router.push('/settings')} style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                    padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>⚙️ 키 변경</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
                  background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
                  borderRadius: '8px', padding: '10px 14px',
                }}>
                  <span style={{ fontSize: '13px', color: '#ff6666' }}>
                    ⚠️ {provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Groq'} 키가 없습니다
                  </span>
                  <button onClick={() => router.push('/settings')} style={{
                    background: 'var(--accent)', border: 'none', borderRadius: '6px',
                    padding: '6px 14px', fontSize: '12px', color: '#fff', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>⚙️ 키 설정하기</button>
                </div>
              )}
            </div>

            {/* 상품명 */}
            <div>
              <Label>상품명 <Required /></Label>
              <input type="text" value={input.productName}
                onChange={e => setInput(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="예: 프리미엄 등산화 방수 트레킹화" style={inputStyle} />
            </div>

            {/* 카테고리 */}
            <div>
              <Label>카테고리 <Required /></Label>
              <select value={input.category}
                onChange={e => setInput(prev => ({ ...prev, category: e.target.value }))} style={inputStyle}>
                <option value="">카테고리 선택</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* 핵심 특징 */}
            <div>
              <Label>핵심 특징 <Required /> <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(최대 8개)</span></Label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input type="text" value={featureInput}
                  onChange={e => setFeatureInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="예: 방수, 경량 (입력 후 Enter 또는 추가)"
                  style={{ ...inputStyle, flex: 1 }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Label>타겟 고객 <Required /></Label>
                <input type="text" value={input.targetCustomer}
                  onChange={e => setInput(prev => ({ ...prev, targetCustomer: e.target.value }))}
                  placeholder="예: 30~40대 등산 남성" style={inputStyle} />
              </div>
              <div>
                <Label>가격대 <Required /></Label>
                <input type="text" value={input.priceRange}
                  onChange={e => setInput(prev => ({ ...prev, priceRange: e.target.value }))}
                  placeholder="예: 89,000원" style={inputStyle} />
              </div>
            </div>

            {/* 프로모션 */}
            <div>
              <Label>프로모션 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(해당 항목 선택)</span></Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PROMOTIONS.map(p => (
                  <button key={p} onClick={() => togglePromo(p)} style={{
                    padding: 'clamp(7px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px)',
                    borderRadius: '8px', fontSize: 'clamp(13px, 3vw, 14px)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    border: input.promotions.includes(p) ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: input.promotions.includes(p) ? 'rgba(255,107,53,0.15)' : 'var(--surface2)',
                    color: input.promotions.includes(p) ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {/* 추가 정보 */}
            <div>
              <Label>추가 정보 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(선택)</span></Label>
              <textarea value={input.extraInfo}
                onChange={e => setInput(prev => ({ ...prev, extraInfo: e.target.value }))}
                placeholder="예: 국내 제조, 1년 AS 보장, 사이즈 235~280mm"
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* 에러 */}
            {error && (
              <div style={{ color: '#ff4444', fontSize: '14px', background: 'rgba(255,68,68,0.1)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.3)', lineHeight: 1.6 }}>
                {error}
              </div>
            )}

            {/* 생성 버튼 */}
            <button onClick={handleSubmit} disabled={loading} style={{
              background: loading ? 'var(--surface2)' : 'var(--accent)',
              color: loading ? 'var(--text-muted)' : '#fff', border: 'none',
              borderRadius: '12px', padding: 'clamp(16px, 3vw, 18px)',
              fontSize: 'clamp(15px, 3.5vw, 17px)', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s', letterSpacing: '0.5px', width: '100%',
            }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                  <span style={{ marginLeft: '4px' }}>AI 생성 중...</span>
                </span>
              ) : '✦ 상품 설명 자동 생성'}
            </button>
          </div>
        </div>
        {/* 결과 */}
        {result && (
          <div ref={resultRef} className="fade-up" style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%' }} />
                <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>생성 완료</span>
              </div>
              <button onClick={() => {
                if (confirm('생성된 콘텐츠를 삭제할까요?')) setResult(null)
              }} style={{
                background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)',
                borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                color: '#ff6666', cursor: 'pointer', fontFamily: 'inherit',
              }}>🗑️ 콘텐츠 삭제</button>
            </div>

            <div className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>🔍 네이버 검색 최적화 키워드</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <RegenBtn section="keywords" label="키워드" />
                  <CopyBtn text={result.keywords.join(', ')} id="keywords" />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {result.keywords.map((k, i) => (
                  <span key={i} style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: 'clamp(4px, 1vw, 6px) clamp(10px, 2vw, 14px)',
                    fontSize: 'clamp(12px, 2.5vw, 14px)', color: 'var(--accent2)',
                  }}>{k}</span>
                ))}
              </div>
            </div>

            <div className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>✦ 핵심 카피</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <RegenBtn section="oneLiner" label="카피" />
                  <CopyBtn text={result.oneLiner} id="oneliner" />
                </div>
              </div>
              <p style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700, color: 'var(--accent2)', marginTop: '4px' }}>{result.oneLiner}</p>
            </div>

            <div className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>📝 상세 설명</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <RegenBtn section="description" label="설명" />
                  <CopyBtn text={result.description} id="desc" />
                </div>
              </div>
              <p style={{ lineHeight: 1.9, whiteSpace: 'pre-line', color: 'var(--text)', fontSize: 'clamp(14px, 3vw, 15px)', marginTop: '4px' }}>{result.description}</p>
            </div>

            <div className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>👤 이런 분께 추천</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <RegenBtn section="recommendation" label="추천" />
                  <CopyBtn text={result.recommendation} id="rec" />
                </div>
              </div>
              <p style={{ lineHeight: 2, whiteSpace: 'pre-line', color: 'var(--text)', fontSize: 'clamp(14px, 3vw, 15px)', marginTop: '4px' }}>{result.recommendation}</p>
            </div>

            <div className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>🛒 구매 유도 멘트</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <RegenBtn section="cta" label="멘트" />
                  <CopyBtn text={result.cta} id="cta" />
                </div>
              </div>
              <p style={{ lineHeight: 1.8, color: 'var(--accent)', fontWeight: 500, fontSize: 'clamp(14px, 3vw, 15px)', marginTop: '4px' }}>{result.cta}</p>
            </div>

            <div className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>❓ FAQ</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <RegenBtn section="faq" label="FAQ" />
                  <CopyBtn text={result.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')} id="faq" />
                </div>
              </div>
              <div style={{ display: 'grid', gap: '14px', marginTop: '8px' }}>
                {result.faq.map((item, i) => (
                  <div key={i} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '14px' }}>
                    <p style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text)', fontSize: 'clamp(13px, 3vw, 14px)' }}>Q. {item.q}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(13px, 3vw, 14px)', lineHeight: 1.7 }}>A. {item.a}</p>
                  </div>
                ))}
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
                border: '1px solid var(--border)', borderRadius: '10px',
                padding: 'clamp(14px, 3vw, 16px)', fontSize: 'clamp(14px, 3vw, 15px)',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s', width: '100%',
              }}
            >
              {copied === 'all' ? '✓ 전체 복사 완료!' : '📋 전체 텍스트 복사'}
            </button>

            <DetailPageBuilder
              result={result}
              productName={input.productName}
              priceRange={input.priceRange}
              features={input.features}
            />
          </div>
        )}
      </div>

      {/* 숨겨진 관리자 버튼 */}
      <button onClick={() => router.push('/admin')} title="관리자" style={{
        position: 'fixed', bottom: '16px', right: '16px', zIndex: 50,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 8px',
        cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s',
      }}
        onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = 'rgba(255,107,53,0.7)'; el.style.borderColor = 'rgba(255,107,53,0.25)' }}
        onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = 'rgba(255,255,255,0.15)'; el.style.borderColor = 'rgba(255,255,255,0.06)' }}
      >⚙️</button>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
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
  padding: 'clamp(12px, 2.5vw, 14px) clamp(12px, 2.5vw, 14px)',
  color: 'var(--text)',
  fontSize: 'clamp(14px, 3vw, 15px)',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const addBtnStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: '8px',
  padding: '0 clamp(12px, 3vw, 18px)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'clamp(13px, 3vw, 14px)',
  whiteSpace: 'nowrap',
  minHeight: '48px',
}
