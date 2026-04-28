'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, checkSession, signOut } from '@/lib/auth'

type Theme = 'dark' | 'light' | 'yellow'
const THEMES = {
  dark:   { bg: '#050510', surface: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#f0f0ff', muted: '#44446a', card: 'rgba(255,255,255,0.03)' },
  light:  { bg: '#f0f2ff', surface: 'rgba(255,255,255,0.9)',  border: 'rgba(0,0,0,0.08)',       text: '#1a1a2e', muted: '#9999bb', card: 'rgba(255,255,255,0.95)' },
  yellow: { bg: '#0a0900', surface: 'rgba(255,215,0,0.06)',   border: 'rgba(255,215,0,0.15)',    text: '#fff8dc', muted: '#aa9900', card: 'rgba(255,215,0,0.04)' },
}
const ACCENT = '#ff6b35'

interface UsageStat { type: string; created_at: string }

export default function DashboardPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ name: string; business_name: string; business_type: string; region: string; grade: string } | null>(null)
  const [stats, setStats] = useState<UsageStat[]>([])
  const [loading, setLoading] = useState(true)

  const T = THEMES[theme]

  useEffect(() => {
    try {
      const t = localStorage.getItem('storeauto_theme') as Theme
      if (t && THEMES[t]) setTheme(t)
    } catch {}

    checkSession().then(async sess => {
      if (!sess) { router.push('/login'); return }
      setUser({ id: sess.id, email: sess.email })

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${sess.access_token}` }

      const [pRes, sRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${sess.id}&select=name,business_name,business_type,region,grade`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/usage_stats?user_id=eq.${sess.id}&order=created_at.desc&limit=100`, { headers }),
      ])
      const [pData, sData] = await Promise.all([pRes.json(), sRes.json()])
      if (Array.isArray(pData) && pData[0]) setProfile(pData[0])
      if (Array.isArray(sData)) setStats(sData)
      setLoading(false)
    }).catch(() => { router.push('/login') })
  }, [router])

  const saveTheme = (t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('storeauto_theme', t) } catch {}
  }

  const thisMonth = stats.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length
  const byType = stats.reduce((acc: Record<string, number>, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc }, {})

  const FEATURES = [
    { icon: '📄', label: '상세페이지 제작', desc: '10초만에 AI가 작성', path: '/', color: '#ff6b35', badge: '핵심' },
    { icon: '💬', label: '리뷰 자동답글', desc: '대량처리 · 여러버전', path: '/reviews', color: '#10b981', badge: null },
    { icon: '🏛️', label: '정부지원 AI상담', desc: '사업계획서 · 지원금', path: '/government', color: '#3b82f6', badge: null },
    { icon: '👤', label: '마이페이지', desc: '프로필 · 통계 · 키관리', path: '/mypage', color: '#8b5cf6', badge: null },
  ]

  const TYPE_INFO: Record<string, { label: string; color: string; emoji: string }> = {
    detail_page: { label: '상세페이지', color: '#ff6b35', emoji: '📄' },
    review:      { label: '리뷰답글',  color: '#10b981', emoji: '💬' },
    government:  { label: '정부지원',  color: '#3b82f6', emoji: '🏛️' },
  }

  const gradeColor = profile?.grade === 'pro' ? '#ffd700' : profile?.grade === 'vip' ? '#f472b6' : '#555'
  const gradeLabel = profile?.grade === 'pro' ? 'PRO' : profile?.grade === 'vip' ? 'VIP' : 'FREE'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div style={{ fontSize: 14, color: T.muted }}>불러오는 중...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Noto Sans KR',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{opacity:0.2} 50%{opacity:0.5} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        * { box-sizing: border-box; }
        .feat-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important; }
      `}</style>

      {/* 헤더 */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(30px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${ACCENT},#ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 0 16px ${ACCENT}44`, animation: 'bounce 2.5s ease-in-out infinite' }}>⚡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>STORE AUTO</div>
            <div style={{ fontSize: 11, color: T.muted }}>대시보드</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(['dark','light','yellow'] as Theme[]).map(t => (
            <button key={t} onClick={() => saveTheme(t)} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${theme===t?ACCENT:'transparent'}`, cursor: 'pointer', fontSize: 14, background: t==='dark'?'#1a1a2e':t==='light'?'#e8eaff':'#1a1600' }}>
              {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
            </button>
          ))}
          <button onClick={async () => { const sess = loadSession(); if (sess) await signOut(sess.access_token); router.push('/login') }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>로그아웃</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px,4vw,40px) 20px', animation: 'fadeUp 0.4s ease' }}>

        {/* 환영 + 프로필 */}
        <div style={{ background: `linear-gradient(135deg, ${ACCENT}15, rgba(139,92,246,0.08))`, border: `1px solid ${ACCENT}25`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 24px ${ACCENT}44`, flexShrink: 0 }}>
            {profile?.name ? profile.name[0] : '😊'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(16px,3vw,20px)', fontWeight: 900, marginBottom: 4 }}>
              안녕하세요, {profile?.name || user?.email?.split('@')[0]}님! 👋
            </div>
            <div style={{ fontSize: 13, color: T.muted, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {profile?.business_name && <span>🏪 {profile.business_name}</span>}
              {profile?.business_type && <span>· {profile.business_type}</span>}
              {profile?.region && <span>· 📍 {profile.region}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: `${gradeColor}22`, color: gradeColor, fontWeight: 800, border: `1px solid ${gradeColor}44` }}>{gradeLabel}</span>
            <button onClick={() => router.push('/mypage')} style={{ padding: '8px 16px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>프로필 수정</button>
          </div>
        </div>

        {/* 이번달 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: '이번달 사용', value: thisMonth, emoji: '🔥', color: ACCENT },
            { label: '상세페이지', value: byType['detail_page'] || 0, emoji: '📄', color: '#ff6b35' },
            { label: '리뷰 답글',  value: byType['review'] || 0,      emoji: '💬', color: '#10b981' },
            { label: '정부지원',   value: byType['government'] || 0,   emoji: '🏛️', color: '#3b82f6' },
          ].map((s, i) => (
            <div key={i} style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 16, padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 기능 바로가기 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 14, color: T.text }}>🚀 바로 시작하기</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => router.push(f.path)} className="feat-card" style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 16, padding: '20px 18px', textAlign: 'left',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
                position: 'relative' as const,
              }}>
                {f.badge && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${f.color}22`, color: f.color, fontWeight: 800 }}>{f.badge}</span>}
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 최근 사용 */}
        {stats.length > 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 14 }}>📋 최근 사용 기록</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {stats.slice(0, 8).map((s, i) => {
                const info = TYPE_INFO[s.type] || { label: s.type, color: '#888', emoji: '📌' }
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < Math.min(stats.length, 8) - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{info.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: info.color }}>{info.label}</span>
                    <span style={{ fontSize: 11, color: T.muted }}>{new Date(s.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {stats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>✨</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>아직 사용 기록이 없어요</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>위 기능을 사용해보세요!</div>
            <button onClick={() => router.push('/')} style={{ padding: '10px 24px', background: `linear-gradient(135deg,${ACCENT},#ff8c5a)`, border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              상세페이지 만들어보기 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

