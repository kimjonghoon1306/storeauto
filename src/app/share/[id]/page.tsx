'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface SharedData {
  id: string
  product_name: string
  content: { description?: string; keywords?: string[]; oneLiner?: string; faq?: { q: string; a: string }[] }
  created_at: string
  expires_at: string
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<SharedData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/share?id=${params.id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('불러오기 실패'))
  }, [params])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050510', color: '#f0f0ff', fontFamily: "'Noto Sans KR',sans-serif", padding: '20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap'); *{box-sizing:border-box}`}</style>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#ff6b35,#ffd700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900 }}>STORE AUTO</div>
              <div style={{ fontSize: 11, color: '#44446a' }}>공유된 상세페이지</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyLink} style={{ padding: '8px 16px', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: copied ? '#34d399' : '#f0f0ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? '✓ 복사됨!' : '🔗 링크 복사'}
            </button>
            <button onClick={() => router.push('/')} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#ff6b35,#ff8c5a)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              나도 만들기 →
            </button>
          </div>
        </div>

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{error}</div>
            <div style={{ fontSize: 13, color: '#44446a', marginBottom: 24 }}>링크가 만료됐거나 존재하지 않아요</div>
            <button onClick={() => router.push('/')} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#ff6b35,#ff8c5a)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              STORE AUTO 시작하기
            </button>
          </div>
        )}

        {data && (
          <div>
            <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#ff6b35', fontWeight: 700, marginBottom: 4 }}>상품명</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{data.product_name}</div>
              <div style={{ fontSize: 11, color: '#44446a', marginTop: 8 }}>
                생성: {new Date(data.created_at).toLocaleDateString('ko-KR')} · 만료: {new Date(data.expires_at).toLocaleDateString('ko-KR')}
              </div>
            </div>

            {data.content.oneLiner && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#44446a', fontWeight: 700, marginBottom: 8 }}>✨ 핵심 한 줄</div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.6 }}>{data.content.oneLiner}</div>
              </div>
            )}

            {data.content.keywords && data.content.keywords.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#44446a', fontWeight: 700, marginBottom: 10 }}>🔍 검색 키워드</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.content.keywords.map((k, i) => (
                    <span key={i} style={{ padding: '5px 14px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 20, fontSize: 13, color: '#ff6b35', fontWeight: 700 }}>#{k}</span>
                  ))}
                </div>
              </div>
            )}

            {data.content.description && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#44446a', fontWeight: 700, marginBottom: 10 }}>📝 상품 설명</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: '#d0d0e0', whiteSpace: 'pre-wrap' }}>{data.content.description}</div>
              </div>
            )}

            {data.content.faq && data.content.faq.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px', marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#44446a', fontWeight: 700, marginBottom: 12 }}>❓ FAQ</div>
                {data.content.faq.map((f, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < data.content.faq!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, color: '#ff6b35' }}>Q. {f.q}</div>
                    <div style={{ fontSize: 13, color: '#d0d0e0', lineHeight: 1.7 }}>A. {f.a}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>나도 AI로 상세페이지 만들어보기</div>
              <div style={{ fontSize: 12, color: '#44446a', marginBottom: 16 }}>10초만에 스마트스토어 · 쿠팡 · 11번가 상세페이지 완성</div>
              <button onClick={() => router.push('/')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#ff6b35,#ffd700)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(255,107,53,0.4)' }}>
                🚀 무료로 시작하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

