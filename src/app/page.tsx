'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DetailPageBuilder from './DetailPageBuilder'
import TrendSearch from './TrendSearch'
import ImageAnalyzer from './ImageAnalyzer'
import GuideModal from './GuideModal'
import { ProductInput, GeneratedResult } from '@/lib/types'
import { loadSession, checkSession } from '@/lib/auth'
import { loadUserKeys } from '@/lib/keys'


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
  const [isOffline, setIsOffline] = useState(false)
  const [shareId, setShareId] = useState('')
  const [sharing, setSharing] = useState(false)
  const [mobileStep, setMobileStep] = useState<1|2|3>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<{id: number; date: string; productName: string; result: GeneratedResult}[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [browseMode, setBrowseMode] = useState(false)
  const [authUser, setAuthUser] = useState<{ email: string; id: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(() => { try { return typeof window !== 'undefined' && localStorage.getItem('storeauto_admin_authed') === '1' } catch { return false } })
  const [theme, setTheme] = useState<'dark' | 'light' | 'yellow'>('dark')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`
    localStorage.setItem('storeauto_theme', theme)
  }, [theme])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('storeauto_history')
      if (saved) setHistory(JSON.parse(saved))
      // 세션 유효성 검사 (만료 시 자동 갱신)
      checkSession().then(session => {
        if (session) setAuthUser({ email: session.email, id: session.id })
      }).catch(() => {
        const session = loadSession()
        if (session) setAuthUser({ email: session.email, id: session.id })
      })
      const params = new URLSearchParams(window.location.search)
      if (params.get('browse') === '1') setBrowseMode(true)
      setIsOffline(!navigator.onLine)
      const onOnline  = () => setIsOffline(false)
      const onOffline = () => setIsOffline(true)
      window.addEventListener('online',  onOnline)
      window.addEventListener('offline', onOffline)
      return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
    } catch {}
  }, [])

  const [persona, setPersona] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq'>(() => {
    try {
      const isAdm = typeof window !== 'undefined' && localStorage.getItem('storeauto_admin_authed') === '1'
      if (isAdm) {
        const saved = localStorage.getItem('storeauto_admin_provider') as 'gemini'|'openai'|'groq'|null
        if (saved === 'gemini' || saved === 'openai' || saved === 'groq') return saved
      }
    } catch { /* ignore */ }
    return 'gemini'
  })
  const [platform, setPlatform] = useState<'smartstore' | 'coupang' | 'elevenst' | 'own'>('smartstore')
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [naverClientId, setNaverClientId] = useState('')
  const [naverClientSecret, setNaverClientSecret] = useState('')
  const router = useRouter()

  // 설정 페이지에서 저장한 키 불러오기
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('storeauto_theme')
      if (savedTheme) setTheme(savedTheme as 'dark' | 'light' | 'yellow')
      // 네이버 키는 로컬(설정 페이지)
      const sess = loadSession()
      const keysKey = sess ? `storeauto_keys_${sess.id}` : 'storeauto_keys'
      const saved = localStorage.getItem(keysKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.naverClient) setNaverClientId(parsed.naverClient)
        if (parsed.naverSecret) setNaverClientSecret(parsed.naverSecret)
      }
    } catch {}
    // 템플릿 로드
    const sessForTemplates = loadSession()
    if (sessForTemplates) {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      fetch(`${SURL}/rest/v1/product_templates?user_id=eq.${sessForTemplates.id}&order=created_at.desc`, {
        headers: { apikey: SKEY, Authorization: `Bearer ${sessForTemplates.access_token}` }
      }).then(r => r.json()).then(d => { if (Array.isArray(d)) setTemplates(d) }).catch(() => {})
    }
    // AI 키는 Supabase에서 불러오기 (모든 기기 동일)
    loadUserKeys().then(k => {
      if (k.gemini) setGeminiKey(k.gemini)
      if (k.openai) setOpenaiKey(k.openai)
      if (k.groq)   setGroqKey(k.groq)
    }).catch(() => {})
  }, [])
  const [regenLoading, setRegenLoading] = useState<string | null>(null)
  const [templates, setTemplates] = useState<{id:string; name:string; input:unknown}[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
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

  // 공통 AI 호출 함수 (서버 API 경유 - 보안)
  const callAI = useCallback(async (prompt: string): Promise<string> => {
    // ✅ Gemini: tarry 방식 - apiKey를 서버에 전달해서 서버에서 호출
    if (provider === 'gemini') {
      // 관리자: localStorage에서 직접 읽어서 /api/generate로 전달 (tarry 방식)
      if (isAdmin) {
        const adminKey = localStorage.getItem(`storeauto_admin_${provider}`) || ''
        if (!adminKey) throw new Error(`🔑 관리자 페이지에 접속해서 ${provider} 키를 한번 더 저장해주세요.`)
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: adminKey, prompt }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || '알 수 없는 오류')
        return data.text || ''
      }

      // 키 로드: state → localStorage → Supabase 직접 순서
      let resolvedKey = geminiKey
      if (!resolvedKey) {
        try {
          // 1. localStorage 시도
          const sess = JSON.parse(localStorage.getItem('sa_session') || 'null')
          const keysKey = sess?.id ? `storeauto_keys_${sess.id}` : 'storeauto_keys'
          const saved = JSON.parse(localStorage.getItem(keysKey) || localStorage.getItem('storeauto_keys') || '{}')
          resolvedKey = saved.gemini || ''

          // 2. Supabase 직접 조회 (localStorage에 없을 때)
          if (!resolvedKey && sess?.id && sess?.access_token) {
            const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            const kRes = await fetch(
              `${SURL}/rest/v1/user_keys?user_id=eq.${sess.id}&select=gemini_key&limit=1`,
              { headers: { apikey: SKEY, Authorization: `Bearer ${sess.access_token}` } }
            )
            const kData = await kRes.json()
            if (Array.isArray(kData) && kData[0]?.gemini_key) {
              resolvedKey = kData[0].gemini_key
              // state도 업데이트
              setGeminiKey(resolvedKey)
            }
          }
        } catch { /* ignore */ }
      }

      if (!resolvedKey) throw new Error('🔑 Gemini API 키가 없어요. 마이페이지에서 키를 등록해주세요.')

      // apiKey를 서버에 전달 → 서버에서 Gemini 호출 (tarry 방식)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', apiKey: resolvedKey, prompt }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || '알 수 없는 오류')
      return data.text || ''
    }

    // OpenAI / Groq: 서버 경유
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider,
        userOpenai: openaiKey || undefined,
        userGroq:   groqKey   || undefined,
        isAdmin: isAdmin || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || '알 수 없는 오류')
    return data.text || ''
  }, [provider, geminiKey, openaiKey, groqKey, isAdmin])

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

  const saveTemplate = async (name: string) => {
    if (!name.trim() || !authUser) return
    setSavingTemplate(true)
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const sess = loadSession()
      if (!sess) return
      const res = await fetch(`${SURL}/rest/v1/product_templates`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', apikey:SKEY, Authorization:`Bearer ${sess.access_token}`, Prefer:'return=representation' },
        body: JSON.stringify({ user_id: authUser.id, name: name.trim(), input }),
      })
      const data = await res.json()
      if (Array.isArray(data) && data[0]) setTemplates(prev => [data[0], ...prev])
      setShowTemplates(false)
      alert('✅ 템플릿 저장 완료!')
    } catch { alert('❌ 저장 실패') }
    setSavingTemplate(false)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('템플릿을 삭제할까요?')) return
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const sess = loadSession()
      if (!sess) return
      await fetch(`${SURL}/rest/v1/product_templates?id=eq.${id}`, {
        method: 'DELETE',
        headers: { apikey:SKEY, Authorization:`Bearer ${sess.access_token}` },
      })
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch { /* ignore */ }
  }

  const handleShare = async () => {
    if (!result) return
    setSharing(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, productName: input.productName }),
      })
      const data = await res.json()
      if (data.id) {
        setShareId(data.id)
        navigator.clipboard.writeText(`${window.location.origin}/share/${data.id}`)
      }
    } catch (_e) { /* ignore */ }
    setSharing(false)
  }

  const handleSubmit = async () => {
    if (browseMode) {
      setError('둘러보기 모드에서는 기능을 사용할 수 없어요. 로그인 후 이용해주세요.')
      return
    }
    if (!isAdmin && !authUser) {
      setError('회원가입 후 이용할 수 있어요.')
      return
    }
    if (!input.productName || !input.category || input.features.length === 0 || !input.targetCustomer || !input.priceRange) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    const currentKey = provider === 'gemini' ? geminiKey : provider === 'openai' ? openaiKey : groqKey
    if (!isAdmin && !currentKey.trim()) {
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
      const PLATFORM_GUIDES: Record<string, string> = {
        smartstore: '네이버 스마트스토어 최적화: description 700자 이상, 네이버 쇼핑 검색 키워드 반영, 리뷰/찜 유도 문구 포함.',
        coupang: '쿠팡 최적화: 로켓배송/빠른 배송 강조, 핵심 특장점 상단 집중, 가성비와 실용성 중심, 간결하고 직관적인 문체, description 500자 이내.',
        elevenst: '11번가 최적화: 할인/쿠폰 혜택 강조, 다양한 결제혜택 언급, 검색 키워드 풍부하게, description 600자 내외.',
        own: '자사몰/브랜드몰 최적화: 브랜드 스토리와 철학 강조, 프리미엄 감성, 충성고객 형성을 위한 감성 카피, 재구매 유도, description 800자 이상.',
      }
      const prompt = `당신은 대한민국 최고의 온라인 쇼핑몰 상품 상세페이지 전문 카피라이터입니다.

[플랫폼] ${platform === 'smartstore' ? '네이버 스마트스토어' : platform === 'coupang' ? '쿠팡' : platform === 'elevenst' ? '11번가' : '자사몰/브랜드몰'}
[플랫폼 최적화 규칙] ${PLATFORM_GUIDES[platform]}

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
      if (authUser) {
        try {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          const sess = loadSession()
          if (sess?.access_token) {
            // usage_stats 기록 (fire-and-forget)
            fetch(SUPABASE_URL + '/rest/v1/usage_stats', {
              method: 'POST',
              headers: { 'Content-Type':'application/json', apikey:SUPABASE_ANON_KEY, Authorization:'Bearer ' + sess.access_token, Prefer:'' },
              body: JSON.stringify({ user_id: authUser.id, type: 'detail_page', meta: input.productName }),
            }).catch(() => {})
            // generated_results 저장 → await로 shareId 확보 후 카카오 버튼 활성화
            try {
              const saveRes = await fetch(SUPABASE_URL + '/rest/v1/generated_results', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', apikey:SUPABASE_ANON_KEY, Authorization:'Bearer ' + sess.access_token, Prefer:'return=representation' },
                body: JSON.stringify({
                  user_id: authUser.id,
                  product_name: input.productName,
                  category: input.category,
                  provider,
                  result: { ...parsed, htmlCode: '' },
                }),
              })
              const saveData = await saveRes.json()
              if (Array.isArray(saveData) && saveData[0]?.id) setShareId(saveData[0].id)
            } catch (_e) { /* 저장 실패해도 생성 결과는 정상 표시 */ }
          }
        } catch (_e) { /* ignore */ }
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const buildHtml = (r: GeneratedResult, productName: string): string => `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${productName} 상세페이지</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Noto Sans KR',Apple SD Gothic Neo,sans-serif;background:#fff;color:#222;max-width:860px;margin:0 auto;padding:20px}
.kw{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.kw span{background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:20px;padding:5px 14px;font-size:13px;font-weight:700}
.copy{font-size:clamp(20px,5vw,28px);font-weight:900;color:#e65100;text-align:center;padding:28px 16px;border-bottom:3px solid #ff6b35;margin-bottom:24px;line-height:1.4}
.sec{margin:28px 0}.sec h2{font-size:15px;font-weight:900;color:#e65100;border-left:4px solid #ff6b35;padding-left:10px;margin-bottom:14px}
.desc{font-size:15px;line-height:2;color:#333;white-space:pre-line}
.rec{background:#fff8f0;border:1px solid #ffe0cc;border-radius:12px;padding:18px;font-size:14px;line-height:2;white-space:pre-line}
.cta{background:linear-gradient(135deg,#ff6b35,#ff8c42);color:#fff;border-radius:14px;padding:22px;font-size:15px;line-height:1.9;font-weight:600;white-space:pre-line}
.faq-item{border-bottom:1px solid #eee;padding:16px 0}.faq-item:last-child{border:none}
.faq-q{font-weight:800;color:#333;margin-bottom:6px;font-size:14px}.faq-a{color:#666;font-size:14px;line-height:1.8}
</style></head><body>
<div class="copy">${r.oneLiner}</div>
<div class="kw">${r.keywords.map(k=>`<span>${k}</span>`).join('')}</div>
<div class="sec"><h2>📝 상품 상세 설명</h2><p class="desc">${r.description}</p></div>
<div class="sec"><h2>👤 이런 분께 추천</h2><div class="rec">${r.recommendation}</div></div>
<div class="sec"><h2>🛒 구매 유도 멘트</h2><div class="cta">${r.cta}</div></div>
<div class="sec"><h2>❓ 자주 묻는 질문</h2>${r.faq.map(f=>`<div class="faq-item"><div class="faq-q">Q. ${f.q}</div><div class="faq-a">A. ${f.a}</div></div>`).join('')}</div>
</body></html>`

  const downloadHtml = () => {
    if (!result) return
    const html = buildHtml(result, input.productName || '상품')
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${input.productName || '상세페이지'}.html`
    a.click(); URL.revokeObjectURL(url)
  }

  const downloadText = () => {
    if (!result) return
    const txt = `[검색 키워드]\n${result.keywords.join(', ')}\n\n[핵심 카피]\n${result.oneLiner}\n\n[상세 설명]\n${result.description}\n\n[추천 고객]\n${result.recommendation}\n\n[구매 유도 멘트]\n${result.cta}\n\n[FAQ]\n${result.faq.map(f => `Q. ${f.q}\nA. ${f.a}`).join('\n\n')}`
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${input.productName || '상세페이지'}.txt`
    a.click(); URL.revokeObjectURL(url)
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

      {/* 둘러보기 모드 배너 */}
      {browseMode && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 13, color: '#f0f0ff' }}>👀 둘러보기 모드 — 기능 사용 불가</span>
          <button onClick={() => router.push('/login')} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#ff6b35,#ffd700)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🔐 로그인하기</button>
          <button onClick={() => setBrowseMode(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}


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
                borderRadius: '8px', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid var(--accent)', background: 'rgba(255,107,53,0.1)',
                color: 'var(--accent)', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>⚙️ 설정</button>
              <button onClick={() => router.push('/reviews')} style={{
                padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                borderRadius: '8px', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>💬 리뷰</button>
              <button onClick={() => router.push('/government')} style={{
                padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                borderRadius: '8px', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid #34d399', background: 'rgba(52,211,153,0.1)',
                color: '#34d399', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>🏛️ 지원</button>
              {history.length > 0 && (
                <button onClick={() => setShowHistory(v => !v)} style={{
                  padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                  borderRadius: '8px', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text-muted)', transition: 'all 0.15s',
                }}>📋 ({history.length})</button>
              )}
              {authUser ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button onClick={() => router.push('/dashboard')} style={{
                  padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                  borderRadius: '8px', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.1)',
                  color: '#ffd700', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>🏠 대시보드</button>
                <button onClick={async () => {
                  const { signOut, loadSession } = await import('@/lib/auth')
                  const sess = loadSession()
                  if (sess) await signOut(sess.access_token)
                  setAuthUser(null)
                  router.push('/login')
                }} style={{
                  padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                  borderRadius: '8px', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>🚪</button>
                </div>
              ) : (
                <button onClick={() => router.push('/login')} style={{
                  padding: 'clamp(5px, 1.5vw, 7px) clamp(8px, 2vw, 12px)',
                  borderRadius: '8px', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid rgba(255,107,53,0.3)', background: 'rgba(255,107,53,0.1)',
                  color: 'var(--accent)', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>🔐 로그인</button>
              )}
              {([
                { key: 'dark', label: '🌙' },
                { key: 'light', label: '☀️' },
                { key: 'yellow', label: '⭐' },
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
            혼자 운영하는 사장님을 위한<br />
            <span style={{ color: 'var(--accent)' }}>AI 비서</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: 'clamp(13px, 3vw, 15px)' }}>
            상세페이지 10초 · 리뷰 자동답글 · 정부지원 AI상담 — 전부 무료로
          </p>
          <p style={{ marginTop: '8px', fontSize: 'clamp(12px, 2.5vw, 13px)', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>
            지금 바로 시작해보세요 →
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
          {/* 모바일 스텝 네비게이터 */}
          <style>{`
            @media(max-width:768px){
              .step-1{display:none}.step-2{display:none}.step-3{display:none}
              .step-show{display:block!important}
              .mobile-steps{display:flex!important}
              .desktop-only{display:none!important}
            }
            @media(min-width:769px){
              .mobile-steps{display:none!important}
              .step-1,.step-2,.step-3{display:block}
            }
          `}</style>
          <div className="mobile-steps" style={{ display:'none', gap:'0', marginBottom:'16px', borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border)' }}>
            {([{n:1,l:'기본설정'},{n:2,l:'상품정보'},{n:3,l:'스타일·생성'}] as const).map(s => (
              <button key={s.n} onClick={() => setMobileStep(s.n)} style={{
                flex:1, padding:'10px 4px', background: mobileStep===s.n ? 'var(--accent)' : 'var(--surface)',
                border:'none', color: mobileStep===s.n ? '#fff' : 'var(--text-muted)',
                fontSize:'12px', fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                borderRight: s.n < 3 ? '1px solid var(--border)' : 'none',
                transition:'all 0.2s',
              }}>
                <div style={{ fontSize:'16px', marginBottom:'2px' }}>{s.n===1?'⚙️':s.n===2?'📝':'✨'}</div>
                {s.l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 'clamp(16px, 3vw, 24px)' }}>

            {/* AI 이미지 분석 */}
            <div className={`step-1 ${mobileStep===1?'step-show':''}`}>
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
            </div> {/* step-1 ImageAnalyzer 닫힘 */}

            {/* 플랫폼 선택 */}
            <div className={`step-1 ${mobileStep===1?'step-show':''}`}>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: 'clamp(14px, 3vw, 16px)' }}>
              <Label>판매 플랫폼 선택</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {([
                  { key: 'smartstore', emoji: '🟢', label: '스마트스토어', desc: '네이버 쇼핑 최적화' },
                  { key: 'coupang',    emoji: '🟡', label: '쿠팡',        desc: '로켓배송·가성비 중심' },
                  { key: 'elevenst',  emoji: '🔴', label: '11번가',      desc: '할인·쿠폰 강조' },
                  { key: 'own',        emoji: '🏷️', label: '자사몰',      desc: '브랜드 스토리 중심' },
                ] as const).map(p => (
                  <button key={p.key} onClick={() => setPlatform(p.key)} style={{
                    padding: 'clamp(10px,2vw,12px)', borderRadius: '8px', cursor: 'pointer',
                    border: platform === p.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: platform === p.key ? 'rgba(255,107,53,0.1)' : 'var(--surface)',
                    textAlign: 'left' as const, fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: platform === p.key ? 'var(--accent)' : 'var(--text)', marginBottom: '2px' }}>{p.emoji} {p.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            </div> {/* step-2 닫힘 */}

            {/* 페르소나 선택 */}
            <div className={`step-3 ${mobileStep===3?'step-show':''}`}>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: 'clamp(14px, 3vw, 16px)' }}>
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

            </div> {/* step-1 플랫폼 닫힘 */}

            {/* AI 선택 + 키 상태 표시 */}
            <div className={`step-1 ${mobileStep===1?'step-show':''}`}>
            <div style={{
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: '10px', padding: 'clamp(14px, 3vw, 16px)',
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {([
                  { key: 'gemini', label: '✦ Gemini', badge: '일부무료', badgeColor: '#f59e0b', hasKey: !!geminiKey },
                  { key: 'openai', label: '⬡ OpenAI', badge: '유료',    badgeColor: '#ef4444', hasKey: !!openaiKey },
                  { key: 'groq',   label: '⚡ Groq',   badge: '무료',    badgeColor: '#00e5a0', hasKey: !!groqKey },
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
                  </button>
                ))}
              </div>

              {/* 이미지 분석 안내 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', flexShrink: 0 }}>📷</span>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, lineHeight: 1.5 }}>
                  AI 이미지 분석은 <span style={{ color: '#7dd3fc', textDecoration: 'underline' }}>OpenAI 키만</span> 사용됩니다. Gemini·Groq는 이미지 분석 불가
                </span>
              </div>

              {/* 키 상태 표시 */}
              {isAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>관리자 키 사용 중 (무제한)</span>
                </div>
              ) : (provider === 'gemini' ? geminiKey : provider === 'openai' ? openaiKey : groqKey) ? (
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
                  <button onClick={() => router.push('/mypage?tab=keys')} style={{
                    background: 'var(--accent)', border: 'none', borderRadius: '6px',
                    padding: '6px 14px', fontSize: '12px', color: '#fff', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>🔑 키 설정하기</button>
                </div>
              )}
            </div>

            </div> {/* step-1 AI선택 닫힘 */}

            {/* 템플릿 */}
            <div className={`step-2 ${mobileStep===2?'step-show':''}`}>
            {authUser && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: showTemplates ? 12 : 0 }}>
                  <button onClick={() => setShowTemplates(v => !v)} style={{
                    flex: 1, padding: '9px 14px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)',
                    borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>📂 템플릿 불러오기 {templates.length > 0 && `(${templates.length})`}</button>
                  <button onClick={() => {
                    const name = prompt('템플릿 이름을 입력하세요 (예: 굴비 세트)')
                    if (!name) return
                    saveTemplate(name)
                  }} style={{
                    padding: '9px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 8, color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}>💾 현재 입력 저장</button>
                </div>
                {showTemplates && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                    {templates.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>저장된 템플릿이 없어요</p>
                    ) : (
                      <div style={{ display: 'grid', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                        {templates.map(t => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{((t.input as {productName?:string})?.productName) || ''}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { setInput(t.input as unknown as ProductInput); setShowTemplates(false) }} style={{ padding: '5px 10px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>불러오기</button>
                              <button onClick={() => deleteTemplate(t.id)} style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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

            </div> {/* step-3 닫힘 */}

            {/* 모바일 스텝 버튼 */}
            <div className="mobile-steps" style={{ display:'none', gap:'8px' }}>
              {mobileStep > 1 && <button onClick={() => setMobileStep(s => (s-1) as 1|2|3)} style={{ flex:1, padding:'12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text-muted)', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>← 이전</button>}
              {mobileStep < 3 ? <button onClick={() => setMobileStep(s => (s+1) as 1|2|3)} style={{ flex:1, padding:'12px', background:'var(--accent)', border:'none', borderRadius:'10px', color:'white', fontSize:'14px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>다음 →</button> : null}
            </div>

            {/* 생성 버튼 */}
            <div className={`step-3 ${mobileStep===3?'step-show':''}`} style={{ display:'block' }}>
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
            </div> {/* step-3 생성버튼 닫힘 */}
          </div>
        </div>
        {/* 결과 */}
        {result && (
          <div ref={resultRef} className="fade-up" style={{ display: 'grid', gap: '16px' }}>

            {/* 다음 단계 가이드 */}
            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>
                {platform === 'smartstore' ? '✅ 스마트스토어에 이렇게 등록하세요' : platform === 'coupang' ? '✅ 쿠팡에 이렇게 등록하세요' : platform === 'elevenst' ? '✅ 11번가에 이렇게 등록하세요' : '✅ 자사몰에 이렇게 등록하세요'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {platform === 'smartstore' && [
                  '① 아래 복사 버튼 클릭',
                  '② 스마트스토어 판매자센터 → 상품관리 → 상품등록',
                  '③ 상품정보 탭 → 상세설명 → HTML 붙여넣기',
                ].map((s, i) => <div key={i} style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>{s}</div>)}
                {platform === 'coupang' && [
                  '① 아래 복사 버튼 클릭',
                  '② 쿠팡 Wing → 아이템위너 → 상품등록',
                  '③ 상세설명란에 붙여넣기',
                ].map((s, i) => <div key={i} style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>{s}</div>)}
                {platform === 'elevenst' && [
                  '① 아래 복사 버튼 클릭',
                  '② 11번가 셀러오피스 → 상품관리 → 상품등록',
                  '③ 상세설명 HTML 편집기에 붙여넣기',
                ].map((s, i) => <div key={i} style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>{s}</div>)}
                {platform === 'own' && [
                  '① 아래 복사 버튼 클릭',
                  '② 자사몰 관리자 → 상품 → 상세페이지',
                  '③ HTML 에디터에 붙여넣기',
                ].map((s, i) => <div key={i} style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>{s}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%' }} />
                <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>생성 완료</span>
              </div>
              <button onClick={handleShare} disabled={sharing} style={{
                    background: shareId ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.1)', border: `1px solid ${shareId ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}`,
                    borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                    color: shareId ? '#34d399' : '#a78bfa', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {sharing ? '생성 중...' : shareId ? '✓ 링크 복사됨!' : '🔗 공유 링크'}
                  </button>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => copyText(
                  `[키워드]\n${result.keywords.join(', ')}\n\n[카피]\n${result.oneLiner}\n\n[상세설명]\n${result.description}\n\n[추천고객]\n${result.recommendation}\n\n[구매유도]\n${result.cta}\n\n[FAQ]\n${result.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}`,
                  'all'
                )}
                style={{
                  flex: 1,
                  background: copied === 'all' ? 'var(--green)' : 'var(--surface2)',
                  color: copied === 'all' ? '#000' : 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  padding: 'clamp(14px, 3vw, 16px)', fontSize: 'clamp(14px, 3vw, 15px)',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {copied === 'all' ? '✓ 전체 복사 완료!' : '📋 전체 복사'}
              </button>
              <button
                onClick={() => {
                  const clean = (t: string) => t.replace(/[\u4E00-\u9FFF\u3040-\u30FF]/g, '').replace(/[\u2726\U0001F50D\u2605\u2606]/g, '').trim()
                  const shareText = `[${input.productName}] 상세페이지\n\n${clean(result.oneLiner)}\n\n${clean(result.description.slice(0, 300))}...\n\n키워드: ${result.keywords.slice(0,5).join(', ')}`
                  const shareUrl = shareId ? `${window.location.origin}/share/${shareId}` : window.location.origin
                  const win = window as unknown as { Kakao?: { isInitialized?: () => boolean; init?: (k: string) => void; Share?: { sendDefault?: (o: unknown) => void } } }
                  if (win.Kakao && !win.Kakao.isInitialized?.()) win.Kakao.init?.('23d3b649f46af9c7c321eb539c21720c')
                  if (win.Kakao?.Share?.sendDefault) {
                    win.Kakao.Share.sendDefault({
                      objectType: 'text',
                      text: shareText,
                      link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                    })
                  } else if (navigator.share) {
                    navigator.share({ text: shareText, url: shareUrl }).catch(() => {})
                  } else {
                    navigator.clipboard.writeText(shareText + '\n\n' + shareUrl).then(() => {
                      alert('복사됐어요! 카카오톡에 붙여넣기 하세요.')
                    })
                  }
                }}
                style={{
                  background: '#FEE500', border: 'none', borderRadius: '10px',
                  padding: '14px 18px', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit', color: '#000',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                💬 카카오
              </button>
            </div>

            {/* 다운로드 버튼 영역 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowPreview(true)} style={{
                padding: 'clamp(12px,3vw,14px)', borderRadius: '12px',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 'clamp(12px,3vw,14px)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}>👁️ 미리보기</button>
              <button onClick={downloadHtml} style={{
                padding: 'clamp(12px,3vw,14px)', borderRadius: '12px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 'clamp(12px,3vw,14px)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}>⬇️ HTML 저장</button>
              <button onClick={downloadText} style={{
                padding: 'clamp(12px,3vw,14px)', borderRadius: '12px',
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 'clamp(12px,3vw,14px)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}>📄 텍스트 저장</button>
            </div>

            <DetailPageBuilder
              result={result}
              productName={input.productName}
              priceRange={input.priceRange}
              features={input.features}
            />
          </div>
        )}
      </div>

      {/* ── 미리보기 모달 ── */}
      {showPreview && result && (
        <div onClick={() => setShowPreview(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 860, flex: 1, display: 'flex', flexDirection: 'column',
            background: '#fff', borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}>
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 18px', background: '#111', borderBottom: '1px solid #333',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>
                👁️ 미리보기 — {input.productName}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={downloadHtml} style={{
                  background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                  color: '#34d399', borderRadius: 8, padding: '6px 14px',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}>⬇️ HTML 저장</button>
                <button onClick={() => setShowPreview(false)} style={{
                  background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer',
                }}>✕</button>
              </div>
            </div>
            {/* iframe 렌더링 */}
            <iframe
              srcDoc={buildHtml(result, input.productName || '상품')}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="상세페이지 미리보기"
            />
          </div>
        </div>
      )}

      {/* 숨겨진 관리자 버튼 */}
      <button onClick={() => router.push('/admin')} style={{
        position: 'fixed', bottom: '16px', left: '16px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 8px',
        cursor: 'pointer', fontSize: '14px', zIndex: 50,
        transition: 'all 0.3s',
      }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,107,53,0.6)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,107,53,0.2)' }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.15)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
        title="관리자"
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
