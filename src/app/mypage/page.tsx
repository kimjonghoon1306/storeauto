'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Theme = 'dark' | 'light' | 'yellow'
type Tab = 'profile' | 'stats' | 'history' | 'worklog' | 'keys'

const THEMES = {
  dark:   { bg: '#050510', surface: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#f0f0ff', muted: '#44446a', s2: 'rgba(255,255,255,0.02)', card: 'rgba(255,255,255,0.03)' },
  light:  { bg: '#f0f2ff', surface: 'rgba(255,255,255,0.9)',  border: 'rgba(0,0,0,0.08)',       text: '#1a1a2e', muted: '#9999bb', s2: 'rgba(255,255,255,0.7)', card: 'rgba(255,255,255,0.95)' },
  yellow: { bg: '#0a0900', surface: 'rgba(255,215,0,0.06)',   border: 'rgba(255,215,0,0.15)',    text: '#fff8dc', muted: '#aa9900', s2: 'rgba(255,215,0,0.03)', card: 'rgba(255,215,0,0.04)' },
}

const TABS: { key: Tab; icon: string; label: string; color: string }[] = [
  { key: 'profile', icon: '👤', label: '프로필',   color: '#ff6b35' },
  { key: 'stats',   icon: '📊', label: '통계',     color: '#3b82f6' },
  { key: 'history', icon: '📋', label: '히스토리', color: '#10b981' },
  { key: 'worklog', icon: '📝', label: '작업일지', color: '#f59e0b' },
  { key: 'keys',    icon: '🔑', label: 'API 키',   color: '#8b5cf6' },
]

const BIZ_TYPES = ['음식점/카페','소매업/편의점','온라인 쇼핑몰','제조업','서비스업','뷰티/미용','학원/교육','의류/패션','농업/축산','기타']
const REGIONS   = ['서울','부산','인천','대구','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
const ACCENT    = '#ff6b35'

const TYPE_INFO: Record<string, { label: string; color: string; emoji: string; desc: string }> = {
  detail_page: { label: '상세페이지', color: '#ff6b35', emoji: '📄', desc: '상품 상세페이지 생성' },
  review:      { label: '리뷰답글',   color: '#10b981', emoji: '💬', desc: '고객 리뷰 답변 생성' },
  government:  { label: '정부지원',   color: '#3b82f6', emoji: '🏛️', desc: '정부지원 사업 조회' },
}

function MyPageInner() {
  const router = useRouter()
  const [theme, setTheme]         = useState<Theme>('dark')
  const searchParams = useSearchParams()
  const [tab, setTab]             = useState<Tab>((searchParams.get('tab') as Tab) || 'profile')
  const [uid, setUid]             = useState('')
  const [tok, setTok]             = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [prof, setProf]           = useState({ name: '', business_name: '', phone: '', business_type: '', region: '' })
  const [stats, setStats]         = useState<{ type: string; created_at: string }[]>([])
  const [logs, setLogs]           = useState<{ id: string; title: string; content: string; category: string; created_at: string }[]>([])
  const [results, setResults]     = useState<{ id: string; product_name: string; category: string; provider: string; result: Record<string,unknown>; created_at: string }[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const [keys, setKeys]           = useState({ gemini: '', openai: '', groq: '' })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [wSaving, setWSaving]     = useState(false)
  const [wTitle, setWTitle]       = useState('')
  const [wContent, setWContent]   = useState('')
  const [wCat, setWCat]           = useState('일반')
  const [toast, setToast]         = useState('')

  const T = THEMES[theme]

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const saveTheme = (t: Theme) => { setTheme(t); try { localStorage.setItem('storeauto_theme', t) } catch (_e) { /* ignore */ } }

  const loadData = useCallback(async (id: string, token: string) => {
    const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const headers = { apikey: SKEY, Authorization: `Bearer ${token}` }
    try {
      const [pRes, uRes, wRes, rRes, kRes] = await Promise.all([
        fetch(`${SURL}/rest/v1/profiles?id=eq.${id}&select=*&limit=1`, { headers }),
        fetch(`${SURL}/rest/v1/usage_stats?user_id=eq.${id}&order=created_at.desc&limit=100`, { headers }),
        fetch(`${SURL}/rest/v1/work_logs?user_id=eq.${id}&order=created_at.desc&limit=50`, { headers }),
        fetch(`${SURL}/rest/v1/generated_results?user_id=eq.${id}&order=created_at.desc&limit=100`, { headers }),
        fetch(`${SURL}/rest/v1/user_keys?user_id=eq.${id}&select=gemini_key,openai_key,groq_key&limit=1`, { headers }),
      ])
      const [pData, uData, wData, rData, kData] = await Promise.all([pRes.json(), uRes.json(), wRes.json(), rRes.json(), kRes.json()])
      if (Array.isArray(pData) && pData[0]) {
        const p = pData[0]
        setProf({ name: p.name||'', business_name: p.business_name||'', phone: p.phone||'', business_type: p.business_type||'', region: p.region||'' })
      }
      if (Array.isArray(uData)) setStats(uData)
      if (Array.isArray(wData)) setLogs(wData)
      if (Array.isArray(rData)) setResults(rData)
      if (Array.isArray(kData) && kData[0]) {
        const k = kData[0] as { gemini_key?: string; openai_key?: string; groq_key?: string }
        setKeys({ gemini: k.gemini_key||'', openai: k.openai_key||'', groq: k.groq_key||'' })
      }
    } catch (_e) { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    try { const t = localStorage.getItem('storeauto_theme') as Theme; if (t && THEMES[t]) setTheme(t) } catch (_e) { /* ignore */ }
    try {
      const raw = localStorage.getItem('sa_session')
      if (!raw) { router.replace('/login'); return }
      const sess = JSON.parse(raw)
      if (!sess?.id || !sess?.access_token) { router.replace('/login'); return }
      setUid(sess.id); setTok(sess.access_token); setUserEmail(sess.email || '')
      // 키는 loadData에서 Supabase로 불러옴
      loadData(sess.id, sess.access_token)
    } catch (_e) { router.replace('/login') }
  }, [router, loadData])

  const saveProfile = async () => {
    if (!uid || !tok) return
    setSaving(true)
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      await fetch(`${SURL}/rest/v1/profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${tok}`, Prefer: 'return=minimal,resolution=merge-duplicates' }, body: JSON.stringify({ id: uid, email: userEmail, ...prof }) })
      showToast('✅ 프로필 저장 완료!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setSaving(false)
  }

  const saveKeys = async () => {
    if (!uid || !tok) return
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      await fetch(`${SURL}/rest/v1/user_keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${tok}`, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: uid, gemini_key: keys.gemini, openai_key: keys.openai, groq_key: keys.groq }),
      })
      showToast('✅ API 키 저장! 모든 기기에서 사용 가능해요')
    } catch (_e) { showToast('❌ 저장 실패') }
  }

  const logout = async () => {
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL||''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
      await fetch(`${SURL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SKEY, Authorization: `Bearer ${tok}` } })
    } catch (_e) { /* ignore */ }
    try { localStorage.removeItem('sa_session') } catch (_e) { /* ignore */ }
    router.push('/login')
  }

  const addWorkLog = async () => {
    if (!wTitle.trim() || !uid || !tok) return
    setWSaving(true)
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL||''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
      const res = await fetch(`${SURL}/rest/v1/work_logs`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${tok}`, Prefer: 'return=representation' }, body: JSON.stringify({ user_id: uid, title: wTitle, content: wContent, category: wCat }) })
      const data = await res.json()
      if (Array.isArray(data) && data[0]) setLogs(prev => [data[0], ...prev])
      setWTitle(''); setWContent(''); showToast('✅ 작업일지 저장!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setWSaving(false)
  }

  const deleteWorkLog = async (id: string) => {
    if (!tok) return
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL||''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
      await fetch(`${SURL}/rest/v1/work_logs?id=eq.${id}`, { method: 'DELETE', headers: { apikey: SKEY, Authorization: `Bearer ${tok}` } })
      setLogs(prev => prev.filter(w => w.id !== id))
    } catch (_e) { /* ignore */ }
  }

  const thisMonth = stats.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length
  const byType = stats.reduce((acc: Record<string,number>, s) => { acc[s.type] = (acc[s.type]||0)+1; return acc }, {})
  const total = stats.length

  const groupedStats = stats.slice(0, 50).reduce((acc: Record<string, typeof stats>, s) => {
    const d = new Date(s.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    if (!acc[d]) acc[d] = []
    acc[d].push(s)
    return acc
  }, {})

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const count = stats.filter(s => s.created_at.startsWith(key)).length
    return { label: ['일','월','화','수','목','금','토'][d.getDay()], count, isToday: i === 6 }
  })
  const maxDay = Math.max(...last7.map(d => d.count), 1)

  const inputSt: React.CSSProperties = {
    width: '100%', background: T.s2, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '11px 14px', color: T.text,
    fontSize: 14, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", transition: 'border-color 0.2s',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ textAlign: 'center', color: T.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
        <div style={{ fontSize: 14 }}>불러오는 중...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${T.muted}; }
        select option { background: #1a1a2e; color: #f0f0ff; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes toastIn { from { opacity:0; transform:translateX(60px) } to { opacity:1; transform:translateX(0) } }
        .tab-content { animation: fadeUp 0.25s ease; }
        .hov:hover { background: ${T.surface} !important; }
        .navbtn { transition: all 0.18s !important; }
        .navbtn:hover { background: ${T.surface} !important; }
        @media(max-width: 640px) {
          .pc-sidebar { display: none !important; }
          #mobile-tab { display: flex !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .four-col { grid-template-columns: 1fr 1fr !important; }
          .three-col { grid-template-columns: 1fr 1fr !important; }
          .worklog-split { flex-direction: column !important; }
          .worklog-form { width: 100% !important; position: static !important; }
          .key-grid { grid-template-columns: 1fr !important; }
          .profile-preview { display: none !important; }
          .hide-sm { display: none !important; }
        }
      `}</style>

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: toast.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, color: toast.startsWith('✅') ? '#34d399' : '#f87171', animation: 'toastIn 0.3s ease', backdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(30px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="navbtn" onClick={() => router.push('/dashboard')} style={{ background: T.s2, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 700 }}>← 대시보드</button>
          <span style={{ fontSize: 15, fontWeight: 900 }}>마이페이지</span>
          <span className="hide-sm" style={{ fontSize: 11, color: T.muted }}>{userEmail}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(['dark','light','yellow'] as Theme[]).map(t => (
            <button key={t} onClick={() => saveTheme(t)} style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${theme===t ? ACCENT : 'transparent'}`, cursor: 'pointer', fontSize: 12, background: t==='dark'?'#1a1a2e':t==='light'?'#e8eaff':'#1a1600', transition: 'all 0.2s' }}>
              {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
            </button>
          ))}
          <button className="navbtn" onClick={logout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 700 }}>로그아웃</button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        {/* 사이드바 */}
        <div className="pc-sidebar" style={{ width: 210, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 12px', marginBottom: 14, textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, #ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 8px', fontWeight: 900, boxShadow: `0 4px 16px ${ACCENT}44` }}>
              {prof.name ? prof.name[0] : '😊'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>{prof.name || '이름 없음'}</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{prof.business_name || '상호명 미설정'}</div>
            <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${ACCENT}18`, color: ACCENT, fontWeight: 800, display: 'inline-block' }}>{prof.business_type || '업종 미설정'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}20`, borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: ACCENT }}>{total}</div>
              <div style={{ fontSize: 9, color: T.muted, fontWeight: 700 }}>전체</div>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{thisMonth}</div>
              <div style={{ fontSize: 9, color: T.muted, fontWeight: 700 }}>이번달</div>
            </div>
          </div>

          {TABS.map(t => (
            <button key={t.key} className="navbtn" onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, textAlign: 'left', width: '100%', transition: 'all 0.18s', background: tab===t.key ? `${t.color}18` : 'transparent', color: tab===t.key ? t.color : T.muted, borderLeft: tab===t.key ? `3px solid ${t.color}` : '3px solid transparent' }}>
              <span style={{ fontSize: 15 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* 메인 */}
        <div style={{ flex: 1, padding: 'clamp(16px, 2.5vw, 28px)', overflowY: 'auto', paddingBottom: 80, minWidth: 0 }}>

          {/* ── 프로필 ── */}
          {tab === 'profile' && (
            <div className="tab-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>프로필 수정</div>
                  <div style={{ fontSize: 11, color: T.muted }}>사업장 정보를 입력하면 맞춤 서비스를 받을 수 있어요</div>
                </div>
              </div>
              <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div className="three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      {([{ l: '이름', k: 'name', ph: '홍길동' }, { l: '상호명', k: 'business_name', ph: 'OO마트' }, { l: '연락처', k: 'phone', ph: '010-0000-0000' }] as const).map(f => (
                        <div key={f.k}>
                          <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>{f.l}</div>
                          <input value={prof[f.k]} onChange={e => setProf(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inputSt}
                            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>업종</div>
                        <select value={prof.business_type} onChange={e => setProf(p => ({ ...p, business_type: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
                          <option value="">선택하세요</option>
                          {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>지역</div>
                        <select value={prof.region} onChange={e => setProf(p => ({ ...p, region: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
                          <option value="">선택하세요</option>
                          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)', fontSize: 13, color: ACCENT, lineHeight: 1.7 }}>
                      💡 업종과 지역 설정 시 정부지원 챗봇에서 맞춤 지원사업을 추천해드려요!
                    </div>
                    <button onClick={saveProfile} disabled={saving} style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 900, color: 'white', background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${ACCENT}, #ffd700)`, opacity: saving ? 0.6 : 1, boxShadow: saving ? 'none' : `0 4px 20px ${ACCENT}44` }}>
                      {saving ? '저장 중...' : '💾 프로필 저장하기'}
                    </button>
                  </div>
                </div>

                {/* 오른쪽 미리보기 */}
                <div className="profile-preview">
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>미리보기</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, #ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, flexShrink: 0, boxShadow: `0 6px 24px ${ACCENT}44` }}>
                        {prof.name ? prof.name[0] : '😊'}
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 2 }}>{prof.name || '이름 없음'}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{prof.business_name || '상호명 미설정'}</div>
                      </div>
                    </div>
                    {[{ l: '📞 연락처', v: prof.phone||'미설정' }, { l: '🏪 업종', v: prof.business_type||'미설정' }, { l: '📍 지역', v: prof.region||'미설정' }].map(r => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: T.s2, borderRadius: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>{r.l}</span>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20 }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>계정</div>
                    <div style={{ fontSize: 13, padding: '10px 12px', background: T.s2, borderRadius: 10, wordBreak: 'break-all', fontWeight: 700, marginBottom: 10 }}>{userEmail || '-'}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, padding: '10px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 10 }}>⚠️ 이메일 변경은 고객센터 문의</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 통계 ── */}
          {tab === 'stats' && (
            <div className="tab-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>사용 통계</div>
                  <div style={{ fontSize: 11, color: T.muted }}>AI 기능 사용 현황을 확인하세요</div>
                </div>
              </div>

              <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { l: '전체 사용', v: total,                         e: '⚡', c: ACCENT    },
                  { l: '이번달',   v: thisMonth,                      e: '🔥', c: '#f59e0b' },
                  { l: '상세페이지', v: byType['detail_page']||0,     e: '📄', c: '#8b5cf6' },
                  { l: '리뷰답글', v: byType['review']||0,            e: '💬', c: '#10b981' },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 54, opacity: 0.06 }}>{s.e}</div>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>{s.l}</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: s.c, lineHeight: 1, marginBottom: 10 }}>{s.v}</div>
                    <div style={{ height: 3, borderRadius: 3, background: T.border }}>
                      <div style={{ height: '100%', borderRadius: 3, background: s.c, width: total > 0 ? `${Math.min((s.v/total)*400, 100)}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* 7일 바차트 */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 20 }}>최근 7일 사용량</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
                    {last7.map((d, i) => {
                      const h = Math.max((d.count / maxDay) * 120, d.count > 0 ? 8 : 3)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 11, color: d.count > 0 ? (d.isToday ? ACCENT : T.text) : 'transparent', fontWeight: 900 }}>{d.count}</div>
                          <div style={{ width: '100%', borderRadius: 6, background: d.isToday ? `linear-gradient(180deg, ${ACCENT}, #ffd700)` : d.count > 0 ? '#3b82f6' : T.border, height: h, boxShadow: d.isToday && d.count > 0 ? `0 4px 12px ${ACCENT}55` : 'none' }} />
                          <div style={{ fontSize: 11, color: d.isToday ? ACCENT : T.muted, fontWeight: d.isToday ? 900 : 700 }}>{d.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 기능별 비율 */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 20 }}>기능별 사용 비율</div>
                  {total === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: T.muted }}>
                      <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 8 }}>📊</div>
                      <div style={{ fontSize: 13 }}>아직 사용 기록이 없어요</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {Object.entries(TYPE_INFO).map(([type, info]) => {
                        const cnt = byType[type] || 0
                        const pct = total > 0 ? Math.round((cnt/total)*100) : 0
                        return (
                          <div key={type}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                              <span style={{ fontSize: 13, fontWeight: 800 }}>{info.emoji} {info.label}</span>
                              <span style={{ fontSize: 12, color: info.color, fontWeight: 900 }}>{cnt}회 ({pct}%)</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 8, background: T.s2 }}>
                              <div style={{ height: '100%', borderRadius: 8, background: info.color, width: `${pct}%`, boxShadow: `0 0 8px ${info.color}55` }} />
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ padding: '12px 14px', background: T.s2, borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>전체 사용</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: ACCENT }}>{total}회</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 히스토리 ── */}
          {tab === 'history' && (
            <div className="tab-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📋</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>생성 히스토리</div>
                    <div style={{ fontSize: 11, color: T.muted }}>생성한 상세페이지 결과물 — 클라우드 저장</div>
                  </div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 20, background: '#10b98118', color: '#10b981', fontSize: 12, fontWeight: 800 }}>{results.length}건</div>
              </div>

              {results.length === 0 ? (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '60px 20px', textAlign: 'center', color: T.muted }}>
                  <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>아직 생성 기록이 없어요</div>
                  <div style={{ fontSize: 13 }}>상세페이지를 생성하면 여기에 자동 저장됩니다</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {results.map((r) => {
                    const res = r.result as { keywords?: string[]; oneLiner?: string; description?: string; cta?: string; faq?: {q:string;a:string}[] }
                    const isExpanded = expandedResult === r.id
                    return (
                      <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden' }}>
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}
                          onClick={() => setExpandedResult(isExpanded ? null : r.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ACCENT}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📄</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product_name || '상품명 없음'}</div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {r.category && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: T.s2, color: T.muted, fontWeight: 700 }}>{r.category}</span>}
                                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${ACCENT}15`, color: ACCENT, fontWeight: 700 }}>{r.provider || 'AI'}</span>
                                <span style={{ fontSize: 10, color: T.muted }}>{new Date(r.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: 16, color: T.muted, marginLeft: 8 }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {/* 펼침 내용 */}
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {res.oneLiner && (
                              <div>
                                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>✦ 핵심 카피</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffd700', lineHeight: 1.6 }}>{res.oneLiner}</div>
                              </div>
                            )}
                            {res.keywords && res.keywords.length > 0 && (
                              <div>
                                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>🔍 SEO 키워드</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {res.keywords.map((k, i) => (
                                    <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: `${ACCENT}15`, color: ACCENT, fontWeight: 700 }}>{k}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {res.description && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>📝 상세 설명</div>
                                  <button onClick={() => { navigator.clipboard.writeText(res.description || ''); showToast('✅ 복사 완료!') }}
                                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: T.s2, border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>📋 복사</button>
                                </div>
                                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8, whiteSpace: 'pre-line', padding: '12px 14px', background: T.s2, borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>{res.description}</div>
                              </div>
                            )}
                            {res.cta && (
                              <div>
                                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>🛒 구매 유도 멘트</div>
                                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, padding: '10px 14px', background: T.s2, borderRadius: 10 }}>{res.cta}</div>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => { const t = [res.oneLiner, res.description, res.cta].filter(Boolean).join('\n\n'); navigator.clipboard.writeText(t); showToast('✅ 전체 복사!') }}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${ACCENT},#ffd700)`, color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>📋 전체 복사</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 작업일지 ── */}
          {tab === 'worklog' && (
            <div className="tab-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>작업일지</div>
                    <div style={{ fontSize: 11, color: T.muted }}>오늘의 작업을 기록하면 AI가 요약해드려요</div>
                  </div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 12, fontWeight: 800 }}>{logs.length}개</div>
              </div>

              <div className="worklog-split" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="worklog-form" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 20 }}>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', marginBottom: 18 }}>+ 새 작업일지</div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>카테고리</div>
                      <select value={wCat} onChange={e => setWCat(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                        {['일반','상품등록','마케팅','고객응대','정부지원','기타'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>작업 제목</div>
                      <input value={wTitle} onChange={e => setWTitle(e.target.value)} placeholder="오늘의 작업 제목..." style={inputSt}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#f59e0b' }}
                        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 6 }}>작업 내용</div>
                      <textarea value={wContent} onChange={e => setWContent(e.target.value)} placeholder="오늘 한 작업을 자유롭게 기록하세요..." rows={5} style={{ ...inputSt, resize: 'vertical' }}
                        onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#f59e0b' }}
                        onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = T.border }}
                      />
                    </div>
                    <button onClick={addWorkLog} disabled={wSaving || !wTitle.trim()} style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', cursor: (wSaving||!wTitle.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, color: 'white', background: (wSaving||!wTitle.trim()) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #f59e0b, #d97706)', opacity: (wSaving||!wTitle.trim()) ? 0.5 : 1, boxShadow: (!wSaving&&wTitle.trim()) ? '0 4px 16px rgba(245,158,11,0.3)' : 'none' }}>
                      {wSaving ? '저장 중...' : '📝 저장하기'}
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 이번달 자동 요약 */}
                  {logs.length > 0 && (() => {
                    const thisMonthLogs = logs.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth())
                    const cats = thisMonthLogs.reduce((acc: Record<string,number>, l) => { acc[l.category] = (acc[l.category]||0)+1; return acc }, {})
                    const topCat = Object.entries(cats).sort((a,b) => b[1]-a[1])[0]
                    return thisMonthLogs.length > 0 ? (
                      <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 16, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 32 }}>📊</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>이번달 작업 요약</div>
                          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
                            총 <span style={{ color: ACCENT, fontWeight: 800 }}>{thisMonthLogs.length}건</span> 기록
                            {topCat && <> · 가장 많은 분야: <span style={{ color: '#f59e0b', fontWeight: 800 }}>{topCat[0]} ({topCat[1]}건)</span></>}
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}

                  {logs.length === 0 ? (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '60px 20px', textAlign: 'center', color: T.muted }}>
                      <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }}>📝</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>첫 작업일지를 작성해보세요!</div>
                      <div style={{ fontSize: 13 }}>왼쪽 폼에서 오늘의 작업을 기록할 수 있어요</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {logs.map(w => (
                        <div key={w.id} className="hov" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: '16px 18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1, marginRight: 10 }}>
                              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 900, flexShrink: 0 }}>{w.category}</span>
                              <span style={{ fontSize: 15, fontWeight: 900 }}>{w.title}</span>
                            </div>
                            <button onClick={() => deleteWorkLog(w.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, flexShrink: 0, fontFamily: 'inherit' }}>🗑 삭제</button>
                          </div>
                          {w.content && <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.8, whiteSpace: 'pre-line', padding: '10px 14px', background: T.s2, borderRadius: 10, marginBottom: 8 }}>{w.content}</div>}
                          <div style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>🕐 {new Date(w.created_at).toLocaleString('ko-KR')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── API 키 ── */}
          {tab === 'keys' && (
            <div className="tab-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#8b5cf620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔑</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>API 키 관리</div>
                  <div style={{ fontSize: 11, color: T.muted }}>AI 모델별 API 키를 설정하세요</div>
                </div>
              </div>
              <div style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 13, color: '#a78bfa', lineHeight: 1.7, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <span>API 키는 <strong>이 기기에만 저장</strong>되며 서버로 전송되지 않습니다.</span>
              </div>

              <div className="key-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                {([
                  { l: 'Gemini API', k: 'gemini' as const, ph: 'AIza...', bc: '#10b981', badge: '무료', icon: '🟢', desc: 'Google의 무료 AI 모델. 상세페이지·리뷰 생성에 활용됩니다.', url: 'https://aistudio.google.com/apikey' },
                  { l: 'OpenAI API', k: 'openai' as const, ph: 'sk-...',  bc: '#ef4444', badge: '유료', icon: '⚫', desc: 'ChatGPT 모델. 고품질 콘텐츠 생성에 활용됩니다.', url: 'https://platform.openai.com/api-keys' },
                  { l: 'Groq API',   k: 'groq'   as const, ph: 'gsk_...', bc: '#00e5a0', badge: '무료', icon: '🔵', desc: '초고속 무료 AI. 빠른 응답이 필요한 작업에 사용됩니다.', url: 'https://console.groq.com/keys' },
                ]).map(f => (
                  <div key={f.k} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 26 }}>{f.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 3 }}>{f.l}</div>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${f.bc}22`, color: f.bc, fontWeight: 800 }}>{f.badge}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: T.s2, borderRadius: 10 }}>{f.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>API 키</div>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: f.bc, fontWeight: 800, textDecoration: 'none', padding: '3px 9px', borderRadius: 7, background: `${f.bc}15`, border: `1px solid ${f.bc}30` }}>🔗 발급받기</a>
                    </div>
                    <input type="password" value={keys[f.k]} onChange={e => setKeys(k => ({ ...k, [f.k]: e.target.value }))} placeholder={f.ph} style={inputSt}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = f.bc }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                    />
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700 }}>
                      {keys[f.k] ? <span style={{ color: '#10b981' }}>✓ 입력됨</span> : <span style={{ color: T.muted }}>미입력</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={saveKeys} style={{ padding: '13px 28px', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 900, color: 'white', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}>
                  💾 API 키 저장하기
                </button>
                <div style={{ fontSize: 12, color: T.muted }}>저장 후 바로 적용됩니다</div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 모바일 탭바 */}
      <div id="mobile-tab" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: T.surface, borderTop: `1px solid ${T.border}`, paddingBottom: 'env(safe-area-inset-bottom)', backdropFilter: 'blur(30px)', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 4px 10px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 10px', flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', color: tab===t.key ? t.color : T.muted, fontFamily: 'inherit', fontSize: 10, fontWeight: 800 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: tab===t.key ? `${t.color}18` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{t.icon}</div>
              <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR',sans-serif", color: '#44446a' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div><div style={{ fontSize: 14 }}>불러오는 중...</div></div>
      </div>
    }>
      <MyPageInner />
    </Suspense>
  )
}
