'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Result {
  keywords: string[]
  oneLiner: string
  description: string
  recommendation: string
  cta: string
  faq: { q: string; a: string }[]
}

interface ShareData {
  product_name: string
  category: string
  result: Result
  created_at: string
}

export default function SharePage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    fetch(`${SURL}/rest/v1/generated_results?id=eq.${id}&select=product_name,category,result,created_at&limit=1`, {
      headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` }
    })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d[0]) setData(d[0])
        else setError('페이지를 찾을 수 없어요.')
      })
      .catch(() => setError('불러오기 실패'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR', sans-serif", color: '#44446a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
        <div>불러오는 중...</div>
      </div>
    </div>
  )

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR', sans-serif", color: '#f0f0ff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontSize: 16 }}>{error || '페이지를 찾을 수 없어요.'}</div>
      </div>
    </div>
  )

  const r = data.result
  const ACCENT = '#ff6b35'

  return (
    <div style={{ minHeight: '100vh', background: '#050510', color: '#f0f0ff', fontFamily: "'Noto Sans KR', sans-serif", paddingBottom: 60 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* 헤더 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${ACCENT},#ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>⚡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900 }}>STORE AUTO</div>
          <div style={{ fontSize: 10, color: '#44446a' }}>AI 상품 상세페이지</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {/* 상품명 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#44446a', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{data.category || '상품'}</div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 900, lineHeight: 1.3 }}>{data.product_name}</h1>
        </div>

        {/* 핵심 카피 */}
        {r.oneLiner && (
          <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: ACCENT, fontWeight: 800, marginBottom: 8 }}>✦ 핵심 카피</div>
            <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.6, color: '#ffd700' }}>{r.oneLiner}</div>
          </div>
        )}

        {/* 키워드 */}
        {r.keywords?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#44446a', fontWeight: 700, marginBottom: 10 }}>🔍 SEO 키워드</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {r.keywords.map((k, i) => (
                <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: `${ACCENT}15`, color: ACCENT, fontWeight: 700, border: `1px solid ${ACCENT}25` }}>{k}</span>
              ))}
            </div>
          </div>
        )}

        {/* 상세 설명 */}
        {r.description && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#44446a', fontWeight: 700, marginBottom: 10 }}>📝 상세 설명</div>
            <div style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-line', color: '#d0d0e8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>{r.description}</div>
          </div>
        )}

        {/* 추천 고객 */}
        {r.recommendation && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#44446a', fontWeight: 700, marginBottom: 10 }}>👥 추천 고객</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#d0d0e8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px' }}>{r.recommendation}</div>
          </div>
        )}

        {/* 구매 유도 */}
        {r.cta && (
          <div style={{ marginBottom: 24, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#ffd700', fontWeight: 700, marginBottom: 6 }}>🛒 구매 유도</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#d0d0e8' }}>{r.cta}</div>
          </div>
        )}

        {/* FAQ */}
        {r.faq?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#44446a', fontWeight: 700, marginBottom: 12 }}>❓ 자주 묻는 질문</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {r.faq.map((f, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT, marginBottom: 6 }}>Q. {f.q}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#b0b0cc' }}>A. {f.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다운로드 버튼 */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            onClick={() => {
              const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.product_name} 상세페이지</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050510; color: #f0f0ff; font-family: 'Noto Sans KR', sans-serif; padding: 40px 20px 80px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .logo { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg,#ff6b35,#ffd700); display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .logo-text { font-size: 13px; font-weight: 900; }
  .logo-sub { font-size: 10px; color: #44446a; }
  h1 { font-size: clamp(22px,5vw,30px); font-weight: 900; line-height: 1.3; margin-bottom: 28px; }
  .cat { font-size: 11px; color: #44446a; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
  .sec { margin-bottom: 22px; }
  .sec-label { font-size: 11px; color: #44446a; font-weight: 700; margin-bottom: 10px; }
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 18px; }
  .oneliner { background: rgba(255,107,53,0.12); border: 1px solid rgba(255,107,53,0.3); border-radius: 16px; padding: 18px 20px; margin-bottom: 22px; }
  .oneliner .label { font-size: 11px; color: #ff6b35; font-weight: 800; margin-bottom: 8px; }
  .oneliner .text { font-size: 17px; font-weight: 900; line-height: 1.6; color: #ffd700; }
  .keywords { display: flex; flex-wrap: wrap; gap: 8px; }
  .kw { font-size: 12px; padding: 5px 12px; border-radius: 20px; background: rgba(255,107,53,0.15); color: #ff6b35; font-weight: 700; border: 1px solid rgba(255,107,53,0.25); }
  .desc { font-size: 14px; line-height: 1.9; white-space: pre-line; color: #d0d0e8; }
  .cta-box { background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.15); border-radius: 14px; padding: 14px 18px; }
  .cta-label { font-size: 11px; color: #ffd700; font-weight: 700; margin-bottom: 6px; }
  .faq-q { font-size: 13px; font-weight: 800; color: #ff6b35; margin-bottom: 5px; }
  .faq-a { font-size: 13px; line-height: 1.7; color: #b0b0cc; margin-bottom: 12px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 12px; color: #44446a; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">⚡</div>
    <div><div class="logo-text">STORE AUTO</div><div class="logo-sub">AI 상품 상세페이지</div></div>
  </div>
  <div class="cat">${data.category || '상품'}</div>
  <h1>${data.product_name}</h1>
  ${r.oneLiner ? `<div class="oneliner"><div class="label">✦ 핵심 카피</div><div class="text">${r.oneLiner}</div></div>` : ''}
  ${r.keywords?.length ? `<div class="sec"><div class="sec-label">🔍 SEO 키워드</div><div class="keywords">${r.keywords.map(k => `<span class="kw">${k}</span>`).join('')}</div></div>` : ''}
  ${r.description ? `<div class="sec"><div class="sec-label">📝 상세 설명</div><div class="card"><div class="desc">${r.description}</div></div></div>` : ''}
  ${r.recommendation ? `<div class="sec"><div class="sec-label">👥 추천 고객</div><div class="card"><div class="desc">${r.recommendation}</div></div></div>` : ''}
  ${r.cta ? `<div class="sec"><div class="cta-box"><div class="cta-label">🛒 구매 유도</div><div class="desc">${r.cta}</div></div></div>` : ''}
  ${r.faq?.length ? `<div class="sec"><div class="sec-label">❓ 자주 묻는 질문</div><div class="card">${r.faq.map(f => `<div class="faq-q">Q. ${f.q}</div><div class="faq-a">A. ${f.a}</div>`).join('')}</div></div>` : ''}
  <div class="footer">STORE AUTO로 생성된 상세페이지 · ${new Date(data.created_at).toLocaleDateString('ko-KR')}</div>
</div>
</body>
</html>`
              const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${data.product_name}_상세페이지.html`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: 'linear-gradient(135deg,#ff6b35,#ffd700)',
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 15,
              fontWeight: 900, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
              boxShadow: '0 4px 20px rgba(255,107,53,0.4)',
            }}
          >
            ⬇️ HTML 파일 다운로드
          </button>
          <div style={{ marginTop: 10, fontSize: 11, color: '#44446a' }}>
            다운받은 파일을 스마트스토어 · 쿠팡 상세설명 HTML에 붙여넣기 하세요
          </div>
        </div>

        {/* 하단 */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: 12, color: '#44446a' }}>
          STORE AUTO로 생성된 상세페이지 · {new Date(data.created_at).toLocaleDateString('ko-KR')}
        </div>
      </div>
    </div>
  )
}
