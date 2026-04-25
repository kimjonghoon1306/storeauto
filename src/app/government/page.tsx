'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS: string[] = [
  '소상공인 정책자금 신청 방법 알려줘',
  '자영업자 고용보험 가입 방법은?',
  '폐업 시 받을 수 있는 지원금은?',
  '청년 창업 지원제도 뭐가 있어?',
  '온라인 판매자 세금 감면 혜택은?',
  '노란우산공제 가입 방법은?',
]

const SYSTEM_PROMPT = `당신은 대한민국 자영업자와 소상공인을 위한 정부지원 안내 전문가입니다.
다음 분야에 대해 정확하고 친절하게 안내해주세요:
- 소상공인시장진흥공단 정책자금(직접대출, 대리대출)
- 자영업자 고용보험, 노란우산공제
- 폐업지원(희망리턴패키지, 재창업자금)
- 청년 창업지원(청년창업사관학교, 창업성공패키지)
- 온라인 판매자 지원(스마트스토어 입점 지원, 온라인 진출 바우처)
- 소상공인 세금 혜택(간이과세, 부가가치세 감면)
- 고용 관련 지원(두루누리 사회보험, 일자리 안정자금)
- 지역신용보증재단 보증, 소상공인 경영개선 자금

답변 규칙:
- 한국어로 친근하게 답변
- 지원 기관명, 신청 방법, 신청처 URL 포함
- 복잡한 내용은 번호 목록으로 정리
- 모르는 내용은 솔직하게 모른다고 하고 관련 기관 안내
- 답변 마지막에 관련 추가 질문 1개 제안`

export default function GovernmentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 자영업자·소상공인을 위한 정부지원 안내 챗봇이에요 😊\n\n궁금한 지원제도, 정책자금, 세금 혜택 등 무엇이든 물어보세요!\n아래 자주 묻는 질문을 눌러도 돼요.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('storeauto_theme')
      if (savedTheme && savedTheme !== 'dark') {
        document.body.className = 'theme-' + savedTheme
      }
    } catch (_e) {
      // ignore
    }
    return () => {
      document.body.className = ''
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply: string = data.content?.[0]?.text || '죄송해요, 다시 시도해주세요.'
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (_e) {
      setMessages([...newMessages, { role: 'assistant', content: '오류가 발생했어요. 잠시 후 다시 시도해주세요.' }])
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

  const dotDelays = [0, 0.2, 0.4]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Noto Sans KR', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        input::placeholder { color: var(--text-muted); }
        * { box-sizing: border-box; }
      `}</style>

      {/* 헤더 */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >← 돌아가기</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🏛️</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>정부지원 안내 챗봇</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>자영업자·소상공인 정책자금 안내</div>
          </div>
        </div>

        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '12px',
          color: 'var(--green)',
          flexShrink: 0,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          AI
        </div>
      </div>

      {/* 채팅 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '8px',
            alignItems: 'flex-start',
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
              maxWidth: '80%',
              background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), #ff8c5a)' : 'var(--surface)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 14px',
              fontSize: '14px',
              lineHeight: '1.7',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              wordBreak: 'break-word',
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
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px',
            }}>🏛️</div>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px',
              padding: '14px 18px',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}>
              {dotDelays.map((delay, j) => (
                <span key={j} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'inline-block',
                  animation: 'bounce 1.2s ease-in-out ' + delay + 's infinite',
                }} />
              ))}
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>자주 묻는 질문</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: '1.4',
                  }}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '12px 16px',
        position: 'sticky',
        bottom: 0,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            placeholder="궁금한 지원제도를 물어보세요..."
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: 'var(--text)',
              fontSize: '14px',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >전송</button>
        </div>
        <div style={{ maxWidth: '800px', margin: '8px auto 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          AI 답변은 참고용입니다. 정확한 정보는 소상공인시장진흥공단(1357)에 문의하세요.
        </div>
      </div>
    </div>
  )
}

