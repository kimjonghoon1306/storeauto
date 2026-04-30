'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'dark' | 'light' | 'yellow'
type Tab = 'profile' | 'stats' | 'history' | 'worklog' | 'keys'

const THEMES = {
  dark:   { bg: '#050510', surface: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#f0f0ff', muted: '#44446a', s2: 'rgba(255,255,255,0.02)' },
  light:  { bg: '#f0f2ff', surface: 'rgba(255,255,255,0.9)',  border: 'rgba(0,0,0,0.08)',       text: '#1a1a2e', muted: '#9999bb', s2: 'rgba(255,255,255,0.7)' },
  yellow: { bg: '#0a0900', surface: 'rgba(255,215,0,0.06)',   border: 'rgba(255,215,0,0.15)',    text: '#fff8dc', muted: '#aa9900', s2: 'rgba(255,215,0,0.03)' },
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

export default function MyPage() {
  const router = useRouter()
  const [theme, setTheme]       = useState<Theme>('dark')
  const [tab, setTab]           = useState<Tab>('profile')
  const [uid, setUid]           = useState('')
  const [tok, setTok]           = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [prof, setProf]         = useState({ name: '', business_name: '', phone: '', business_type: '', region: '' })
  const [stats, setStats]       = useState<{ type: string; created_at: string }[]>([])
  const [logs, setLogs]         = useState<{ id: string; title: string; content: string; category: string; created_at: string }[]>([])
  const [keys, setKeys]         = useState({ gemini: '', openai: '', groq: '' })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [wSaving, setWSaving]   = useState(false)
  const [wTitle, setWTitle]     = useState('')
  const [wContent, setWContent] = useState('')
  const [wCat, setWCat]         = useState('일반')
  const [toast, setToast]       = useState('')

  const T = THEMES[theme]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const saveTheme = (t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('storeauto_theme', t) } catch (_e) { /* ignore */ }
  }

  const loadData = useCallback(async (id: string, token: string) => {
    const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const headers = { apikey: SKEY, Authorization: `Bearer ${token}` }
    try {
      const [pRes, uRes, wRes] = await Promise.all([
        fetch(`${SURL}/rest/v1/profiles?id=eq.${id}&select=*&limit=1`, { headers }),
        fetch(`${SURL}/rest/v1/usage_stats?user_id=eq.${id}&order=created_at.desc&limit=100`, { headers }),
        fetch(`${SURL}/rest/v1/work_logs?user_id=eq.${id}&order=created_at.desc&limit=50`, { headers }),
      ])
      const [pData, uData, wData] = await Promise.all([pRes.json(), uRes.json(), wRes.json()])
      if (Array.isArray(pData) && pData[0]) {
        const p = pData[0]
        setProf({ name: p.name || '', business_name: p.business_name || '', phone: p.phone || '', business_type: p.business_type || '', region: p.region || '' })
      }
      if (Array.isArray(uData)) setStats(uData)
      if (Array.isArray(wData)) setLogs(wData)
    } catch (_e) { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    try { const t = localStorage.getItem('storeauto_theme') as Theme; if (t && THEMES[t]) setTheme(t) } catch (_e) { /* ignore */ }
    try {
      const raw = localStorage.getItem('sa_session')
      if (!raw) { router.replace('/login'); return }
      const sess = JSON.parse(raw)
      if (!sess || !sess.id || !sess.access_token) { router.replace('/login'); return }
      setUid(sess.id)
      setTok(sess.access_token)
      setUserEmail(sess.email || '')
      try {
        const k = JSON.parse(localStorage.getItem(`storeauto_keys_${sess.id}`) || '{}')
        setKeys({ gemini: k.gemini || '', openai: k.openai || '', groq: k.groq || '' })
      } catch (_e) { /* ignore */ }
      loadData(sess.id, sess.access_token)
    } catch (_e) {
      router.replace('/login')
    }
  }, [router, loadData])

  const saveProfile = async () => {
    if (!uid || !tok) return
    setSaving(true)
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      await fetch(`${SURL}/rest/v1/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${tok}`, Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify({ id: uid, email: userEmail, ...prof }),
      })
      showToast('✅ 프로필 저장 완료!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setSaving(false)
  }

  const saveKeys = () => {
    if (!uid) return
    try {
      localStorage.setItem(`storeauto_keys_${uid}`, JSON.stringify(keys))
      localStorage.removeItem('storeauto_keys')
      showToast('✅ API 키 저장!')
    } catch (_e) { showToast('❌ 저장 실패') }
  }

  const logout = async () => {
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      await fetch(`${SURL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SKEY, Authorization: `Bearer ${tok}` } })
    } catch (_e) { /* ignore */ }
    try { localStorage.removeItem('sa_session') } catch (_e) { /* ignore */ }
    router.push('/login')
  }

  const addWorkLog = async () => {
    if (!wTitle.trim() || !uid || !tok) return
    setWSaving(true)
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const res = await fetch(`${SURL}/rest/v1/work_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${tok}`, Prefer: 'return=representation' },
        body: JSON.stringify({ user_id: uid, title: wTitle, content: wContent, category: wCat }),
      })
      const data = await res.json()
      if (Array.isArray(data) && data[0]) setLogs(prev => [data[0], ...prev])
      setWTitle('')
      setWContent('')
      showToast('✅ 작업일지 저장!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setWSaving(false)
  }

  const deleteWorkLog = async (id: string) => {
    if (!tok) return
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      await fetch(`${SURL}/rest/v1/work_logs?id=eq.${id}`, { method: 'DELETE', headers: { apikey: SKEY, Authorization: `Bearer ${tok}` } })
      setLogs(prev => prev.filter(w => w.id !== id))
    } catch (_e) { /* ignore */ }
  }

  const thisMonth = stats.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length
  const byType = stats.reduce((acc: Record<string, number>, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc }, {})

  const TYPE_INFO: Record<string, { label: string; color: string; emoji: string }> = {
    detail_page: { label: '상세페이지', color: '#ff6b35', emoji: '📄' },
    review:      { label: '리뷰답글',   color: '#10b981', emoji: '💬' },
    government:  { label: '정부지원',   color: '#3b82f6', emoji: '🏛️' },
  }

  const inputSt: React.CSSProperties = {
    width: '100%', background: T.s2, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '11px 14px', color: T.text,
    fontSize: 14, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR', sans-serif", color: T.muted }}>
      불러오는 중...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${T.muted}; }
        select option { background: #1a1a2e; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes toastIn { from { opacity:0; transform:translateX(60px) } to { opacity:1; transform:translateX(0) } }
        @media(max-width: 640px) { .pc-sidebar { display: none !important; } #mobile-tab { display: block !important; } }
      `}</style>

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: toast.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.startsWith('✅') ? '#34d399' : '#f87171', animation: 'toastIn 0.3s ease', backdropFilter: 'blur(20px)' }}>
          {toast}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(30px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/')} style={{ background: T.s2, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 700 }}>
            ← 홈
          </button>
          <span style={{ fontSize: 15, fontWeight: 900 }}>마이페이지</span>
          <span style={{ fontSize: 11, color: T.muted }}>{userEmail}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(['dark', 'light', 'yellow'] as Theme[]).map(t => (
            <button key={t} onClick={() => saveTheme(t)} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${theme === t ? ACCENT : 'transparent'}`, cursor: 'pointer', fontSize: 13, background: t === 'dark' ? '#1a1a2e' : t === 'light' ? '#e8eaff' : '#1a1600' }}>
              {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '⭐'}
            </button>
          ))}
          <button onClick={logout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* 사이드바 */}
        <div className="pc-sidebar" style={{ width: 190, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 10, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, #ffd700)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 6px', fontWeight: 900 }}>
              {prof.name ? prof.name[0] : '😊'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{prof.name || '이름 없음'}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{prof.business_type || '업종 미설정'}</div>
          </div>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, textAlign: 'left', width: '100%', transition: 'all 0.2s', background: tab === t.key ? `${t.color}18` : 'transparent', color: tab === t.key ? t.color : T.muted, borderLeft: tab === t.key ? `3px solid ${t.color}` : '3px solid transparent' }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div style={{ flex: 1, padding: 'clamp(16px, 3vw, 28px)', overflowY: 'auto', paddingBottom: 80, animation: 'fadeIn 0.3s ease' }}>

          {/* 프로필 탭 */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>프로필 수정</div>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                {([{ l: '이름', k: 'name', ph: '홍길동' }, { l: '상호명', k: 'business_name', ph: 'OO마트' }, { l: '연락처', k: 'phone', ph: '010-0000-0000' }] as const).map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 7 }}>{f.l}</div>
                    <input value={prof[f.k]} onChange={e => setProf(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inputSt}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                    />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 7 }}>업종</div>
                    <select value={prof.business_type} onChange={e => setProf(p => ({ ...p, business_type: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
                      <option value="">선택</option>
                      {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 7 }}>지역</div>
                    <select value={prof.region} onChange={e => setProf(p => ({ ...p, region: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
                      <option value="">선택</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)', fontSize: 13, color: ACCENT, lineHeight: 1.7 }}>
                  💡 업종과 지역 설정 시 정부지원 챗봇에서 맞춤 지원사업을 추천해드려요!
                </div>
                <button onClick={saveProfile} disabled={saving} style={{ padding: '11px 24px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: 'white', background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${ACCENT}, #ffd700)`, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '저장 중...' : '💾 저장하기'}
                </button>
              </div>
            </div>
          )}

          {/* 통계 탭 */}
          {tab === 'stats' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>사용 통계</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { l: '이번달', v: thisMonth,                    e: '🔥', c: ACCENT    },
                  { l: '상세페이지', v: byType['detail_page'] || 0, e: '📄', c: '#8b5cf6' },
                  { l: '리뷰답글',  v: byType['review'] || 0,       e: '💬', c: '#10b981' },
                  { l: '정부지원',  v: byType['government'] || 0,   e: '🏛️', c: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{ background: `${s.c}10`, border: `1px solid ${s.c}25`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{s.e}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontWeight: 700 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {stats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>📊</div>
                  아직 사용 기록이 없어요
                </div>
              )}
            </div>
          )}

          {/* 히스토리 탭 */}
          {tab === 'history' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>사용 히스토리</div>
              </div>
              {stats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>📋</div>
                  아직 사용 기록이 없어요
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.slice(0, 50).map((s, i) => {
                    const info = TYPE_INFO[s.type] || { label: s.type, color: ACCENT, emoji: '📌' }
                    return (
                      <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{info.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: info.color }}>{info.label}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{new Date(s.created_at).toLocaleString('ko-KR')}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 작업일지 탭 */}
          {tab === 'worklog' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📝</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>작업일지</div>
              </div>

              {/* 새 일지 작성 */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', marginBottom: 12 }}>+ 새 작업일지</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <select value={wCat} onChange={e => setWCat(e.target.value)} style={{ ...inputSt, width: 'auto', cursor: 'pointer' }}>
                    {['일반', '상품등록', '마케팅', '고객응대', '정부지원', '기타'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={wTitle} onChange={e => setWTitle(e.target.value)} placeholder="작업 제목" style={{ ...inputSt, flex: 1, minWidth: 120 }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#f59e0b' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
                <textarea value={wContent} onChange={e => setWContent(e.target.value)} placeholder="작업 내용..." rows={3} style={{ ...inputSt, resize: 'vertical', marginBottom: 10 }} />
                <button onClick={addWorkLog} disabled={wSaving} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', cursor: wSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: 'white', background: wSaving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b, #d97706)', opacity: wSaving ? 0.6 : 1 }}>
                  {wSaving ? '저장 중...' : '📝 저장'}
                </button>
              </div>

              {/* 일지 목록 */}
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>📝</div>
                  첫 작업일지를 작성해보세요!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {logs.map(w => (
                    <div key={w.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 800, flexShrink: 0 }}>{w.category}</span>
                          <span style={{ fontSize: 14, fontWeight: 900 }}>{w.title}</span>
                        </div>
                        <button onClick={() => deleteWorkLog(w.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🗑</button>
                      </div>
                      {w.content && <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{w.content}</div>}
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{new Date(w.created_at).toLocaleString('ko-KR')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API 키 탭 */}
          {tab === 'keys' && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#8b5cf620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔑</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>API 키 관리</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 13, color: '#a78bfa', lineHeight: 1.7, marginBottom: 18 }}>
                🔒 API 키는 이 기기에만 저장됩니다. 서버로 전송되지 않아요.
              </div>
              {([
                { l: 'Gemini API 키', k: 'gemini' as const, ph: 'AIza...', bc: '#10b981', badge: '무료'   },
                { l: 'OpenAI API 키', k: 'openai' as const, ph: 'sk-...',  bc: '#ef4444', badge: '유료'   },
                { l: 'Groq API 키',   k: 'groq'   as const, ph: 'gsk_...', bc: '#00e5a0', badge: '무료'   },
              ]).map(f => (
                <div key={f.k} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>{f.l}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${f.bc}22`, color: f.bc, fontWeight: 700 }}>{f.badge}</span>
                  </div>
                  <input type="password" value={keys[f.k]} onChange={e => setKeys(k => ({ ...k, [f.k]: e.target.value }))} placeholder={f.ph} style={inputSt}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#8b5cf6' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
              ))}
              <button onClick={saveKeys} style={{ padding: '11px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                💾 저장하기
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 모바일 탭바 */}
      <div id="mobile-tab" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: T.surface, borderTop: `1px solid ${T.border}`, paddingBottom: 'env(safe-area-inset-bottom)', backdropFilter: 'blur(30px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 0' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 0', flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', color: tab === t.key ? t.color : T.muted, fontFamily: 'inherit', fontSize: 9, fontWeight: 800 }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
