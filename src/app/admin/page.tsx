'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseQuery } from '@/lib/supabase'

type Tab = 'keys' | 'popup' | 'gov' | 'password'

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
  { key: 'notice', label: '공지', color: '#f59e0b' },
  { key: 'info',   label: '정보', color: '#3b82f6' },
  { key: 'event',  label: '이벤트', color: '#10b981' },
  { key: 'warning',label: '경고', color: '#ef4444' },
]
const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'keys',     icon: '🔑', label: 'API 키' },
  { key: 'popup',    icon: '📢', label: '팝업' },
  { key: 'gov',      icon: '🏛️', label: '정부지원' },
  { key: 'password', icon: '🔒', label: '비밀번호' },
]

const iStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '11px 14px',
  color: '#f0f0f5',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Noto Sans KR', sans-serif",
}

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed]   = useState(false)
  const [pw, setPw]           = useState('')
  const [pwErr, setPwErr]     = useState('')
  const [tab, setTab]         = useState<Tab>('keys')
  const [busy, setBusy]       = useState(false)
  const [toast, setToast]     = useState('')

  const [gemini, setGemini]         = useState('')
  const [datalabId, setDatalabId]   = useState('')
  const [datalabSec, setDatalabSec] = useState('')
  const [showGemini, setShowGemini] = useState(false)
  const [showDlId, setShowDlId]     = useState(false)
  const [showDlSec, setShowDlSec]   = useState(false)

  const [popups, setPopups]     = useState<PopupItem[]>([])
  const [pTitle, setPTitle]     = useState('')
  const [pContent, setPContent] = useState('')
  const [pType, setPType]       = useState('notice')
  const [pBg, setPBg]           = useState('#1c1c28')
  const [pFg, setPFg]           = useState('#f0f0f5')

  const [govList, setGovList]     = useState<GovItem[]>([])
  const [gRegion, setGRegion]     = useState('전국')
  const [gCat, setGCat]           = useState('지자체지원금')
  const [gTitle, setGTitle]       = useState('')
  const [gContent, setGContent]   = useState('')

  const [oldPw, setOldPw]   = useState('')
  const [newPw1, setNewPw1] = useState('')
  const [newPw2, setNewPw2] = useState('')

  const msg = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2500) }

  const login = () => {
    const stored = localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW
    if (pw === stored) { setAuthed(true); loadAll() }
    else { setPwErr('비밀번호가 틀렸어요'); setTimeout(() => setPwErr(''), 2000) }
  }

  const loadAll = async () => {
    setBusy(true)
    try {
      const configs = await supabaseQuery('admin_config', 'GET', undefined, 'select=key,value') as Array<{ key: string; value: string }>
      if (Array.isArray(configs)) {
        configs.forEach((c) => {
          if (c.key === 'gemini_key')      setGemini(c.value || '')
          if (c.key === 'datalab_id')      setDatalabId(c.value || '')
          if (c.key === 'datalab_secret')  setDatalabSec(c.value || '')
        })
      }
      const pops = await supabaseQuery('popups', 'GET', undefined, 'order=created_at.desc') as PopupItem[]
      if (Array.isArray(pops)) setPopups(pops)
      const govs = await supabaseQuery('gov_support', 'GET', undefined, 'order=created_at.desc') as GovItem[]
      if (Array.isArray(govs)) setGovList(govs)
    } catch (_e) { /* ignore */ }
    setBusy(false)
  }

  const saveConfig = async (key: string, value: string) => {
    await supabaseQuery('admin_config', 'POST', { key, value }, 'on_conflict=key')
  }

  const saveKeys = async () => {
    setBusy(true)
    try {
      await saveConfig('gemini_key', gemini)
      await saveConfig('datalab_id', datalabId)
      await saveConfig('datalab_secret', datalabSec)
      const prev = JSON.parse(localStorage.getItem('storeauto_keys') || '{}') as Record<string, string>
      localStorage.setItem('storeauto_keys', JSON.stringify({ ...prev, gemini }))
      msg('✅ 키 저장 완료!')
    } catch (_e) { msg('❌ 저장 실패') }
    setBusy(false)
  }

  const addPopup = async () => {
    if (!pTitle || !pContent) return
    setBusy(true)
    try {
      const item = { title: pTitle, content: pContent, type: pType, active: true, bg_color: pBg, text_color: pFg }
      const res = await supabaseQuery('popups', 'POST', item) as PopupItem[]
      if (Array.isArray(res) && res[0]) setPopups([res[0], ...popups])
      setPTitle(''); setPContent('')
      msg('✅ 팝업 등록!')
    } catch (_e) { msg('❌ 저장 실패') }
    setBusy(false)
  }

  const togglePopup = async (p: PopupItem) => {
    try {
      await supabaseQuery('popups', 'PATCH', { active: !p.active }, 'id=eq.' + p.id)
      setPopups(popups.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))
    } catch (_e) { msg('❌ 오류') }
  }

  const delPopup = async (id: string) => {
    try {
      await supabaseQuery('popups', 'DELETE', undefined, 'id=eq.' + id)
      setPopups(popups.filter((p) => p.id !== id))
      msg('🗑️ 삭제')
    } catch (_e) { msg('❌ 오류') }
  }

  const addGov = async () => {
    if (!gTitle || !gContent) return
    setBusy(true)
    try {
      const item = { region: gRegion, category: gCat, title: gTitle, content: gContent }
      const res = await supabaseQuery('gov_support', 'POST', item) as GovItem[]
      if (Array.isArray(res) && res[0]) setGovList([res[0], ...govList])
      setGTitle(''); setGContent('')
      msg('✅ 등록 완료!')
    } catch (_e) { msg('❌ 저장 실패') }
    setBusy(false)
  }

  const delGov = async (id: string) => {
    try {
      await supabaseQuery('gov_support', 'DELETE', undefined, 'id=eq.' + id)
      setGovList(govList.filter((g) => g.id !== id))
      msg('🗑️ 삭제')
    } catch (_e) { msg('❌ 오류') }
  }

  const changePw = () => {
    const stored = localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW
    if (oldPw !== stored) { msg('❌ 현재 비밀번호 틀림'); return }
    if (newPw1.length < 4) { msg('❌ 4자 이상 입력'); return }
    if (newPw1 !== newPw2) { msg('❌ 비밀번호 불일치'); return }
    localStorage.setItem(ADMIN_PW_KEY, newPw1)
    setOldPw(''); setNewPw1(''); setNewPw2('')
    msg('✅ 비밀번호 변경 완료!')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Enter' && !authed) login() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // ── 로그인 화면 ─────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
          @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(255,107,53,0.3)} 50%{box-shadow:0 0 60px rgba(255,107,53,0.5)} }
          @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
          input::placeholder{color:#444}
          *{box-sizing:border-box}
        `}</style>
        <div style={{ width: '100%', maxWidth: '360px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: 68, height: 68, borderRadius: '20px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg,#ff6b35,#ffd700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px',
              animation: 'glow 3s ease-in-out infinite',
            }}>⚙️</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f0f0f5' }}>관리자 패널</div>
            <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>STORE AUTO ADMIN</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(20px)' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '8px' }}>PASSWORD</div>
              <input
                type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="비밀번호 입력" style={{ ...iStyle, letterSpacing: '4px', animation: pwErr ? 'shake 0.4s ease' : 'none', borderColor: pwErr ? '#ef4444' : 'rgba(255,255,255,0.08)' }}
              />
              {pwErr && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{pwErr}</div>}
            </div>
            <button onClick={login} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#ff6b35,#ff8c5a)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(255,107,53,0.35)' }}>
              로그인
            </button>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'transparent', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← 메인으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 대시보드 ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0f0f5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:translateX(0)}}
        input::placeholder,textarea::placeholder{color:#444}
        select option{background:#1c1c28}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 700, backdropFilter: 'blur(20px)', animation: 'toastIn 0.3s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'linear-gradient(135deg,#ff6b35,#ffd700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 0 16px rgba(255,107,53,0.3)' }}>⚙️</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900 }}>관리자 패널</div>
            <div style={{ fontSize: '10px', color: '#444' }}>STORE AUTO</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>메인</button>
          <button onClick={() => setAuthed(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>로그아웃</button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
        {/* 사이드바 */}
        <div style={{ width: '180px', flexShrink: 0, background: 'rgba(255,255,255,0.01)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
              border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, textAlign: 'left', width: '100%',
              background: tab === t.key ? 'rgba(255,107,53,0.12)' : 'transparent',
              color: tab === t.key ? '#ff6b35' : '#555',
              borderLeft: tab === t.key ? '2px solid #ff6b35' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '16px' }}>{t.icon}</span>{t.label}
            </button>
          ))}
          {busy && <div style={{ fontSize: '11px', color: '#444', textAlign: 'center', marginTop: '12px' }}>로딩 중...</div>}
        </div>

        {/* 컨텐츠 */}
        <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto', animation: 'fadeIn 0.25s ease' }}>

          {/* ── API 키 ── */}
          {tab === 'keys' && (
            <div>
              <SectionHead title="🔑 API 키 관리" desc="Supabase에 저장 → 모든 기기 자동 동기화" />
              <div style={{ maxWidth: '480px' }}>
                <KField label="Gemini API 키" badge="무료" badgeColor="#10b981" value={gemini} onChange={setGemini} show={showGemini} onToggle={() => setShowGemini(!showGemini)} placeholder="AIza..." />
                <KField label="네이버 데이터랩 Client ID" value={datalabId} onChange={setDatalabId} show={showDlId} onToggle={() => setShowDlId(!showDlId)} placeholder="Client ID" />
                <KField label="네이버 데이터랩 Client Secret" value={datalabSec} onChange={setDatalabSec} show={showDlSec} onToggle={() => setShowDlSec(!showDlSec)} placeholder="Client Secret" />
                <Btn onClick={saveKeys} busy={busy} label="저장" />
                <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', fontSize: '12px', color: '#10b981', lineHeight: 1.7 }}>
                  💡 Gemini 키는 이 기기 localStorage에도 자동 저장돼요.<br />다른 기기에선 /admin 로그인 후 저장 버튼 누르세요.
                </div>
              </div>
            </div>
          )}

          {/* ── 팝업 ── */}
          {tab === 'popup' && (
            <div>
              <SectionHead title="📢 팝업 관리" desc="사이트 방문자에게 표시할 팝업을 관리합니다" />
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b35', marginBottom: '12px' }}>+ 새 팝업 등록</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {POPUP_TYPES.map((t) => (
                    <button key={t.key} onClick={() => setPType(t.key)} style={{ padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, border: 'none', background: pType === t.key ? t.color : 'rgba(255,255,255,0.05)', color: pType === t.key ? 'white' : '#555', transition: 'all 0.15s' }}>{t.label}</button>
                  ))}
                </div>
                <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="팝업 제목" style={{ ...iStyle, marginBottom: '8px' }} />
                <textarea value={pContent} onChange={(e) => setPContent(e.target.value)} placeholder="팝업 내용 (링크, 공지 등)" rows={3} style={{ ...iStyle, resize: 'vertical', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '12px', color: '#555' }}>배경</label>
                  <input type="color" value={pBg} onChange={(e) => setPBg(e.target.value)} style={{ width: '32px', height: '26px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                  <label style={{ fontSize: '12px', color: '#555' }}>글자</label>
                  <input type="color" value={pFg} onChange={(e) => setPFg(e.target.value)} style={{ width: '32px', height: '26px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                  <Btn onClick={addPopup} busy={busy} label="등록" />
                </div>
              </div>
              {popups.length === 0 && <Empty />}
              {popups.map((p) => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid ' + (p.active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'), borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{p.title}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: (POPUP_TYPES.find((t) => t.key === p.type)?.color || '#888') + '22', color: POPUP_TYPES.find((t) => t.key === p.type)?.color || '#888', fontWeight: 700 }}>{POPUP_TYPES.find((t) => t.key === p.type)?.label}</span>
                      <span style={{ fontSize: '11px', color: p.active ? '#10b981' : '#555', fontWeight: 700 }}>{p.active ? '● 활성' : '○ 비활성'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <IBtn onClick={() => togglePopup(p)}>{p.active ? '⏸' : '▶'}</IBtn>
                    <IBtn danger onClick={() => p.id && delPopup(p.id)}>🗑</IBtn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 정부지원 ── */}
          {tab === 'gov' && (
            <div>
              <SectionHead title="🏛️ 정부지원 데이터" desc="챗봇이 우선 참고하는 지원정보를 등록합니다" />
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b35', marginBottom: '12px' }}>+ 새 지원정보 등록</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <Sel value={gRegion} onChange={setGRegion} options={REGIONS} />
                  <Sel value={gCat} onChange={setGCat} options={GOV_CATS} />
                  <input value={gTitle} onChange={(e) => setGTitle(e.target.value)} placeholder="지원사업명" style={{ ...iStyle, flex: 1, minWidth: '140px' }} />
                </div>
                <textarea value={gContent} onChange={(e) => setGContent(e.target.value)} placeholder="지원 내용, 신청 방법, 금액, 대상, URL 등" rows={3} style={{ ...iStyle, resize: 'vertical', marginBottom: '10px' }} />
                <Btn onClick={addGov} busy={busy} label="등록" />
              </div>
              {govList.length === 0 && <Empty />}
              {govList.map((g) => (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,107,53,0.15)', color: '#ff6b35', fontWeight: 700 }}>{g.region}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#666' }}>{g.category}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{g.title}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.content}</div>
                  </div>
                  <IBtn danger onClick={() => g.id && delGov(g.id)}>🗑</IBtn>
                </div>
              ))}
            </div>
          )}

          {/* ── 비밀번호 ── */}
          {tab === 'password' && (
            <div>
              <SectionHead title="🔒 비밀번호 변경" desc="관리자 페이지 로그인 비밀번호를 변경합니다" />
              <div style={{ maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <PwField label="현재 비밀번호" value={oldPw} onChange={setOldPw} />
                <PwField label="새 비밀번호 (4자 이상)" value={newPw1} onChange={setNewPw1} />
                <PwField label="새 비밀번호 확인" value={newPw2} onChange={setNewPw2} />
                <Btn onClick={changePw} busy={false} label="비밀번호 변경" />
                <div style={{ fontSize: '12px', color: '#444', lineHeight: 1.7 }}>⚠️ 비밀번호는 이 기기(localStorage)에 저장됩니다.<br />초기 비밀번호: admin1234</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#444' }}>{desc}</div>
    </div>
  )
}

function KField({ label, badge, badgeColor, value, onChange, show, onToggle, placeholder }: {
  label: string; badge?: string; badgeColor?: string
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; placeholder: string
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#777', letterSpacing: '0.3px' }}>{label}</span>
        {badge && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: (badgeColor || '#10b981') + '22', color: badgeColor || '#10b981', fontWeight: 700 }}>{badge}</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...iStyle, paddingRight: '44px' }} />
        <button onClick={onToggle} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '15px', padding: '4px' }}>{show ? '🙈' : '👁️'}</button>
      </div>
    </div>
  )
}

function PwField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <input type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} style={iStyle} />
    </div>
  )
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...iStyle, width: 'auto', cursor: 'pointer' }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Btn({ onClick, busy, label }: { onClick: () => void; busy: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={busy} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#ff6b35,#ff8c5a)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1, boxShadow: '0 4px 14px rgba(255,107,53,0.3)', transition: 'opacity 0.2s' }}>
      {busy ? '처리 중...' : label}
    </button>
  )
}

function IBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'), color: danger ? '#ef4444' : '#888', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s' }}>
      {children}
    </button>
  )
}

function Empty() {
  return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#333', fontSize: '14px' }}>
      <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>📭</div>
      등록된 항목이 없어요
    </div>
  )
}
