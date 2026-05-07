'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, checkSession, signOut } from '@/lib/auth'

type Theme = 'dark' | 'light' | 'yellow'

const THEMES = {
  dark:   { bg: '#050510', surface: '#0d0d1a', border: 'rgba(255,255,255,0.08)', text: '#f0f0ff', muted: '#44446a', s2: 'rgba(255,255,255,0.03)' },
  light:  { bg: '#f0f2ff', surface: '#ffffff',  border: 'rgba(0,0,0,0.08)',       text: '#1a1a2e', muted: '#9999bb', s2: 'rgba(0,0,0,0.02)' },
  yellow: { bg: '#0a0900', surface: '#111000',  border: 'rgba(255,215,0,0.12)',    text: '#fff8dc', muted: '#aa9900', s2: 'rgba(255,215,0,0.03)' },
}

const ACCENT = '#ff6b35'

interface UsageStat { type: string; created_at: string }

const FEATURES = [
  { icon: '📄', label: '상세페이지',  sub: '10초만에 AI 자동작성', path: '/',           color: '#ff6b35', bg: 'rgba(255,107,53,0.12)',  badge: '핵심' },
  { icon: '💬', label: '리뷰 답글',   sub: '대량처리 · 여러버전',   path: '/reviews',   color: '#10b981', bg: 'rgba(16,185,129,0.12)', badge: null },
  { icon: '🏛️', label: '정부지원',    sub: '지원금 · 사업계획서',   path: '/government',color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', badge: null },
  { icon: '👤', label: '마이페이지',  sub: '프로필 · 통계 · API키', path: '/mypage',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', badge: null },
]

const ONBOARD_STEPS = [
  { icon: '🔑', title: 'AI 키 등록하기', desc: '마이페이지 → API 키 탭에서 Gemini(무료) 또는 Groq(무료) 키를 입력하세요. 키가 있어야 AI 기능을 쓸 수 있어요.', btn: '마이페이지로 가기', path: '/mypage?tab=keys' },
  { icon: '📄', title: '상세페이지 만들기', desc: '상품명과 특징을 입력하면 AI가 10초 만에 키워드·카피·FAQ까지 완성된 상세페이지를 만들어줘요.', btn: '상세페이지 만들러 가기', path: '/' },
  { icon: '💬', title: '리뷰 답글 달기', desc: '고객 리뷰를 붙여넣으면 AI가 톤에 맞는 답글을 생성해요. 여러 개를 한 번에 처리하는 대량처리도 지원해요.', btn: '리뷰 답글 써보기', path: '/reviews' },
  { icon: '🏛️', title: '정부 지원금 찾기', desc: '업종·지역·직원수만 입력하면 나에게 맞는 지원금을 추천해줘요. 신청 서류 체크리스트와 사업계획서 초안도 자동 생성돼요.', btn: '지원금 찾아보기', path: '/government' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [theme, setTheme]     = useState<Theme>('dark')
  const [user, setUser]       = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ name: string; business_name: string; business_type: string; region: string; grade: string } | null>(null)
  const [stats, setStats]     = useState<UsageStat[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboard, setShowOnboard] = useState(false)
  const [onboardStep, setOnboardStep] = useState(0)

  const T = THEMES[theme]

  useEffect(() => {
    try {
      const t = localStorage.getItem('storeauto_theme') as Theme
      if (t && THEMES[t]) setTheme(t)
    } catch { /* ignore */ }

    try {
      const visited = localStorage.getItem('storeauto_onboarded')
      if (!visited) setShowOnboard(true)
    } catch { /* ignore */ }

    const local = loadSession()
    if (!local) { router.push('/login'); return }

    setUser({ id: local.id, email: local.email })

    const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const headers = { apikey: SKEY, Authorization: `Bearer ${local.access_token}` }

    Promise.all([
      fetch(`${SURL}/rest/v1/profiles?id=eq.${local.id}&select=name,business_name,business_type,region,grade`, { headers }),
      fetch(`${SURL}/rest/v1/usage_stats?user_id=eq.${local.id}&order=created_at.desc&limit=100`, { headers }),
    ])
      .then(([pRes, sRes]) => Promise.all([pRes.json(), sRes.json()]))
      .then(([pData, sData]) => {
        if (Array.isArray(pData) && pData[0]) setProfile(pData[0])
        if (Array.isArray(sData)) setStats(sData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    checkSession().then(v => { if (!v) router.push('/login') }).catch(() => {})
  }, [router])

  const saveTheme = (t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('storeauto_theme', t) } catch { /* ignore */ }
  }

  const handleLogout = async () => {
    try { const s = loadSession(); if (s) await signOut(s.access_token) } catch { /* ignore */ }
    router.push('/login')
  }

  const closeOnboard = () => {
    try { localStorage.setItem('storeauto_onboarded', '1') } catch {}
    setShowOnboard(false)
  }

  const thisMonth = stats.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length
  const byType    = stats.reduce((acc: Record<string,number>, s) => { acc[s.type] = (acc[s.type]||0)+1; return acc }, {})
  const total     = stats.length

  const gradeColor = profile?.grade === 'pro' ? '#ffd700' : profile?.grade === 'vip' ? '#f472b6' : T.muted
  const gradeLabel = profile?.grade === 'pro' ? 'PRO'     : profile?.grade === 'vip' ? 'VIP'     : 'FREE'

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    return { label: ['일','월','화','수','목','금','토'][d.getDay()], count: stats.filter(s => s.created_at.startsWith(key)).length, isToday: i === 6 }
  })
  const maxDay = Math.max(...last7.map(d => d.count), 1)

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Noto Sans KR',sans-serif" }}>
      <div style={{ textAlign:'center', color:T.muted }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚡</div>
        <div style={{ fontSize:14 }}>불러오는 중...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Noto Sans KR',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .dash-anim { animation: fadeUp 0.3s ease; }
        .feat { transition: transform 0.2s, box-shadow 0.2s !important; }
        .feat:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.25) !important; }
        .nbtn { transition: opacity 0.15s !important; } .nbtn:hover { opacity: 0.75 !important; }
        @media(max-width:640px){
          .stat-grid  { grid-template-columns:1fr 1fr !important; gap:10px !important; }
          .feat-grid  { grid-template-columns:1fr 1fr !important; gap:10px !important; }
          .main-grid  { grid-template-columns:1fr !important; }
          .prof-inner { flex-direction:column !important; align-items:flex-start !important; }
          .grade-btn  { width:100% !important; justify-content:space-between !important; }
          .hide-mo    { display:none !important; }
          .pad-main   { padding:14px 12px 90px !important; }
          #mob-bar    { display:flex !important; }
        }
      `}</style>

      {/* ── 온보딩 모달 ── */}
      {showOnboard && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:theme === 'dark' ? '#0d0d1a' : T.bg, border:`1px solid ${T.border}`, borderRadius:'24px', padding:'32px 28px', maxWidth:440, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>
            {/* 진행 바 */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'24px' }}>
              {ONBOARD_STEPS.map((_, i) => (
                <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i <= onboardStep ? ACCENT : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
              ))}
            </div>

            <div style={{ fontSize:40, marginBottom:12 }}>{ONBOARD_STEPS[onboardStep].icon}</div>
            <div style={{ fontSize:20, fontWeight:900, marginBottom:10, color:T.text }}>{ONBOARD_STEPS[onboardStep].title}</div>
            <div style={{ fontSize:14, color:T.muted, lineHeight:1.9, marginBottom:28 }}>{ONBOARD_STEPS[onboardStep].desc}</div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {/* 해당 기능으로 이동 */}
              <button onClick={() => { closeOnboard(); router.push(ONBOARD_STEPS[onboardStep].path) }}
                style={{ padding:'14px', background:`linear-gradient(135deg,${ACCENT},#ff8c42)`, border:'none', borderRadius:'14px', color:'white', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>
                {ONBOARD_STEPS[onboardStep].btn}
              </button>
              {/* 이전/다음 */}
              <div style={{ display:'flex', gap:10 }}>
                {onboardStep > 0 && (
                  <button onClick={() => setOnboardStep(s => s - 1)}
                    style={{ flex:1, padding:'12px', background:'none', border:`1px solid ${T.border}`, borderRadius:'12px', color:T.muted, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>← 이전</button>
                )}
                {onboardStep < ONBOARD_STEPS.length - 1 ? (
                  <button onClick={() => setOnboardStep(s => s + 1)}
                    style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.06)', border:`1px solid ${T.border}`, borderRadius:'12px', color:T.text, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>다음 →</button>
                ) : (
                  <button onClick={closeOnboard}
                    style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.06)', border:`1px solid ${T.border}`, borderRadius:'12px', color:T.muted, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>닫기</button>
                )}
              </div>
              <button onClick={closeOnboard} style={{ background:'none', border:'none', color:T.muted, fontSize:12, cursor:'pointer', padding:'4px 0' }}>다시 보지 않기</button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── 헤더 ──────────── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, height:54, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(24px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${ACCENT},#ffd700)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, boxShadow:`0 0 12px ${ACCENT}44` }}>⚡</div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, lineHeight:1.1 }}>STORE AUTO</div>
            <div style={{ fontSize:10, color:T.muted }}>대시보드</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span className="hide-mo" style={{ fontSize:11, color:T.muted, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</span>
          {(['dark','light','yellow'] as Theme[]).map(t => (
            <button key={t} onClick={() => saveTheme(t)} style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${theme===t?ACCENT:'transparent'}`, cursor:'pointer', fontSize:11, background:t==='dark'?'#1a1a2e':t==='light'?'#e8eaff':'#1a1600', flexShrink:0 }}>
              {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
            </button>
          ))}
          <button className="nbtn" onClick={() => { try { localStorage.setItem('storeauto_onboarded','') } catch {} setOnboardStep(0); setShowOnboard(true) }} style={{ padding:'5px 10px', background:'rgba(255,107,53,0.1)', border:`1px solid rgba(255,107,53,0.3)`, color:ACCENT, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>❓ 가이드</button>
          <button className="nbtn" onClick={() => router.push('/')} style={{ padding:'5px 10px', background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, color:ACCENT, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>← 홈</button>
          <button className="nbtn" onClick={handleLogout} style={{ padding:'5px 10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>로그아웃</button>
        </div>
      </div>

      {/* ──────────── 본문 ──────────── */}
      <div className="dash-anim pad-main" style={{ padding:'18px 18px 80px', maxWidth:1080, margin:'0 auto' }}>

        {/* 프로필 배너 */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, padding:'18px 20px', marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:`${ACCENT}07`, pointerEvents:'none' }} />

          <div className="prof-inner" style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg,${ACCENT},#ffd700)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, flexShrink:0, boxShadow:`0 4px 18px ${ACCENT}44` }}>
              {profile?.name ? profile.name[0] : '😊'}
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'clamp(15px,4vw,19px)', fontWeight:900, marginBottom:5 }}>
                안녕하세요, {profile?.name || user?.email?.split('@')[0]}님! 👋
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:12, color:T.muted }}>
                {profile?.business_name && <span>🏪 {profile.business_name}</span>}
                {profile?.business_type && <span>· {profile.business_type}</span>}
                {profile?.region        && <span>· 📍 {profile.region}</span>}
                {!profile?.business_name && <span style={{ color:ACCENT }}>👆 프로필을 완성하면 맞춤 지원사업을 추천해드려요!</span>}
              </div>
            </div>

            <div className="grade-btn" style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:`${gradeColor}20`, color:gradeColor, fontWeight:800, border:`1px solid ${gradeColor}40` }}>{gradeLabel}</span>
              <button className="nbtn" onClick={() => router.push('/mypage')} style={{ padding:'8px 14px', background:T.s2, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>⚙️ 프로필 수정</button>
            </div>
          </div>
        </div>

        {/* 통계 카드 4개 */}
        <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
          {[
            { label:'전체 사용',  value:total,                    emoji:'⚡', color:ACCENT    },
            { label:'이번달',     value:thisMonth,                emoji:'🔥', color:'#f59e0b' },
            { label:'상세페이지', value:byType['detail_page']||0, emoji:'📄', color:'#8b5cf6' },
            { label:'리뷰 답글',  value:byType['review']||0,      emoji:'💬', color:'#10b981' },
          ].map((s,i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'14px 14px 12px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-8, right:-6, fontSize:44, opacity:0.07 }}>{s.emoji}</div>
              <div style={{ fontSize:10, color:T.muted, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              <div style={{ fontSize:'clamp(24px,5vw,32px)', fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ marginTop:10, height:3, borderRadius:3, background:`${s.color}18` }}>
                <div style={{ height:'100%', borderRadius:3, background:s.color, width:total>0?`${Math.min((s.value/Math.max(total,1))*400,100)}%`:'0%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* 기능 바로가기 + 차트 */}
        <div className="main-grid" style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:16 }}>

          <div>
            <div style={{ fontSize:13, fontWeight:900, marginBottom:12 }}>🚀 바로 시작하기</div>
            <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {FEATURES.map((f,i) => (
                <button key={i} className="feat" onClick={() => router.push(f.path)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'18px 16px', textAlign:'left', cursor:'pointer', fontFamily:'inherit', position:'relative', width:'100%' }}>
                  {f.badge && <span style={{ position:'absolute', top:10, right:10, fontSize:10, padding:'2px 8px', borderRadius:20, background:`${f.color}22`, color:f.color, fontWeight:800 }}>{f.badge}</span>}
                  <div style={{ width:42, height:42, borderRadius:12, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>{f.icon}</div>
                  <div style={{ fontSize:'clamp(13px,3vw,14px)', fontWeight:900, marginBottom:4 }}>{f.label}</div>
                  <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{f.sub}</div>
                </button>
              ))}
            </div>

            {total === 0 && (
              <div style={{ marginTop:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'24px 20px', textAlign:'center' }}>
                <div style={{ fontSize:36, opacity:0.2, marginBottom:10 }}>✨</div>
                <div style={{ fontSize:14, fontWeight:900, marginBottom:5 }}>아직 사용 기록이 없어요</div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>가이드를 따라 시작해보세요!</div>
                <button className="nbtn" onClick={() => { try { localStorage.setItem('storeauto_onboarded','') } catch {} setOnboardStep(0); setShowOnboard(true) }}
                  style={{ padding:'10px 22px', background:`linear-gradient(135deg,${ACCENT},#ffd700)`, border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:900, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 4px 14px ${ACCENT}44` }}>
                  시작 가이드 보기 →
                </button>
              </div>
            )}
          </div>

          {/* 7일 미니 차트 */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'18px 16px', display:'flex', flexDirection:'column' }}>
            <div style={{ fontSize:13, fontWeight:900, marginBottom:3 }}>최근 7일</div>
            <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>일별 AI 사용 횟수</div>

            {total === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:T.muted, padding:'20px 0' }}>
                <div style={{ fontSize:28, opacity:0.2, marginBottom:8 }}>📊</div>
                <div style={{ fontSize:11 }}>기록 없음</div>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:110, flex:1 }}>
                {last7.map((d,i) => {
                  const h = Math.max((d.count/maxDay)*90, d.count>0?6:2)
                  return (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:10, color:d.count>0?(d.isToday?ACCENT:T.text):'transparent', fontWeight:900 }}>{d.count}</div>
                      <div style={{ width:'100%', borderRadius:4, background:d.isToday?`linear-gradient(180deg,${ACCENT},#ffd700)`:d.count>0?'#3b82f6':T.border, height:h, boxShadow:d.isToday&&d.count>0?`0 3px 10px ${ACCENT}55`:'none' }} />
                      <div style={{ fontSize:10, color:d.isToday?ACCENT:T.muted, fontWeight:d.isToday?900:700 }}>{d.label}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
              <button className="nbtn" onClick={() => router.push('/mypage?tab=stats')} style={{ width:'100%', padding:'9px', background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`, borderRadius:10, color:ACCENT, fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                📊 상세 통계 →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 하단 탭바 */}
      <div id="mob-bar" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, zIndex:200, background:T.surface, borderTop:`1px solid ${T.border}`, backdropFilter:'blur(24px)', paddingBottom:'env(safe-area-inset-bottom)' }}>
        <div style={{ display:'flex', width:'100%', padding:'10px 0 8px' }}>
          {[
            { icon:'👤', label:'프로필',   path:'/mypage?tab=profile', color:'#ff6b35', active:true  },
            { icon:'📊', label:'통계',     path:'/mypage?tab=stats',   color:'#3b82f6', active:false },
            { icon:'📋', label:'히스토리', path:'/mypage?tab=history', color:'#10b981', active:false },
            { icon:'📝', label:'작업일지', path:'/mypage?tab=worklog', color:'#f59e0b', active:false },
            { icon:'🔑', label:'API 키',   path:'/mypage?tab=keys',    color:'#8b5cf6', active:false },
          ].map(t => (
            <button key={t.path} onClick={() => router.push(t.path)} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, flex:1, background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:800, color:t.active?t.color:T.muted, padding:'0' }}>
              <span style={{ fontSize:22, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}>{t.icon}</span>
              <span style={{ whiteSpace:'nowrap', display:'block', textAlign:'center', width:'100%' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
