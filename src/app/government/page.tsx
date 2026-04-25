'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AdminData {
  id: string
  category: string
  title: string
  content: string
  region: string
  createdAt: string
}

const QUICK_QUESTIONS: string[] = [
  '우리 지역 소상공인 지원금 알려줘',
  '소상공인 무상자금 신청 방법은?',
  '협동조합 설립 방법 알려줘',
  '여성기업 인증 받는 방법은?',
  '사업계획서 작성 방법 알려줘',
  '장애인기업 확인서 발급 방법은?',
  '노란우산공제 가입하면 뭐가 좋아?',
  '희망리턴패키지 신청하고 싶어',
]

const SYSTEM_PROMPT = `당신은 대한민국 자영업자·소상공인·창업자를 위한 정부지원 전문 상담사입니다.
다음 방대한 지식을 바탕으로 정확하고 친절하게 안내하세요.

## 1. 소상공인 정책자금
소상공인시장진흥공단(소진공) 직접대출: 일반경영안정자금 연 2~3%대 최대 7천만원, 성장촉진자금 최대 1억원, 신용보증부 대출.
신청: 소상공인24(www.sbiz.or.kr) 또는 소진공 지역센터 방문.
대상: 상시근로자 5인 미만(제조/건설/운수/광업은 10인 미만).
소상공인 대리대출: 신한/국민/우리/하나/기업/농협 협약은행, 연 3~5%대.

## 2. 소상공인 무상지원(보조금)
스마트공방 기술보급: 제조 소상공인 스마트 설비, 1천만원 한도 70% 지원.
온라인 판로 지원: 스마트스토어/쿠팡 입점비, 콘텐츠 제작비 최대 200만원.
스마트상점 기술보급: 키오스크/POS/CCTV 최대 150만원(자부담 30%).
점포 환경개선: 간판/인테리어 최대 250만원(자부담 20%).
경영컨설팅: 세무/마케팅/법무 전문가 무료(연 3회).
소상공인 역량강화교육: 무료 온오프라인 교육 상시 진행.

## 3. 창업 지원
청년창업사관학교: 만 39세 이하, 최대 1억원 사업화자금+입주공간+멘토링. 창업진흥원(www.kised.or.kr).
예비창업패키지: 예비창업자 최대 1억원. K-Startup(www.k-startup.go.kr).
초기창업패키지: 3년 이내 창업자 최대 1억원.
소상공인 재도전 성공패키지: 폐업 경험자 최대 2천만원.
신사업 창업사관학교: 5060 시니어 창업 지원.

## 4. 고용 관련 지원
두루누리 사회보험: 월 270만원 미만 근로자 고용 10인 미만 사업주, 고용보험/국민연금 80% 지원. 신청: 근로복지공단.
자영업자 고용보험: 1인 자영업자 가입 가능, 보험료 기준보수의 2.05~2.25%, 폐업 시 최대 8개월 실업급여. 신청: 근로복지공단(www.comwel.or.kr).
일자리 안정자금: 30인 미만, 월 13만원 지원.

## 5. 노란우산공제
가입대상: 사업자등록증 있는 소상공인/소기업.
납입금: 월 5만~100만원 자유 선택.
혜택: 소득공제 연 최대 500만원(과세표준 4천만원 이하), 폐업/퇴임 시 원금+이자 수령, 납입금 90% 한도 대출 가능, 희망장려금 신규 가입자 월 1만원 최대 12개월.
신청: 소기업소상공인공제(www.8899.or.kr) 또는 가까운 은행.

## 6. 폐업지원 - 희망리턴패키지
점포철거비: 최대 250만원 지원.
법률/세무 컨설팅: 무료.
채무조정: 신용회복위원회 연계.
재창업 교육: 무료 교육 수료 시 사업화자금 연계.
재취업: 취업성공패키지 연계, 구직활동 지원금 월 최대 50만원.
신청방법: 소상공인24(www.sbiz.or.kr) 온라인 신청 또는 소진공 지역센터 방문. 서류: 사업자등록증, 폐업사실증명원, 신분증.

## 7. 지자체 지원금 확인 방법
1. 정부24(www.gov.kr) → 보조금24 서비스 → 개인/기업 맞춤형 검색
2. 기업마당(www.bizinfo.go.kr) → 지역별/업종별 검색
3. 각 시도 소상공인 지원센터 홈페이지
4. 시군구청 경제과/기업지원과 직접 문의
지역별 신용보증재단: 서울/경기/부산/인천/대구/광주/대전/울산/강원/충북/충남/전북/전남/경북/경남/제주 각 지역 신용보증재단 운영.
지자체 지원금은 웹 검색 도구로 최신 정보를 반드시 확인 후 안내하세요.

## 8. 협동조합 설립
일반협동조합: 발기인 5인 이상, 정관 작성, 창립총회, 시도지사 신고, 출자금 납입, 사업자등록. 별도 허가 없이 신고만으로 설립 가능. 기획재정부 협동조합(www.coop.go.kr).
사회적협동조합: 5인 이상, 공익 목적, 기획재정부 인가. 비영리법인, 배당 불가, 세금 혜택.
지원: 컨설팅 무료(한국사회적기업진흥원), 사업개발비 최대 1천만원, 협동조합 활성화 자금 최대 5천만원 저금리.

## 9. 여성기업 지원
여성기업 확인: 한국여성경제인협회 발급, 여성이 대표이거나 실질 경영자.
신청: 여성기업종합지원센터(www.wbiz.or.kr).
혜택: 공공기관 입찰 가점 5%, 여성기업 전용 정책자금, 여성창업보육센터 입주 우선권.
여성 전용 지원: 여성창업경진대회, 여성벤처창업케어프로그램, 공공구매 우선 지원.

## 10. 장애인기업 지원
장애인기업 확인: 장애인기업종합지원센터(www.debc.or.kr) 발급.
조건: 장애인이 대표이거나 실질 경영자.
서류: 장애인등록증, 사업자등록증, 재무제표.
혜택: 공공기관 입찰 가점 5%, 전용 자금 최대 5억원 저금리, 창업교육/컨설팅 무료.

## 11. 사회적기업
인증: 한국사회적기업진흥원(www.socialenterprise.or.kr), 취약계층 고용 30% 이상 등.
지원: 인건비 최저임금 80% 최대 5년, 경영지원금 연 최대 3천만원, 법인세/소득세 50% 감면(5년), 공공기관 우선구매.
예비사회적기업: 지역형(광역지자체 지정), 부처형(중앙부처 지정).

## 12. 기업 설립 방법
개인사업자: 홈택스(www.hometax.go.kr) 온라인 또는 세무서 방문. 당일~3일 소요.
법인(주식회사): 법인명 확인(대법원 인터넷등기소), 정관 작성, 출자금 납입, 법인등기, 사업자등록. 2~4주 소요. 최소 자본금 100원.
유한책임회사: 소수 출자자 적합, 등기소 설립.
협동조합: 위 8번 참조.

## 13. 사업계획서 작성법
필수 구성: 1)사업개요(사업명/창업자/아이템 요약/목표시장/예상매출), 2)사업배경및필요성(시장문제점/해결방안), 3)시장분석(TAM/SAM/SOM/경쟁사분석/차별화), 4)제품서비스소개(핵심기능/로드맵), 5)비즈니스모델(수익창출/가격정책/유통채널), 6)마케팅전략(타겟고객/홍보채널/고객확보), 7)운영계획(조직도/인력역량/프로세스), 8)재무계획(초기투자비/월별매출예측3년/손익분기점/자금조달), 9)위험요소및대응, 10)향후성장전략.
정부지원 사업계획서 TIP: 심사위원은 실현가능성 최우선, 숫자와 근거 데이터 필수(통계청 인용), 창업자 역량과 아이템 연관성 강조, 사회적 가치(일자리창출/지역기여) 포함, 정부 정책 방향과 일치하도록 작성.

## 14. 세금 혜택
간이과세: 연 매출 1억 400만원 미만 적용. 4,800만원 미만은 부가세 납부 면제.
창업 중소기업 세액감면: 수도권 외 5년간 50% 감면, 청년창업(만 34세 이하) 5년간 100% 감면.
고용 관련 세액공제: 청년 고용 시 1인당 300~1,100만원, 경력단절여성 1인당 최대 900만원.

## 15. 금융 지원
신용보증기금: 담보 없는 중소기업/소상공인 보증, 최대 30억원, 보증료 연 0.5~3%.
지역신용보증재단: 지역 소상공인 특화, 최대 1억원.
미소금융: 저신용/저소득 자영업자, 연 4.5% 이하, 사업자 2천만원/창업 7천만원. 미소금융중앙재단(www.msmf.or.kr).

답변 규칙:
- 한국어로 친근하고 상세하게 답변
- 신청 방법, 기관명, URL 반드시 포함
- 복잡한 내용은 번호/항목으로 정리
- 지자체 지원금 질문 시 웹 검색으로 최신 정보 확인 후 안내
- 모르는 내용은 솔직하게 인정하고 관련 기관 안내
- 답변 마지막에 관련 추가 질문 1개 제안`

export default function GovernmentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 자영업자·소상공인을 위한 정부지원 전문 챗봇이에요 😊\n\n✅ 소상공인 정책자금·무상지원\n✅ 지자체 지원금 실시간 검색\n✅ 협동조합·여성기업·장애인기업 설립\n✅ 사업계획서 작성법\n✅ 세금혜택·고용지원·노란우산공제\n\n무엇이든 물어보세요! 👇',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminData, setAdminData] = useState<AdminData[]>([])
  const [showAdmin, setShowAdmin] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('storeauto_theme')
      if (savedTheme && savedTheme !== 'dark') {
        document.body.className = 'theme-' + savedTheme
      }
      const saved = localStorage.getItem('gov_admin_data')
      if (saved) setAdminData(JSON.parse(saved) as AdminData[])
    } catch (_e) { /* ignore */ }
    return () => { document.body.className = '' }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildSystemPrompt = (): string => {
    let prompt = SYSTEM_PROMPT
    if (adminData.length > 0) {
      prompt += '\n\n## 관리자 등록 추가 지원정보 (우선 안내)\n'
      adminData.forEach((d) => {
        prompt += '\n[' + d.region + '] ' + d.title + ' (' + d.category + '): ' + d.content + '\n'
      })
    }
    return prompt
  }

  const callAI = async (systemPrompt: string, msgs: Message[]): Promise<string> => {
    let keys = { gemini: '', openai: '', groq: '' }
    try {
      const saved = localStorage.getItem('storeauto_keys')
      if (saved) keys = { ...keys, ...JSON.parse(saved) }
    } catch (_e) { /* ignore */ }

    const fullPrompt = systemPrompt + '\n\n' + msgs.map((m) => (m.role === 'user' ? '사용자: ' : 'AI: ') + m.content).join('\n')

    // 1순위: Gemini
    if (keys.gemini) {
      const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest']
      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + keys.gemini.trim(),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
              }),
            }
          )
          if (!res.ok) continue
          const data = await res.json()
          const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (text) return text
        } catch (_e) { continue }
      }
    }

    // 2순위: Groq
    if (keys.groq) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + keys.groq.trim() },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...msgs.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content || ''
        if (text) return text
      }
    }

    // 3순위: OpenAI
    if (keys.openai) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + keys.openai.trim() },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...msgs.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content || ''
        if (text) return text
      }
    }

    throw new Error('사용 가능한 API 키가 없어요. 설정 페이지에서 키를 입력해주세요.')
  }

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const reply = await callAI(buildSystemPrompt(), newMessages)
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (_e) {
      const errMsg = _e instanceof Error ? _e.message : '오류가 발생했어요. 잠시 후 다시 시도해주세요.'
      setMessages([...newMessages, { role: 'assistant', content: errMsg }])
    } finally {
      setLoading(false)
    }
  }

  const formatMessage = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => (
      <span key={i}>
        {line}
        {i < lines.length - 1 && <br />}
      </span>
    ))
  }

  const handleAdminChange = (data: AdminData[]) => {
    setAdminData(data)
    try {
      localStorage.setItem('gov_admin_data', JSON.stringify(data))
    } catch (_e) { /* ignore */ }
  }

  const dotDelays = [0, 0.2, 0.4]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      fontFamily: "'Noto Sans KR', sans-serif", display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        input::placeholder { color: var(--text-muted); }
        textarea::placeholder { color: var(--text-muted); }
        * { box-sizing: border-box; }
        select option { background: #1c1c28; }
      `}</style>

      {/* 헤더 */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/')} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', borderRadius: '8px', padding: '7px 12px',
          cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>← 돌아가기</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🏛️</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>정부지원 안내</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              소상공인·창업·협동조합·여성·장애인기업
            </div>
          </div>
        </div>

        <button onClick={() => setShowAdmin(!showAdmin)} style={{
          background: showAdmin ? 'rgba(255,107,53,0.15)' : 'var(--surface2)',
          border: '1px solid ' + (showAdmin ? 'var(--accent)' : 'var(--border)'),
          color: showAdmin ? 'var(--accent)' : 'var(--text-muted)',
          borderRadius: '8px', padding: '7px 12px',
          cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>⚙️ 관리{adminData.length > 0 ? ' (' + adminData.length + ')' : ''}</button>
      </div>

      {/* 관리자 패널 */}
      {showAdmin && <AdminPanel adminData={adminData} onChange={handleAdminChange} />}

      {/* 채팅 영역 */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        maxWidth: '800px', width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '8px', alignItems: 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0,
              }}>🏛️</div>
            )}
            <div style={{
              maxWidth: '82%',
              background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), #ff8c5a)' : 'var(--surface)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 14px', fontSize: '14px', lineHeight: '1.75',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)', wordBreak: 'break-word',
            }}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>🏛️</div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px', padding: '14px 18px',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}>
              {dotDelays.map((delay, j) => (
                <span key={j} style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                  display: 'inline-block',
                  animation: 'bounce 1.2s ease-in-out ' + delay + 's infinite',
                }} />
              ))}
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>💡 자주 묻는 질문</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: '20px', padding: '8px 14px',
                  fontSize: '13px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.4',
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '12px 16px', position: 'sticky', bottom: 0,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            placeholder="궁금한 지원제도를 물어보세요..."
            disabled={loading}
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '12px 14px', color: 'var(--text)',
              fontSize: '14px', outline: 'none', minWidth: 0,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
              fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >전송</button>
        </div>
        <div style={{ maxWidth: '800px', margin: '6px auto 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          AI+웹검색 기반 | 정확한 정보는 소상공인시장진흥공단(1357) 문의
        </div>
      </div>
    </div>
  )
}

interface AdminPanelProps {
  adminData: AdminData[]
  onChange: (data: AdminData[]) => void
}

function AdminPanel({ adminData, onChange }: AdminPanelProps) {
  const [form, setForm] = useState({ category: '지자체지원금', title: '', content: '', region: '전국' })

  const categories = ['지자체지원금', '정책자금', '무상지원', '창업지원', '기타']
  const regions = ['전국', '서울', '부산', '인천', '대구', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

  const add = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const newItem: AdminData = {
      id: Date.now().toString(),
      category: form.category,
      title: form.title,
      content: form.content,
      region: form.region,
      createdAt: new Date().toLocaleDateString('ko-KR'),
    }
    onChange([...adminData, newItem])
    setForm({ category: '지자체지원금', title: '', content: '', region: '전국' })
  }

  const remove = (id: string) => {
    onChange(adminData.filter((d) => d.id !== id))
  }

  return (
    <div style={{
      background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
      padding: '16px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--accent)' }}>
          ⚙️ 지원정보 직접 등록 (챗봇이 우선 참고)
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <select
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
              borderRadius: '8px', padding: '8px 10px', fontSize: '13px', cursor: 'pointer',
            }}
          >
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
              borderRadius: '8px', padding: '8px 10px', fontSize: '13px', cursor: 'pointer',
            }}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="지원사업명"
            style={{
              flex: 1, minWidth: '140px', background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="지원 내용, 신청 방법, 금액, 대상, URL 등 상세 내용"
            rows={3}
            style={{
              flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: '8px', padding: '10px 12px',
              fontSize: '13px', outline: 'none', resize: 'vertical',
            }}
          />
          <button
            onClick={add}
            style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '8px', padding: '0 16px', fontSize: '13px',
              fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >등록</button>
        </div>

        {adminData.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              등록된 정보 {adminData.length}건
            </div>
            {adminData.map((d) => (
              <div key={d.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '10px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    [{d.region}] {d.title}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{d.category} · {d.createdAt}</span>
                  </div>
                  <div style={{
                    fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {d.content}
                  </div>
                </div>
                <button
                  onClick={() => remove(d.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '18px', flexShrink: 0, padding: '0',
                    lineHeight: 1,
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
