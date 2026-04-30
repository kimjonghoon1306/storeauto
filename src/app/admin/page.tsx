'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseQuery } from '@/lib/supabase'

type Tab = 'keys' | 'popup' | 'gov' | 'password' | 'members'
type Theme = 'dark' | 'light' | 'yellow'

interface PopupItem {
  id?: string
  title: string
  content: string
  type: string
  active: boolean
  bg_color: string
  text_color: string
}

interface GovItem {
  id?: string
  region: string
  category: string
  title: string
  content: string
}

const ADMIN_PW_KEY = 'storeauto_admin_pw'
const DEFAULT_PW = 'admin1234'

const REGIONS = ['전국','서울','부산','인천','대구','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
const GOV_CATS = ['지자체지원금','정책자금','무상지원','창업지원','기타']

const POPUP_TYPES = [
  { key:'notice',  label:'공지',   color:'#f59e0b' },
  { key:'info',    label:'정보',   color:'#3b82f6' },
  { key:'event',   label:'이벤트', color:'#10b981' },
  { key:'warning', label:'경고',   color:'#ef4444' },
]

const TABS: { key: Tab; icon: string; label: string; color: string }[] = [
  { key:'keys',     icon:'🔑', label:'API 키',   color:'#ffd700' },
  { key:'members',  icon:'👥', label:'회원관리', color:'#34d399' },
  { key:'popup',    icon:'📢', label:'팝업',     color:'#f472b6' },
  { key:'gov',      icon:'🏛️', label:'정부지원', color:'#34d399' },
  { key:'password', icon:'🔒', label:'비밀번호', color:'#60a5fa' },
]

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [pw, setPw]         = useState('')
  const [shake, setShake]   = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [tab, setTab]       = useState<Tab>('keys')
  const [theme, setTheme]   = useState<Theme>('dark')
  const [busy, setBusy]     = useState(false)
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  const [gemini, setGemini] = useState('')
  const [dlId, setDlId]     = useState('')
  const [dlSec, setDlSec]   = useState('')
  const [openai, setOpenai] = useState('')
  const [groq, setGroq]     = useState('')
  const [aiProvider, setAiProvider] = useState<'gemini'|'openai'|'groq'>('gemini')
  const [showG, setShowG]   = useState(false)
  const [showI, setShowI]   = useState(false)
  const [showS, setShowS]   = useState(false)
  const [showO, setShowO]   = useState(false)
  const [showGr, setShowGr] = useState(false)

  const [popups, setPopups]   = useState<PopupItem[]>([])
  const [pTitle, setPTitle]   = useState('')
  const [pCont, setPCont]     = useState('')
  const [pType, setPType]     = useState('notice')
  const [pBg, setPBg]         = useState('#1c1c28')
  const [pFg, setPFg]         = useState('#f0f0f5')

  const [govList, setGovList] = useState<GovItem[]>([])
  const [gReg, setGReg]       = useState('전국')
  const [gCat, setGCat]       = useState('지자체지원금')
  const [gTitle, setGTitle]   = useState('')
  const [gCont, setGCont]     = useState('')

  // 회원관리
  interface Member { id: string; email: string; name: string; business_name: string; business_type: string; region: string; grade: string; expires_at: string; created_at: string; memo: string }
  const [members, setMembers]         = useState<Member[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberLogs, setMemberLogs]   = useState<{ type: string; created_at: string; meta: string }[]>([])
  const [memberLoading, setMemberLoading] = useState(false)
  const [editGrade, setEditGrade]     = useState('')
  const [editExpires, setEditExpires] = useState('')
  const [editMemo, setEditMemo]       = useState('')

  const [oldPw, setOldPw] = useState('')
  const [newP1, setNewP1] = useState('')
  const [newP2, setNewP2] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showP1, setShowP1]   = useState(false)
  const [showP2, setShowP2]   = useState(false)

  const isDark = theme === 'dark'
  const isYellow = theme === 'yellow'

  const BG      = isDark ? '#050510' : isYellow ? '#0f0e00' : '#f0f2ff'
  const SURFACE = isDark ? 'rgba(255,255,255,0.04)' : isYellow ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.85)'
  const BORDER  = isDark ? 'rgba(255,255,255,0.08)' : isYellow ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.08)'
  const TEXT    = isDark ? '#f0f0ff' : isYellow ? '#fff8dc' : '#1a1a2e'
  const MUTED   = isDark ? '#44446a' : isYellow ? '#aa9900' : '#9999bb'
  const ACCENT  = '#ff6b35'

  const pop = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }, [])

  const loadAll = useCallback(async () => {
    setBusy(true)
    try {
      const [configs, pops, govs, mems] = await Promise.all([
        supabaseQuery('admin_config','GET',undefined,'select=key,value'),
        supabaseQuery('popups','GET',undefined,'order=created_at.desc'),
        supabaseQuery('gov_support','GET',undefined,'order=created_at.desc'),
        supabaseQuery('profiles','GET',undefined,'order=created_at.desc'),
      ])
      if (Array.isArray(configs)) {
        configs.forEach((c: { key: string; value: string }) => {
          if (c.key==='gemini_key')     { setGemini(c.value||''); if (c.value) _adminKeys.gemini = c.value }
          if (c.key==='datalab_id')     setDlId(c.value||'')
          if (c.key==='datalab_secret') setDlSec(c.value||'')
          if (c.key==='openai_key')     { setOpenai(c.value||''); if (c.value) _adminKeys.openai = c.value }
          if (c.key==='groq_key')       { setGroq(c.value||''); if (c.value) _adminKeys.groq = c.value }
          if (c.key==='default_ai_provider') setAiProvider((c.value||'gemini') as 'gemini'|'openai'|'groq')
        })
        // 관리자 키 localStorage에 저장 → 메인 페이지에서 바로 사용
        if (Object.keys(_adminKeys).length > 0) {
          try { localStorage.setItem('storeauto_admin_keys', JSON.stringify(_adminKeys)) } catch { /* ignore */ }
        }
      }
      if (Array.isArray(pops)) setPopups(pops as PopupItem[])
      if (Array.isArray(govs)) setGovList(govs as GovItem[])
      if (Array.isArray(mems)) setMembers(mems as Member[])
    } catch (_e) { /* ignore */ }
    setBusy(false)
  }, [])

  const loadMemberDetail = async (m: Member) => {
    setSelectedMember(m)
    setEditGrade(m.grade || 'free')
    setEditExpires(m.expires_at ? m.expires_at.slice(0,10) : '')
    setEditMemo(m.memo || '')
    setMemberLoading(true)
    try {
      const logs = await supabaseQuery('usage_stats','GET',undefined,`user_id=eq.${m.id}&order=created_at.desc&limit=30`)
      if (Array.isArray(logs)) setMemberLogs(logs as { type: string; created_at: string; meta: string }[])
    } catch (_e) { /* ignore */ }
    setMemberLoading(false)
  }

  const saveMemberGrade = async () => {
    if (!selectedMember) return
    setBusy(true)
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ grade:editGrade, expires_at:editExpires||null, memo:editMemo }),
      })
      setMembers(prev => prev.map(m => m.id===selectedMember.id ? {...m, grade:editGrade, expires_at:editExpires, memo:editMemo} : m))
      setSelectedMember(prev => prev ? {...prev, grade:editGrade, expires_at:editExpires, memo:editMemo} : prev)
      pop('✅ 회원 정보 저장!')
    } catch (_e) { pop('❌ 저장 실패', false) }
    setBusy(false)
  }

  const login = useCallback(async () => {
    setBusy(true)
    try {
      const res = await supabaseQuery('admin_config','GET',undefined,'select=value&key=eq.admin_password') as Array<{value:string}>
      const stored = (Array.isArray(res) && res[0]?.value) ? res[0].value : DEFAULT_PW
      if (pw === stored) {
        localStorage.setItem('storeauto_admin_authed', '1'); setAuthed(true); loadAll()
      }
      else { setBusy(false); setShake(true); setTimeout(() => setShake(false), 500) }
    } catch (_e) {
      // Supabase 실패 시 기본 비번으로 폴백
      const local = localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW
      if (pw === local) { localStorage.setItem('storeauto_admin_authed', '1'); setAuthed(true); loadAll() }
      else { setBusy(false); setShake(true); setTimeout(() => setShake(false), 500) }
    }
  }, [pw, loadAll])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key==='Enter' && !authed) login() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [authed, login])

  useEffect(() => {
    try {
      const t = localStorage.getItem('admin_theme') as Theme
      if (t) setTheme(t)
    } catch (_e) { /* ignore */ }
  }, [])

  const setThemeAndSave = (t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('admin_theme', t) } catch (_e) { /* ignore */ }
  }

  const saveKeys = async () => {
    setBusy(true)
    try {
      const existing = await supabaseQuery('admin_config','GET',undefined,'select=key') as Array<{key:string}>
      const existKeys = Array.isArray(existing) ? existing.map((r) => r.key) : []

      for (const [k, v] of [
        ['gemini_key', gemini],
        ['datalab_id', dlId],
        ['datalab_secret', dlSec],
        ['openai_key', openai],
        ['groq_key', groq],
        ['default_ai_provider', aiProvider],
      ]) {
        if (existKeys.includes(k)) {
          await supabaseQuery('admin_config','PATCH',{value:v},'key=eq.'+k)
        } else {
          await supabaseQuery('admin_config','POST',{key:k,value:v})
        }
      }
      // ⚠️ localStorage 절대 건드리지 않음 - 회원 키와 완전 분리
      pop('✅ 키 저장 완료! (Supabase 전용)')
    } catch (_e) { pop('❌ ' + (_e instanceof Error ? _e.message : '저장 실패'), false) }
    setBusy(false)
  }

  const addPopup = async () => {
    if (!pTitle||!pCont) return
    setBusy(true)
    try {
      const res = await supabaseQuery('popups','POST',{title:pTitle,content:pCont,type:pType,active:true,bg_color:pBg,text_color:pFg}) as PopupItem[]
      if (Array.isArray(res)&&res[0]) setPopups([res[0],...popups])
      setPTitle(''); setPCont('')
      pop('✅ 팝업 등록!')
    } catch (_e) { pop('❌ 실패', false) }
    setBusy(false)
  }

  const togglePopup = async (p: PopupItem) => {
    try {
      await supabaseQuery('popups','PATCH',{active:!p.active},'id=eq.'+p.id)
      setPopups(popups.map((x) => x.id===p.id ? {...x,active:!x.active} : x))
    } catch (_e) { pop('❌ 오류', false) }
  }

  const delPopup = async (id: string) => {
    try {
      await supabaseQuery('popups','DELETE',undefined,'id=eq.'+id)
      setPopups(popups.filter((p) => p.id!==id))
      pop('🗑️ 삭제 완료')
    } catch (_e) { pop('❌ 오류', false) }
  }

  const addGov = async () => {
    if (!gTitle||!gCont) return
    setBusy(true)
    try {
      const res = await supabaseQuery('gov_support','POST',{region:gReg,category:gCat,title:gTitle,content:gCont}) as GovItem[]
      if (Array.isArray(res)&&res[0]) setGovList([res[0],...govList])
      setGTitle(''); setGCont('')
      pop('✅ 등록 완료!')
    } catch (_e) { pop('❌ 실패', false) }
    setBusy(false)
  }

  const delGov = async (id: string) => {
    try {
      await supabaseQuery('gov_support','DELETE',undefined,'id=eq.'+id)
      setGovList(govList.filter((g) => g.id!==id))
      pop('🗑️ 삭제 완료')
    } catch (_e) { pop('❌ 오류', false) }
  }

  const changePw = async () => {
    setBusy(true)
    try {
      // 현재 비번 확인
      const res = await supabaseQuery('admin_config','GET',undefined,'select=value&key=eq.admin_password') as Array<{value:string}>
      const stored = (Array.isArray(res) && res[0]?.value) ? res[0].value : DEFAULT_PW
      if (oldPw!==stored) { pop('❌ 현재 비밀번호 틀림', false); setBusy(false); return }
      if (newP1.length<4) { pop('❌ 4자 이상 입력', false); setBusy(false); return }
      if (newP1!==newP2)  { pop('❌ 비밀번호 불일치', false); setBusy(false); return }

      // 기존 레코드 있으면 PATCH, 없으면 POST
      const exists = Array.isArray(res) && res.length > 0
      if (exists) {
        await supabaseQuery('admin_config','PATCH',{value:newP1},'key=eq.admin_password')
      } else {
        await supabaseQuery('admin_config','POST',{key:'admin_password',value:newP1})
      }

      localStorage.setItem(ADMIN_PW_KEY, newP1)
      setOldPw(''); setNewP1(''); setNewP2('')
      pop('✅ 비밀번호 변경 완료! 모든 기기에 적용됩니다.')
    } catch (_e) { pop('❌ ' + (_e instanceof Error ? _e.message : '저장 실패'), false) }
    setBusy(false)
  }

  const inputSt: React.CSSProperties = {
    width:'100%', background:SURFACE, border:'1px solid '+BORDER,
    borderRadius:'14px', padding:'14px 18px', color:TEXT,
    fontSize:'15px', outline:'none', fontFamily:"'Noto Sans KR',sans-serif",
    transition:'all 0.2s',
  }

  const glowBtn = (color: string): React.CSSProperties => ({
    padding:'13px 28px', borderRadius:'14px', border:'none', cursor:'pointer',
    fontFamily:"'Noto Sans KR',sans-serif", fontSize:'14px', fontWeight:800,
    color:'white', background:color,
    boxShadow:'0 4px 20px '+color+'55',
    transition:'all 0.25s', letterSpacing:'0.3px',
  })

  // ── 로그인 ──────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight:'100vh', width:'100%', background:BG, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Noto Sans KR',sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes orbit { from{transform:rotate(0deg) translateX(180px) rotate(0deg)} to{transform:rotate(360deg) translateX(180px) rotate(-360deg)} }
        @keyframes orbitR { from{transform:rotate(0deg) translateX(120px) rotate(0deg)} to{transform:rotate(-360deg) translateX(120px) rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes glowPulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder{color:#555}
        *{box-sizing:border-box}
      `}</style>

      {/* 배경 오브들 */}
      {[
        {w:500,h:500,color:'rgba(255,107,53,0.07)',top:'-10%',left:'-5%',blur:80},
        {w:400,h:400,color:'rgba(139,92,246,0.06)',top:'60%',left:'70%',blur:80},
        {w:300,h:300,color:'rgba(20,184,166,0.05)',top:'40%',left:'20%',blur:60},
      ].map((o,i) => (
        <div key={i} style={{ position:'absolute', width:o.w, height:o.h, borderRadius:'50%', background:o.color, top:o.top, left:o.left, filter:'blur('+o.blur+'px)', animation:'glowPulse '+(4+i)+'s ease-in-out infinite', animationDelay:(i*1.5)+'s', pointerEvents:'none' }} />
      ))}

      {/* 궤도 장식 */}
      <div style={{ position:'absolute', width:360, height:360, borderRadius:'50%', border:'1px solid rgba(255,107,53,0.06)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
        <div style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:'#ff6b35', top:'50%', left:'50%', marginTop:-5, marginLeft:-5, animation:'orbit 8s linear infinite', boxShadow:'0 0 12px #ff6b35' }} />
      </div>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', border:'1px solid rgba(139,92,246,0.04)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
        <div style={{ position:'absolute', width:7, height:7, borderRadius:'50%', background:'#8b5cf6', top:'50%', left:'50%', marginTop:-3.5, marginLeft:-3.5, animation:'orbitR 12s linear infinite', boxShadow:'0 0 10px #8b5cf6' }} />
      </div>

      {/* 테마 버튼 */}
      <div style={{ position:'fixed', top:20, right:20, display:'flex', gap:8, zIndex:10 }}>
        {(['dark','light','yellow'] as Theme[]).map((t) => (
          <button key={t} onClick={() => setThemeAndSave(t)} style={{ width:34, height:34, borderRadius:'50%', border:'2px solid '+(theme===t ? ACCENT : 'transparent'), cursor:'pointer', fontSize:'16px', transition:'all 0.2s', background:t==='dark'?'#1a1a2e':t==='light'?'#f0f2ff':'#1a1600', boxShadow:theme===t?'0 0 16px '+ACCENT+'66':'' }}>
            {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
          </button>
        ))}
      </div>

      {/* 로그인 카드 */}
      <div style={{ width:'100%', maxWidth:400, padding:'0 20px', animation:'fadeUp 0.6s ease', position:'relative', zIndex:5 }}>
        <div style={{ animation:'float 5s ease-in-out infinite' }}>
          {/* 로고 */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#ff6b35,#ffd700)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 16px', boxShadow:'0 0 40px rgba(255,107,53,0.5), 0 20px 40px rgba(0,0,0,0.3)' }}>⚙️</div>
            <div style={{ fontSize:26, fontWeight:900, color:TEXT, letterSpacing:'-0.5px' }}>관리자 패널</div>
            <div style={{ fontSize:13, color:MUTED, marginTop:6, letterSpacing:'2px' }}>STORE AUTO ADMIN</div>
          </div>

          {/* 카드 */}
          <div style={{ background:SURFACE, border:'1px solid '+BORDER, borderRadius:28, padding:'36px 32px', backdropFilter:'blur(40px)', boxShadow:'0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, color:MUTED, letterSpacing:'2px', marginBottom:10, fontWeight:700 }}>비밀번호</div>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw?'text':'password'} value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  style={{ ...inputSt, letterSpacing: showPw?'1px':'4px', fontSize:18, paddingRight:50, borderColor:shake?'#ef4444':BORDER, animation:shake?'shake 0.5s ease':'none', boxShadow:shake?'0 0 20px rgba(239,68,68,0.3)':'none' }}
                />
                <button onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:20, color:MUTED, padding:4, transition:'all 0.2s' }}>{showPw?'🙈':'👁️'}</button>
              </div>
              {shake && <div style={{ fontSize:13, color:'#ef4444', marginTop:8, fontWeight:700, animation:'fadeUp 0.3s ease' }}>⚠️ 비밀번호가 틀렸어요</div>}
            </div>

            <button onClick={login} style={{ ...glowBtn('linear-gradient(135deg,#ff6b35,#ff8c5a)'), width:'100%', fontSize:16, padding:'16px', boxShadow:'0 8px 30px rgba(255,107,53,0.45)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px) scale(1.01)'; (e.currentTarget as HTMLElement).style.boxShadow='0 14px 40px rgba(255,107,53,0.55)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 30px rgba(255,107,53,0.45)' }}
            >🚀 로그인</button>

            <button onClick={() => router.push('/')} style={{ width:'100%', padding:'13px', marginTop:10, background:'transparent', border:'none', color:MUTED, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>
              ← 메인으로 돌아가기
            </button>
            <button onClick={() => router.push('/login')} style={{ width:'100%', padding:'10px', background:'transparent', border:'none', color:MUTED, fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", opacity:0.6 }}>
              일반 회원 로그인 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── 대시보드 ────────────────────────────────────────
  const activeTabInfo = TABS.find((t) => t.key===tab)!

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:BG, color:TEXT, fontFamily:"'Noto Sans KR',sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes glowPulse{0%,100%{opacity:0.3}50%{opacity:0.6}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        input::placeholder,textarea::placeholder{color:#555}
        select option{background:#1c1c28}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,107,53,0.3);border-radius:10px}
        .hov-row:hover{background:rgba(255,107,53,0.04)!important;transition:background 0.2s}
      `}</style>

      {/* 토스트 */}
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, padding:'14px 22px', borderRadius:14, fontSize:14, fontWeight:800, backdropFilter:'blur(20px)', animation:'toastIn 0.3s ease', background:toast.ok?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', border:'1px solid '+(toast.ok?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'), color:toast.ok?'#34d399':'#f87171', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background:SURFACE, borderBottom:'1px solid '+BORDER, padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(30px)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#ff6b35,#ffd700)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 0 20px rgba(255,107,53,0.4)', animation:'bounce 2s ease-in-out infinite' }}>⚙️</div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, letterSpacing:'-0.3px', color:TEXT }}>관리자 패널</div>
            <div style={{ fontSize:11, color:MUTED, letterSpacing:'1px' }}>STORE AUTO</div>
          </div>
          <div style={{ marginLeft:8, width:8, height:8, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 10px #10b981', animation:'glowPulse 2s ease-in-out infinite' }} />
          {busy && <div style={{ fontSize:11, color:MUTED, animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</div>}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* 테마 */}
          <div style={{ display:'flex', gap:6 }}>
            {(['dark','light','yellow'] as Theme[]).map((t) => (
              <button key={t} onClick={() => setThemeAndSave(t)} style={{ width:30, height:30, borderRadius:'50%', border:'2px solid '+(theme===t?ACCENT:'transparent'), cursor:'pointer', fontSize:14, transition:'all 0.2s', background:t==='dark'?'#1a1a2e':t==='light'?'#e8eaff':'#1a1600', boxShadow:theme===t?'0 0 12px '+ACCENT+'88':'' }}>
                {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
              </button>
            ))}
          </div>
          <button onClick={() => router.push('/')} title="메인으로" style={{ ...glowBtn('rgba(255,255,255,0.06)'), padding:'8px 10px', fontSize:18, color:MUTED, boxShadow:'none', border:'1px solid '+BORDER, minWidth:40 }}>🏠</button>
          <button onClick={() => setAuthed(false)} title="로그아웃" style={{ ...glowBtn('linear-gradient(135deg,#ef4444,#dc2626)'), padding:'8px 10px', fontSize:18, boxShadow:'0 4px 16px rgba(239,68,68,0.3)', minWidth:40 }}>🚪</button>
        </div>
      </div>

      {/* 바디 */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* 사이드바 — 데스크탑 */}
        <div style={{ width:220, flexShrink:0, background:SURFACE, borderRight:'1px solid '+BORDER, padding:'24px 12px', display:'flex', flexDirection:'column', gap:6 }} className="desktop-sidebar">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:14, cursor:'pointer',
              border:'none', fontFamily:"'Noto Sans KR',sans-serif", fontSize:14, fontWeight:800,
              textAlign:'left', width:'100%', transition:'all 0.2s',
              background:tab===t.key?t.color+'18':'transparent',
              color:tab===t.key?t.color:MUTED,
              borderLeft:tab===t.key?'3px solid '+t.color:'3px solid transparent',
              boxShadow:tab===t.key?'inset 0 0 20px '+t.color+'08':'none',
              animation:'bounce 3s ease-in-out infinite',
              animationDelay:TABS.indexOf(t)*0.2+'s',
            }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.background=t.color+'12'; el.style.transform='translateX(4px)' }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.background=tab===t.key?t.color+'18':'transparent'; el.style.transform='' }}
            >
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span>{t.label}</span>
              {tab===t.key && <span style={{ marginLeft:'auto', fontSize:8, color:t.color }}>●</span>}
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div style={{ flex:1, overflowY:'auto', padding:'clamp(16px,3vw,36px)', paddingBottom:80, animation:'fadeUp 0.3s ease' }}>

          {/* 섹션 헤더 */}
          <div style={{ marginBottom:28, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:activeTabInfo.color+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 0 20px '+activeTabInfo.color+'30', animation:'bounce 2s ease-in-out infinite' }}>
              {activeTabInfo.icon}
            </div>
            <div>
              <div style={{ fontSize:'clamp(18px,3vw,22px)', fontWeight:900, color:TEXT, letterSpacing:'-0.3px' }}>{activeTabInfo.label}</div>
              <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>
                {tab==='keys'&&'Supabase 저장 → 모든 기기 자동 동기화'}
                {tab==='members'&&'회원 등급·만료일·작업일지를 관리합니다'}
                {tab==='popup'&&'방문자에게 표시될 팝업을 관리합니다'}
                {tab==='gov'&&'챗봇이 우선 참고하는 지원정보'}
                {tab==='password'&&'관리자 로그인 비밀번호 변경'}
              </div>
            </div>
          </div>

          {/* ── 회원관리 ── */}
          {tab==='members' && (
            <div style={{ display:'flex', gap:24, height:'calc(100vh - 200px)', overflow:'hidden' }}>
              {/* 회원 목록 */}
              <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
                <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="이름, 이메일, 상호명 검색..." style={{ ...inputSt, borderRadius:12, fontSize:13 }} />
                <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                  {members.filter(m => !memberSearch || [m.email,m.name,m.business_name].some(v => v?.includes(memberSearch))).map(m => {
                    const gradeColor = m.grade==='pro'?'#ffd700':m.grade==='vip'?'#f472b6':'#555'
                    const expired = m.expires_at && new Date(m.expires_at) < new Date()
                    return (
                      <button key={m.id} onClick={()=>loadMemberDetail(m)} style={{ display:'flex', flexDirection:'column', gap:3, padding:'12px 14px', borderRadius:12, cursor:'pointer', border:'1px solid '+(selectedMember?.id===m.id?'#ff6b35':'rgba(255,255,255,0.06)'), background:selectedMember?.id===m.id?'rgba(255,107,53,0.1)':'rgba(255,255,255,0.02)', textAlign:'left', fontFamily:'inherit', transition:'all 0.15s' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:13, fontWeight:800, color:TEXT }}>{m.name||'이름없음'}</span>
                          <div style={{ display:'flex', gap:4 }}>
                            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:gradeColor+'22', color:gradeColor, fontWeight:800 }}>{(m.grade||'free').toUpperCase()}</span>
                            {expired && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(239,68,68,0.15)', color:'#f87171', fontWeight:800 }}>만료</span>}
                          </div>
                        </div>
                        <span style={{ fontSize:11, color:MUTED }}>{m.email}</span>
                        {m.business_name && <span style={{ fontSize:11, color:MUTED }}>{m.business_name}</span>}
                      </button>
                    )
                  })}
                  {members.length===0 && <div style={{ textAlign:'center', padding:'40px 0', color:MUTED, fontSize:13 }}>회원이 없어요</div>}
                </div>
                <div style={{ fontSize:11, color:MUTED, textAlign:'center' }}>총 {members.length}명</div>
              </div>

              {/* 회원 상세 */}
              <div style={{ flex:1, overflowY:'auto' }}>
                {!selectedMember ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:MUTED }}>
                    <div style={{ fontSize:48, marginBottom:12, opacity:0.2 }}>👤</div>
                    <div style={{ fontSize:14 }}>회원을 선택해주세요</div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn 0.2s ease' }}>
                    {/* 기본 정보 */}
                    <div style={{ background:SURFACE, border:'1px solid '+BORDER, borderRadius:16, padding:'18px 20px' }}>
                      <div style={{ fontSize:13, fontWeight:900, color:'#34d399', marginBottom:14 }}>👤 기본 정보</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        {[
                          {l:'이름', v:selectedMember.name||'-'},
                          {l:'이메일', v:selectedMember.email},
                          {l:'상호명', v:selectedMember.business_name||'-'},
                          {l:'연락처', v:(selectedMember as unknown as Record<string,string>).phone||'-'},
                          {l:'업종', v:selectedMember.business_type||'-'},
                          {l:'지역', v:selectedMember.region||'-'},
                          {l:'가입일', v:selectedMember.created_at?.slice(0,10)||'-'},
                        ].map(({l,v}) => (
                          <div key={l}>
                            <div style={{ fontSize:11, color:MUTED, fontWeight:700, marginBottom:3 }}>{l}</div>
                            <div style={{ fontSize:13, color:TEXT }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 등급/만료일 설정 */}
                    <div style={{ background:SURFACE, border:'1px solid '+BORDER, borderRadius:16, padding:'18px 20px' }}>
                      <div style={{ fontSize:13, fontWeight:900, color:'#ffd700', marginBottom:14 }}>⭐ 등급 / 만료일 설정</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:11, color:MUTED, fontWeight:700, marginBottom:7 }}>등급</div>
                          <select value={editGrade} onChange={e=>setEditGrade(e.target.value)} style={{ ...inputSt, cursor:'pointer', borderRadius:10 }}>
                            <option value="free">FREE — 무료</option>
                            <option value="pro">PRO — 유료</option>
                            <option value="vip">VIP — 최상위</option>
                            <option value="suspended">SUSPENDED — 정지</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:MUTED, fontWeight:700, marginBottom:7 }}>사용 만료일</div>
                          <input type="date" value={editExpires} onChange={e=>setEditExpires(e.target.value)} style={{ ...inputSt, borderRadius:10, colorScheme:'dark' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, color:MUTED, fontWeight:700, marginBottom:7 }}>관리자 메모</div>
                        <textarea value={editMemo} onChange={e=>setEditMemo(e.target.value)} placeholder="내부 메모 (회원에게 보이지 않아요)" rows={2} style={{ ...inputSt, resize:'vertical', borderRadius:10 }} />
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <GlowButton onClick={saveMemberGrade} busy={busy} label="💾 저장" color="linear-gradient(135deg,#ffd700,#f59e0b)" glow="rgba(255,215,0,0.4)" />
                        <button onClick={()=>{setEditExpires(new Date(Date.now()+30*86400000).toISOString().slice(0,10))}} style={{ padding:'10px 16px', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:10, color:'#34d399', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>+30일</button>
                        <button onClick={()=>{setEditExpires(new Date(Date.now()+90*86400000).toISOString().slice(0,10))}} style={{ padding:'10px 16px', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:10, color:'#34d399', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>+90일</button>
                        <button onClick={()=>{setEditExpires(new Date().toISOString().slice(0,10))}} style={{ padding:'10px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#f87171', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>즉시만료</button>
                      </div>
                    </div>

                    {/* 작업일지 */}
                    <div style={{ background:SURFACE, border:'1px solid '+BORDER, borderRadius:16, padding:'18px 20px' }}>
                      <div style={{ fontSize:13, fontWeight:900, color:'#60a5fa', marginBottom:14 }}>📋 작업일지 ({memberLogs.length}건)</div>
                      {memberLoading ? (
                        <div style={{ textAlign:'center', padding:'20px', color:MUTED, fontSize:13 }}>불러오는 중...</div>
                      ) : memberLogs.length===0 ? (
                        <div style={{ textAlign:'center', padding:'20px', color:MUTED, fontSize:13 }}>작업 기록이 없어요</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {memberLogs.map((l,i) => {
                            const typeMap: Record<string,{label:string;emoji:string;color:string}> = {
                              detail_page:{label:'상세페이지',emoji:'📄',color:'#ff6b35'},
                              review:{label:'리뷰답글',emoji:'💬',color:'#10b981'},
                              government:{label:'정부지원',emoji:'🏛️',color:'#3b82f6'},
                              work_log:{label:'작업일지',emoji:'📝',color:'#f59e0b'},
                            }
                            const info = typeMap[l.type] || {label:l.type,emoji:'📌',color:'#888'}
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8 }}>
                                <span style={{ fontSize:16, flexShrink:0 }}>{info.emoji}</span>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:700, color:info.color }}>{info.label}</div>
                                  {l.meta && <div style={{ fontSize:11, color:MUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.meta}</div>}
                                </div>
                                <div style={{ fontSize:10, color:MUTED, flexShrink:0 }}>{new Date(l.created_at).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── API 키 ── */}
          {tab==='keys' && (
            <div style={{ display:'flex', gap:40, alignItems:'flex-start' }}>
              <div style={{ maxWidth:560, flex:1 }}>

              {/* AI 선택 */}
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:900, color:TEXT, marginBottom:4 }}>기본 AI 선택</div>
                <div style={{ fontSize:11, color:MUTED, marginBottom:14 }}>정부지원 챗봇 및 일반 회원 AI 미설정 시 사용할 AI를 선택하세요</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  {([
                    { key:'gemini', icon:'✦', label:'Gemini', badge:'일부무료', color:'#f59e0b', desc:'Google AI\n빠르고 무료' },
                    { key:'openai', icon:'⬡', label:'OpenAI', badge:'유료', color:'#10b981', desc:'GPT-4o\n이미지 분석 가능' },
                    { key:'groq',   icon:'⚡', label:'Groq',   badge:'무료', color:'#00e5a0', desc:'Llama 3.3\n완전 무료' },
                  ] as const).map(p => {
                    const isSelected = aiProvider === p.key
                    return (
                      <button key={p.key} onClick={() => setAiProvider(p.key)} style={{
                        padding:'16px 12px', borderRadius:14, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif",
                        border: isSelected ? `2px solid ${p.color}` : `1px solid ${BORDER}`,
                        background: isSelected ? `${p.color}18` : SURFACE,
                        transition:'all 0.2s',
                        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                        boxShadow: isSelected ? `0 0 20px ${p.color}33` : 'none',
                        position:'relative' as const,
                      }}>
                        {isSelected && (
                          <div style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:'50%', background:p.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#000', fontWeight:900 }}>✓</div>
                        )}
                        <div style={{ fontSize:22, marginBottom:6, color:p.color }}>{p.icon}</div>
                        <div style={{ fontSize:14, fontWeight:900, color:TEXT, marginBottom:3 }}>{p.label}</div>
                        <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${p.color}22`, color:p.color, fontWeight:800, display:'inline-block', marginBottom:6 }}>{p.badge}</div>
                        <div style={{ fontSize:11, color:MUTED, whiteSpace:'pre-line', lineHeight:1.5 }}>{p.desc}</div>
                      </button>
                    )
                  })}
                </div>
                <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, background:`rgba(255,215,0,0.06)`, border:`1px solid rgba(255,215,0,0.15)`, fontSize:12, color:'#ffd700', fontWeight:700 }}>
                  현재 선택: <span style={{ textTransform:'uppercase' }}>{aiProvider}</span> — 키 저장 버튼을 눌러야 적용돼요
                </div>
              </div>

              {[
                { label:'Gemini API 키', badge:'일부무료', badgeColor:'#f59e0b', value:gemini, set:setGemini, show:showG, toggleShow:()=>setShowG(!showG), ph:'AIza...' },
                { label:'OpenAI API 키', badge:'유료', badgeColor:'#ef4444', value:openai, set:setOpenai, show:showO, toggleShow:()=>setShowO(!showO), ph:'sk-...' },
                { label:'Groq API 키', badge:'무료', badgeColor:'#00e5a0', value:groq, set:setGroq, show:showGr, toggleShow:()=>setShowGr(!showGr), ph:'gsk_...' },
                { label:'네이버 데이터랩 Client ID', value:dlId, set:setDlId, show:showI, toggleShow:()=>setShowI(!showI), ph:'Client ID' },
                { label:'네이버 데이터랩 Client Secret', value:dlSec, set:setDlSec, show:showS, toggleShow:()=>setShowS(!showS), ph:'Client Secret' },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:MUTED, letterSpacing:'0.5px' }}>{f.label}</span>
                    {'badge' in f && f.badge && <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:f.badgeColor+'22', color:f.badgeColor, fontWeight:800 }}>{f.badge}</span>}
                  </div>
                  <div style={{ position:'relative' }}>
                    <input type={f.show?'text':'password'} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                      style={{ ...inputSt, paddingRight:50, borderRadius:16 }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor=activeTabInfo.color; (e.target as HTMLInputElement).style.boxShadow='0 0 20px '+activeTabInfo.color+'22' }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor=BORDER; (e.target as HTMLInputElement).style.boxShadow='none' }}
                    />
                    <button onClick={f.toggleShow} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, color:MUTED, padding:4, transition:'all 0.2s' }}>{f.show?'🙈':'👁️'}</button>
                  </div>
                </div>
              ))}
              <GlowButton onClick={saveKeys} busy={busy} label="💾 저장하기" color="linear-gradient(135deg,#ff6b35,#ffd700)" glow="rgba(255,107,53,0.4)" />
              <div style={{ marginTop:20, padding:'16px 18px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:16, fontSize:13, color:'#34d399', lineHeight:1.8 }}>
                🔒 관리자 키는 <strong>Supabase에만 저장</strong>되며 일반 회원 키와 완전 분리됩니다.<br />
                일반 회원은 각자 설정 페이지에서 본인 키를 입력해 사용해요.
              </div>
            </div>
            <AdminCharacter color={activeTabInfo.color} emoji="🔑" label={"API 키를 저장하면\n모든 기기에서 사용 가능해요!"} />
            </div>
          )}

          {/* ── 팝업 ── */}
          {tab==='popup' && (
            <div>
              <Card color={activeTabInfo.color} title="+ 새 팝업 등록">
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                  {POPUP_TYPES.map((t) => (
                    <button key={t.key} onClick={() => setPType(t.key)} style={{ padding:'7px 18px', borderRadius:20, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, fontWeight:800, border:'none', background:pType===t.key?t.color:'rgba(255,255,255,0.05)', color:pType===t.key?'white':MUTED, transition:'all 0.2s', boxShadow:pType===t.key?'0 4px 16px '+t.color+'44':'' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="팝업 제목" style={{ ...inputSt, marginBottom:10, borderRadius:16 }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor=activeTabInfo.color }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor=BORDER }}
                />
                <textarea value={pCont} onChange={(e) => setPCont(e.target.value)} placeholder="팝업 내용 (링크, 공지, 이벤트 내용 등)" rows={3} style={{ ...inputSt, resize:'vertical', marginBottom:14, borderRadius:16 }}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor=activeTabInfo.color }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor=BORDER }}
                />
                <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:MUTED }}>배경색</span>
                    <input type="color" value={pBg} onChange={(e) => setPBg(e.target.value)} style={{ width:36, height:32, border:'none', background:'none', cursor:'pointer', borderRadius:8 }} />
                    <span style={{ fontSize:12, color:MUTED }}>글자색</span>
                    <input type="color" value={pFg} onChange={(e) => setPFg(e.target.value)} style={{ width:36, height:32, border:'none', background:'none', cursor:'pointer', borderRadius:8 }} />
                  </div>
                  <GlowButton onClick={addPopup} busy={busy} label="📢 등록" color="linear-gradient(135deg,#f472b6,#ec4899)" glow="rgba(244,114,182,0.4)" />
                </div>
              </Card>

              {popups.length===0 && <EmptyState text="등록된 팝업이 없어요" />}
              {popups.map((p) => {
                const pt = POPUP_TYPES.find((t) => t.key===p.type)
                return (
                  <div key={p.id} className="hov-row" style={{ background:SURFACE, border:'1px solid '+(p.active?pt?.color+'33':BORDER), borderRadius:16, padding:'16px 20px', marginBottom:10, display:'flex', gap:14, alignItems:'flex-start', transition:'all 0.2s' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                        <span style={{ fontWeight:900, fontSize:15, color:TEXT }}>{p.title}</span>
                        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:(pt?.color||'#888')+'22', color:pt?.color||'#888', fontWeight:800 }}>{pt?.label}</span>
                        <span style={{ fontSize:11, color:p.active?'#10b981':MUTED, fontWeight:700 }}>{p.active?'● 활성':'○ 비활성'}</span>
                      </div>
                      <div style={{ fontSize:13, color:MUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.content}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <ActionBtn onClick={() => togglePopup(p)} color={p.active?'#f59e0b':'#10b981'}>{p.active?'⏸':'▶'}</ActionBtn>
                      <ActionBtn onClick={() => p.id&&delPopup(p.id)} color="#ef4444">🗑</ActionBtn>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── 정부지원 ── */}
          {tab==='gov' && (
            <div>
              <Card color={activeTabInfo.color} title="+ 새 지원정보 등록">
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  <StyledSelect value={gReg} onChange={setGReg} options={REGIONS} color={activeTabInfo.color} bg={SURFACE} border={BORDER} textColor={TEXT} />
                  <StyledSelect value={gCat} onChange={setGCat} options={GOV_CATS} color={activeTabInfo.color} bg={SURFACE} border={BORDER} textColor={TEXT} />
                  <input value={gTitle} onChange={(e) => setGTitle(e.target.value)} placeholder="지원사업명" style={{ ...inputSt, flex:1, minWidth:140, borderRadius:16 }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor=activeTabInfo.color }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor=BORDER }}
                  />
                </div>
                <textarea value={gCont} onChange={(e) => setGCont(e.target.value)} placeholder="지원 내용, 신청 방법, 금액, 대상, URL 등" rows={3} style={{ ...inputSt, resize:'vertical', marginBottom:14, borderRadius:16 }}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor=activeTabInfo.color }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor=BORDER }}
                />
                <GlowButton onClick={addGov} busy={busy} label="🏛️ 등록" color="linear-gradient(135deg,#34d399,#059669)" glow="rgba(52,211,153,0.4)" />
              </Card>

              {govList.length===0 && <EmptyState text="등록된 지원정보가 없어요" />}
              {govList.map((g) => (
                <div key={g.id} className="hov-row" style={{ background:SURFACE, border:'1px solid '+BORDER, borderRadius:16, padding:'14px 18px', marginBottom:8, display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(255,107,53,0.15)', color:'#ff6b35', fontWeight:800 }}>{g.region}</span>
                      <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:SURFACE, color:MUTED }}>{g.category}</span>
                      <span style={{ fontSize:15, fontWeight:900, color:TEXT }}>{g.title}</span>
                    </div>
                    <div style={{ fontSize:13, color:MUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.content}</div>
                  </div>
                  <ActionBtn onClick={() => g.id&&delGov(g.id)} color="#ef4444">🗑</ActionBtn>
                </div>
              ))}
            </div>
          )}

          {/* ── 비밀번호 ── */}
          {tab==='password' && (
            <div style={{ display:'flex', gap:40, alignItems:'flex-start' }}>
              <div style={{ maxWidth:420, flex:1 }}>
              {[
                { label:'현재 비밀번호', value:oldPw, set:setOldPw, show:showOld, toggle:()=>setShowOld(!showOld) },
                { label:'새 비밀번호 (4자 이상)', value:newP1, set:setNewP1, show:showP1, toggle:()=>setShowP1(!showP1) },
                { label:'새 비밀번호 확인', value:newP2, set:setNewP2, show:showP2, toggle:()=>setShowP2(!showP2) },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, color:MUTED, fontWeight:800, letterSpacing:'0.5px', marginBottom:8 }}>{f.label}</div>
                  <div style={{ position:'relative' }}>
                    <input type={f.show?'text':'password'} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.label} style={{ ...inputSt, borderRadius:16, paddingRight:50 }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor=activeTabInfo.color; (e.target as HTMLInputElement).style.boxShadow='0 0 20px '+activeTabInfo.color+'22' }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor=BORDER; (e.target as HTMLInputElement).style.boxShadow='none' }}
                    />
                    <button onClick={f.toggle} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, color:MUTED, padding:4, transition:'all 0.2s' }}>{f.show?'🙈':'👁️'}</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:8, marginBottom:24 }}>
                <GlowButton onClick={changePw} busy={busy} label="🔒 비밀번호 변경" color="linear-gradient(135deg,#60a5fa,#3b82f6)" glow="rgba(96,165,250,0.4)" />
              </div>
              <div style={{ padding:'16px 18px', background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:16, fontSize:13, color:'#93c5fd', lineHeight:1.8 }}>
                ✅ 비밀번호는 Supabase에 저장되어 <strong>모든 기기에서 동기화</strong>됩니다.<br />
                초기 비밀번호: <strong>admin1234</strong>
              </div>
            </div>
            <AdminCharacter color={activeTabInfo.color} emoji="🔒" label={"비밀번호 변경 시\n모든 기기에 즉시 적용돼요!"} />
            </div>
          )}

        </div>
      </div>

      {/* 하단 탭 — 모바일 */}
      <div style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, zIndex:200, background:SURFACE, borderTop:'1px solid '+BORDER, paddingBottom:'env(safe-area-inset-bottom)', backdropFilter:'blur(30px)' }} id="mobile-nav">
        <div style={{ display:'flex', justifyContent:'space-around', padding:'6px 0' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:3, padding:'6px 0', flex:1,
              background:'transparent', border:'none', cursor:'pointer',
              color:tab===t.key?t.color:MUTED, fontFamily:"'Noto Sans KR',sans-serif",
              fontSize:9, fontWeight:800, transition:'all 0.2s', letterSpacing:'-0.3px',
              animation:tab===t.key?'bounce 1.5s ease-in-out infinite':'none',
            }}>
              <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
              <span style={{ whiteSpace:'nowrap' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-sidebar { display: none !important; }
          #mobile-nav { display: block !important; }
        }
      `}</style>
    </div>
  )
}

function GlowButton({ onClick, busy, label, color, glow }: { onClick:()=>void; busy:boolean; label:string; color:string; glow:string }) {
  return (
    <button onClick={onClick} disabled={busy} style={{ padding:'13px 28px', borderRadius:14, border:'none', cursor:busy?'not-allowed':'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontSize:14, fontWeight:800, color:'white', background:busy?'rgba(255,255,255,0.1)':color, boxShadow:busy?'none':'0 6px 24px '+glow, transition:'all 0.25s', opacity:busy?0.6:1 }}
      onMouseEnter={(e) => { if (!busy) { const el=e.currentTarget; el.style.transform='translateY(-3px) scale(1.02)'; el.style.boxShadow='0 12px 36px '+glow } }}
      onMouseLeave={(e) => { const el=e.currentTarget; el.style.transform=''; el.style.boxShadow=busy?'none':'0 6px 24px '+glow }}
    >{busy?'처리 중...':label}</button>
  )
}

function ActionBtn({ onClick, color, children }: { onClick:()=>void; color:string; children:React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background:color+'15', border:'1px solid '+color+'33', color, borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:14, transition:'all 0.2s' }}
      onMouseEnter={(e) => { const el=e.currentTarget; el.style.background=color+'30'; el.style.transform='scale(1.1)' }}
      onMouseLeave={(e) => { const el=e.currentTarget; el.style.background=color+'15'; el.style.transform='' }}
    >{children}</button>
  )
}

function Card({ color, title, children }: { color:string; title:string; children:React.ReactNode }) {
  return (
    <div style={{ background:color+'08', border:'1px solid '+color+'25', borderRadius:20, padding:'20px 22px', marginBottom:24, boxShadow:'0 0 40px '+color+'08' }}>
      <div style={{ fontSize:13, fontWeight:900, color, marginBottom:16, letterSpacing:'0.3px' }}>{title}</div>
      {children}
    </div>
  )
}

function StyledSelect({ value, onChange, options, color, bg, border, textColor }: { value:string; onChange:(v:string)=>void; options:string[]; color:string; bg:string; border:string; textColor:string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ background:bg, border:'1px solid '+border, color:textColor, borderRadius:14, padding:'13px 16px', fontSize:14, cursor:'pointer', outline:'none', fontFamily:"'Noto Sans KR',sans-serif", transition:'all 0.2s' }}
      onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor=color }}
      onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor=border }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function EmptyState({ text }: { text:string }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'#333' }}>
      <div style={{ fontSize:48, marginBottom:14, opacity:0.2 }}>📭</div>
      <div style={{ fontSize:15 }}>{text}</div>
    </div>
  )
}

function AdminCharacter({ color, emoji, label }: { color:string; emoji:string; label:string }) {
  return (
    <div style={{ flex:1, alignSelf:'stretch', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', minHeight:400 }} className="admin-char">
      <style>{`
        @media(max-width:900px){.admin-char{display:none!important}}
        @keyframes charFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-20px) rotate(2deg)}}
        @keyframes ringRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ringRotateR{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
        @keyframes glowBreath{0%,100%{opacity:0.2;transform:scale(0.95)}50%{opacity:0.6;transform:scale(1.05)}}
        @keyframes starPop{0%,100%{transform:scale(1) rotate(0deg);opacity:0.6}50%{transform:scale(1.3) rotate(180deg);opacity:1}}
        @keyframes particleDrift{0%{transform:translateY(0) translateX(0);opacity:0.8}100%{transform:translateY(-60px) translateX(20px);opacity:0}}
      `}</style>

      {/* SVG 배경 광원 */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={'rg'+emoji} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={'rg2'+emoji} cx="30%" cy="70%" r="40%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
          <filter id={'blur'+emoji}>
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <ellipse cx="50%" cy="50%" rx="45%" ry="45%" fill={'url(#rg'+emoji+')'} style={{ animation:'glowBreath 3s ease-in-out infinite' }} />
        <ellipse cx="30%" cy="70%" rx="30%" ry="30%" fill={'url(#rg2'+emoji+')'} style={{ animation:'glowBreath 4s ease-in-out infinite', animationDelay:'1s' }} />
        {/* 격자 패턴 */}
        {Array.from({length:6}).map((_,i) => (
          <line key={'h'+i} x1="0" y1={`${(i+1)*14}%`} x2="100%" y2={`${(i+1)*14}%`} stroke={color} strokeOpacity="0.04" strokeWidth="1" />
        ))}
        {Array.from({length:6}).map((_,i) => (
          <line key={'v'+i} x1={`${(i+1)*14}%`} y1="0" x2={`${(i+1)*14}%`} y2="100%" stroke={color} strokeOpacity="0.04" strokeWidth="1" />
        ))}
      </svg>

      {/* 회전 링들 */}
      <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', border:'1px dashed '+color+'30', animation:'ringRotate 12s linear infinite' }}>
        <div style={{ position:'absolute', top:-5, left:'50%', marginLeft:-5, width:10, height:10, borderRadius:'50%', background:color, boxShadow:'0 0 12px '+color+', 0 0 24px '+color+'66' }} />
      </div>
      <div style={{ position:'absolute', width:240, height:240, borderRadius:'50%', border:'1px dashed '+color+'20', animation:'ringRotateR 8s linear infinite' }}>
        <div style={{ position:'absolute', bottom:-4, left:'50%', marginLeft:-4, width:8, height:8, borderRadius:'50%', background:'#8b5cf6', boxShadow:'0 0 10px #8b5cf6' }} />
      </div>
      <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', border:'2px solid '+color+'15', animation:'ringRotate 20s linear infinite' }} />

      {/* 별 파티클들 */}
      {[
        {top:'12%',left:'18%',delay:'0s',size:22},
        {top:'18%',right:'15%',delay:'0.8s',size:16},
        {bottom:'22%',left:'12%',delay:'1.6s',size:18},
        {bottom:'14%',right:'18%',delay:'0.4s',size:20},
        {top:'45%',left:'8%',delay:'1.2s',size:14},
        {top:'40%',right:'8%',delay:'2s',size:16},
      ].map((s, i) => (
        <div key={i} style={{ position:'absolute', top:s.top, left:s.left, right:s.right, bottom:s.bottom, fontSize:s.size, animation:'starPop '+(2.5+i*0.3)+'s ease-in-out infinite', animationDelay:s.delay, filter:'drop-shadow(0 0 6px '+color+')' }}>✦</div>
      ))}

      {/* 캐릭터 본체 */}
      <div style={{ animation:'charFloat 4s ease-in-out infinite', position:'relative', zIndex:2 }}>
        {/* 외부 글로우 링 */}
        <div style={{ position:'absolute', inset:-20, borderRadius:'50%', background:'radial-gradient(circle, '+color+'22 0%, transparent 70%)', animation:'glowBreath 2.5s ease-in-out infinite' }} />
        {/* 메인 서클 */}
        <div style={{
          width:170, height:170, borderRadius:'50%',
          background:'linear-gradient(135deg, '+color+'25, '+color+'08)',
          border:'2px solid '+color+'50',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:84, position:'relative',
          boxShadow:'0 0 40px '+color+'44, 0 0 80px '+color+'22, inset 0 0 30px '+color+'11',
        }}>
          {emoji}
          {/* 내부 하이라이트 */}
          <div style={{ position:'absolute', top:12, left:20, width:40, height:20, borderRadius:'50%', background:'rgba(255,255,255,0.12)', transform:'rotate(-30deg)' }} />
        </div>
      </div>

      {/* 말풍선 */}
      <div style={{ marginTop:28, position:'relative', zIndex:2 }}>
        <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderBottom:'12px solid '+color+'40' }} />
        <div style={{
          background:'linear-gradient(135deg, '+color+'18, '+color+'08)',
          border:'1.5px solid '+color+'40',
          borderRadius:20, padding:'16px 24px',
          textAlign:'center',
          boxShadow:'0 8px 32px '+color+'20',
          backdropFilter:'blur(10px)',
        }}>
          <div style={{ fontSize:14, fontWeight:900, color, lineHeight:1.8, whiteSpace:'pre-line', textShadow:'0 0 20px '+color+'66' }}>{label}</div>
        </div>
      </div>

      {/* 하단 파티클 */}
      {[{left:'30%',delay:'0s'},{left:'50%',delay:'1s'},{left:'70%',delay:'2s'}].map((p, i) => (
        <div key={i} style={{ position:'absolute', bottom:'15%', left:p.left, width:4, height:4, borderRadius:'50%', background:color, animation:'particleDrift 3s ease-in-out infinite', animationDelay:p.delay, boxShadow:'0 0 8px '+color }} />
      ))}
    </div>
  )
}
