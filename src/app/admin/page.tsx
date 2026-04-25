'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseQuery } from '@/lib/supabase'

type Tab = 'keys' | 'popup' | 'gov' | 'password'

interface Popup {
  id?: string
  title: string
  content: string
  type: 'info' | 'warning' | 'event' | 'notice'
  active: boolean
  bg_color: string
  text_color: string
}

interface GovData {
  id?: string
  region: string
  category: string
  title: string
  content: string
}

const ADMIN_PW_KEY = 'storeauto_admin_pw'
const DEFAULT_PW = 'admin1234'

const TAB_CONFIG: { key: Tab; icon: string; label: string }[] = [
  { key: 'keys', icon: '🔑', label: 'API 키' },
  { key: 'popup', icon: '📢', label: '팝업' },
  { key: 'gov', icon: '🏛️', label: '정부지원' },
  { key: 'password', icon: '🔒', label: '비밀번호' },
]

const REGIONS = ['전국', '서울', '부산', '인천', '대구', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
const GOV_CATS = ['지자체지원금', '정책자금', '무상지원', '창업지원', '기타']
const POPUP_TYPES: { key: Popup['type']; label: string; color: string }[] = [
  { key: 'info', label: '정보', color: '#3b82f6' },
  { key: 'notice', label: '공지', color: '#f59e0b' },
  { key: 'event', label: '이벤트', color: '#10b981' },
  { key: 'warning', label: '경고', color: '#ef4444' },
]

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [tab, setTab] = useState<Tab>('keys')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  // 키 관리
  const [geminiKey, setGeminiKey] = useState('')
  const [datalabId, setDatalabId] = useState('')
  const [datalabSecret, setDatalabSecret] = useState('')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  // 팝업 관리
  const [popups, setPopups] = useState<Popup[]>([])
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const [newPopup, setNewPopup] = useState<Popup>({ title: '', content: '', type: 'notice', active: true, bg_color: '#1c1c28', text_color: '#f0f0f5' })

  // 정부지원 관리
  const [govData, setGovData] = useState<GovData[]>([])
  const [newGov, setNewGov] = useState<GovData>({ region: '전국', category: '지자체지원금', title: '', content: '' })

  // 비밀번호 변경
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const login = () => {
    const stored = localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW
    if (pw === stored) {
      setAuthed(true)
      loadAll()
    } else {
      setPwError('비밀번호가 틀렸어요')
      setTimeout(() => setPwError(''), 2000)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      // 키 로드
      const configs = await supabaseQuery('admin_config', 'GET', undefined, 'select=key,value')
      if (Array.isArray(configs)) {
        configs.forEach((c: { key: string; value: string }) => {
          if (c.key === 'gemini_key') setGeminiKey(c.value || '')
          if (c.key === 'datalab_id') setDatalabId(c.value || '')
          if (c.key === 'datalab_secret') setDatalabSecret(c.value || '')
        })
      }
      // 팝업 로드
      const pops = await supabaseQuery('popups', 'GET', undefined, 'order=created_at.desc')
      if (Array.isArray(pops)) setPopups(pops)
      // 정부지원 로드
      const govs = await supabaseQuery('gov_support', 'GET', undefined, 'order=created_at.desc')
      if (Array.isArray(govs)) setGovData(govs)
    } catch (_e) { /* ignore */ }
    setLoading(false)
  }

  const saveConfig = async (key: string, value: string) => {
    await supabaseQuery('admin_config', 'POST', { key, value }, 'on_conflict=key')
  }

  const saveKeys = async () => {
    setLoading(true)
    try {
      await saveConfig('gemini_key', geminiKey)
      await saveConfig('datalab_id', datalabId)
      await saveConfig('datalab_secret', datalabSecret)
      // localStorage에도 저장 (이 디바이스에서 바로 사용)
      const saved = JSON.parse(localStorage.getItem('storeauto_keys') || '{}')
      localStorage.setItem('storeauto_keys', JSON.stringify({ ...saved, gemini: geminiKey }))
      showToast('✅ 키 저장 완료!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setLoading(false)
  }

  const savePopup = async () => {
    if (!newPopup.title || !newPopup.content) return
    setLoading(true)
    try {
      const result = await supabaseQuery('popups', 'POST', newPopup)
      if (Array.isArray(result) && result[0]) setPopups([result[0], ...popups])
      setNewPopup({ title: '', content: '', type: 'notice', active: true, bg_color: '#1c1c28', text_color: '#f0f0f5' })
      showToast('✅ 팝업 저장!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setLoading(false)
  }

  const togglePopup = async (popup: Popup) => {
    try {
      await supabaseQuery('popups', 'PATCH', { active: !popup.active }, 'id=eq.' + popup.id)
      setPopups(popups.map((p) => p.id === popup.id ? { ...p, active: !p.active } : p))
    } catch (_e) { showToast('❌ 오류') }
  }

  const deletePopup = async (id: string) => {
    try {
      await supabaseQuery('popups', 'DELETE', undefined, 'id=eq.' + id)
      setPopups(popups.filter((p) => p.id !== id))
      showToast('🗑️ 삭제 완료')
    } catch (_e) { showToast('❌ 오류') }
  }

  const saveGov = async () => {
    if (!newGov.title || !newGov.content) return
    setLoading(true)
    try {
      const result = await supabaseQuery('gov_support', 'POST', newGov)
      if (Array.isArray(result) && result[0]) setGovData([result[0], ...govData])
      setNewGov({ region: '전국', category: '지자체지원금', title: '', content: '' })
      showToast('✅ 등록 완료!')
    } catch (_e) { showToast('❌ 저장 실패') }
    setLoading(false)
  }

  const deleteGov = async (id: string) => {
    try {
      await supabaseQuery('gov_support', 'DELETE', undefined, 'id=eq.' + id)
      setGovData(govData.filter((g) => g.id !== id))
      showToast('🗑️ 삭제 완료')
    } catch (_e) { showToast('❌ 오류') }
  }

  const changePw = () => {
    const stored = localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW
    if (oldPw !== stored) { showToast('❌ 현재 비밀번호가 틀렸어요'); return }
    if (newPw.length < 4) { showToast('❌ 새 비밀번호는 4자 이상'); return }
    if (newPw !== newPw2) { showToast('❌ 새 비밀번호가 일치하지 않아요'); return }
    localStorage.setItem(ADMIN_PW_KEY, newPw)
    setOldPw(''); setNewPw(''); setNewPw2('')
    showToast('✅ 비밀번호 변경 완료!')
  }

  // 로그인 화면
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080810',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Noto Sans KR', sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
          @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
          * { box-sizing: border-box; }
          input::placeholder { color: #555; }
        `}</style>

        {/* 배경 오브 */}
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: [400, 300, 250][i] + 'px', height: [400, 300, 250][i] + 'px',
            borderRadius: '50%',
            background: ['rgba(255,107,53,0.06)', 'rgba(255,215,0,0.04)', 'rgba(255,107,53,0.03)'][i],
            top: ['10%', '60%', '30%'][i], left: ['60%', '10%', '40%'][i],
            filter: 'blur(60px)',
            animation: 'pulse ' + [4, 6, 5][i] + 's ease-in-out infinite',
            animationDelay: i * 1.5 + 's',
          }} />
        ))}

        <div style={{
          width: '100%', maxWidth: '380px', padding: '0 20px',
          position: 'relative', zIndex: 1,
          animation: 'float 6s ease-in-out infinite',
        }}>
          {/* 로고 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '20px',
              background: 'linear-gradient(135deg, #ff6b35, #ffd700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 16px',
              boxShadow: '0 0 40px rgba(255,107,53,0.4)',
            }}>⚙️</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#f0f0f5', letterSpacing: '-0.5px' }}>관리자 패널</div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>STORE AUTO ADMIN</div>
          </div>

          {/* 카드 */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', letterSpacing: '1px' }}>PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login()}
                  placeholder="비밀번호 입력"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (pwError ? '#ef4444' : 'rgba(255,255,255,0.1)'),
                    borderRadius: '12px', padding: '14px 16px',
                    color: '#f0f0f5', fontSize: '16px', outline: 'none',
                    animation: pwError ? 'shake 0.4s ease' : 'none',
                    letterSpacing: '4px',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
              {pwError && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{pwError}</div>}
            </div>

            <button onClick={login} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(255,107,53,0.4)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
              onMouseDown={(e) => { (e.target as HTMLElement).style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
            >로그인</button>

            <button onClick={() => router.push('/')} style={{
              width: '100%', padding: '12px', marginTop: '10px',
              background: 'transparent', border: 'none',
              color: '#444', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            }}>← 메인으로</button>
          </div>
        </div>
      </div>
    )
  }

  // 관리자 대시보드
  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      color: '#f0f0f5', fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #444; }
        select option { background: #1c1c28; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 700,
          backdropFilter: 'blur(20px)', animation: 'toastIn 0.3s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>{toast}</div>
      )}

      {/* 헤더 */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff6b35, #ffd700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            boxShadow: '0 0 20px rgba(255,107,53,0.3)',
          }}>⚙️</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.3px' }}>관리자 패널</div>
            <div style={{ fontSize: '11px', color: '#444' }}>STORE AUTO</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/')} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#888', borderRadius: '8px', padding: '6px 12px',
            cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
          }}>메인</button>
          <button onClick={() => setAuthed(false)} style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', borderRadius: '8px', padding: '6px 12px',
            cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
          }}>로그아웃</button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* 사이드바 */}
        <div style={{
          width: '200px', flexShrink: 0,
          background: 'rgba(255,255,255,0.01)', borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '24px 12px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {TAB_CONFIG.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px 14px', borderRadius: '10px', cursor: 'pointer',
              border: 'none', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700,
              background: tab === t.key ? 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,215,0,0.08))' : 'transparent',
              color: tab === t.key ? '#ff6b35' : '#555',
              borderLeft: tab === t.key ? '2px solid #ff6b35' : '2px solid transparent',
              transition: 'all 0.2s', textAlign: 'left', width: '100%',
            }}>
              <span style={{ fontSize: '18px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', animation: 'fadeIn 0.3s ease' }}>
          {/* API 키 관리 */}
          {tab === 'keys' && (
            <Section title="🔑 API 키 관리" desc="Supabase에 저장되어 모든 기기에서 동기화됩니다">
              <KeyField label="Gemini API 키" value={geminiKey} onChange={setGeminiKey} id="gemini" showKeys={showKeys} setShowKeys={setShowKeys} placeholder="AIza..." badge="무료" badgeColor="#10b981" />
              <KeyField label="네이버 데이터랩 Client ID" value={datalabId} onChange={setDatalabId} id="datalabId" showKeys={showKeys} setShowKeys={setShowKeys} placeholder="Client ID" />
              <KeyField label="네이버 데이터랩 Client Secret" value={datalabSecret} onChange={setDatalabSecret} id="datalabSecret" showKeys={showKeys} setShowKeys={setShowKeys} placeholder="Client Secret" />
              <SaveButton onClick={saveKeys} loading={loading} />
              <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', fontSize: '13px', color: '#10b981', lineHeight: 1.6 }}>
                💡 Gemini 키는 이 기기의 localStorage에도 자동 저장되어 즉시 사용 가능해요.<br />
                다른 기기에서는 /admin 페이지 로그인 후 저장 버튼을 눌러주세요.
              </div>
            </Section>
          )}

          {/* 팝업 관리 */}
          {tab === 'popup' && (
            <Section title="📢 팝업 관리" desc="사이트 방문자에게 표시될 팝업을 관리합니다">
              {/* 새 팝업 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff6b35', marginBottom: '16px' }}>+ 새 팝업 등록</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {POPUP_TYPES.map((t) => (
                    <button key={t.key} onClick={() => setNewPopup({ ...newPopup, type: t.key })} style={{
                      padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '12px', fontWeight: 700, border: 'none',
                      background: newPopup.type === t.key ? t.color : 'rgba(255,255,255,0.05)',
                      color: newPopup.type === t.key ? 'white' : '#666',
                      transition: 'all 0.2s',
                    }}>{t.label}</button>
                  ))}
                </div>
                <AdminInput placeholder="팝업 제목" value={newPopup.title} onChange={(v) => setNewPopup({ ...newPopup, title: v })} />
                <AdminTextarea placeholder="팝업 내용 (링크, 안내사항 등)" value={newPopup.content} onChange={(v) => setNewPopup({ ...newPopup, content: v })} />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>배경색</label>
                  <input type="color" value={newPopup.bg_color} onChange={(e) => setNewPopup({ ...newPopup, bg_color: e.target.value })}
                    style={{ width: '36px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <label style={{ fontSize: '12px', color: '#666' }}>글자색</label>
                  <input type="color" value={newPopup.text_color} onChange={(e) => setNewPopup({ ...newPopup, text_color: e.target.value })}
                    style={{ width: '36px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <SaveButton onClick={savePopup} loading={loading} label="팝업 등록" />
                </div>
              </div>

              {/* 팝업 목록 */}
              {popups.length === 0 && <EmptyState text="등록된 팝업이 없어요" />}
              {popups.map((p) => (
                <div key={p.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid ' + (p.active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'),
                  borderRadius: '14px', padding: '16px 18px', marginBottom: '10px',
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{p.title}</span>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700,
                        background: POPUP_TYPES.find(t => t.key === p.type)?.color + '22',
                        color: POPUP_TYPES.find(t => t.key === p.type)?.color,
                      }}>{POPUP_TYPES.find(t => t.key === p.type)?.label}</span>
                      <span style={{ fontSize: '11px', color: p.active ? '#10b981' : '#555', fontWeight: 700 }}>{p.active ? '● 활성' : '○ 비활성'}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <IconBtn onClick={() => togglePopup(p)} title={p.active ? '비활성화' : '활성화'}>{p.active ? '⏸' : '▶'}</IconBtn>
                    <IconBtn onClick={() => p.id && deletePopup(p.id)} title="삭제" danger>🗑</IconBtn>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* 정부지원 데이터 */}
          {tab === 'gov' && (
            <Section title="🏛️ 정부지원 데이터" desc="챗봇이 우선 참고하는 지원정보를 등록합니다">
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff6b35', marginBottom: '14px' }}>+ 새 지원정보 등록</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <AdminSelect value={newGov.region} onChange={(v) => setNewGov({ ...newGov, region: v })} options={REGIONS} />
                  <AdminSelect value={newGov.category} onChange={(v) => setNewGov({ ...newGov, category: v })} options={GOV_CATS} />
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <AdminInput placeholder="지원사업명" value={newGov.title} onChange={(v) => setNewGov({ ...newGov, title: v })} />
                  </div>
                </div>
                <AdminTextarea placeholder="지원 내용, 신청 방법, 금액, 대상, URL 등" value={newGov.content} onChange={(v) => setNewGov({ ...newGov, content: v })} />
                <div style={{ marginTop: '8px' }}>
                  <SaveButton onClick={saveGov} loading={loading} label="등록" />
                </div>
              </div>

              {govData.length === 0 && <EmptyState text="등록된 지원정보가 없어요" />}
              {govData.map((g) => (
                <div key={g.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px', padding: '14px 16px', marginBottom: '8px',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,107,53,0.15)', color: '#ff6b35', fontWeight: 700 }}>{g.region}</span>
                      <span style={{ fontSize: '11px', color: '#555', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}>{g.category}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{g.title}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.content}</div>
                  </div>
                  <IconBtn onClick={() => g.id && deleteGov(g.id)} title="삭제" danger>🗑</IconBtn>
                </div>
              ))}
            </Section>
          )}

          {/* 비밀번호 변경 */}
          {tab === 'password' && (
            <Section title="🔒 비밀번호 변경" desc="관리자 페이지 로그인 비밀번호를 변경합니다">
              <div style={{ maxWidth: '400px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' }}>현재 비밀번호</div>
                  <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="현재 비밀번호"
                    style={adminInputStyle} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' }}>새 비밀번호</div>
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호 (4자 이상)"
                    style={adminInputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' }}>새 비밀번호 확인</div>
                  <input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} placeholder="새 비밀번호 재입력"
                    style={adminInputStyle} />
                </div>
                <SaveButton onClick={changePw} loading={false} label="비밀번호 변경" />
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#444', lineHeight: 1.6 }}>
                  ⚠️ 비밀번호는 이 기기(localStorage)에 저장됩니다.<br />
                  초기 비밀번호: admin1234
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

// 서브 컴포넌트들
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#444' }}>{desc}</div>
      </div>
      {children}
    </div>
  )
}

function KeyField({ label, value, onChange, id, showKeys, setShowKeys, placeholder, badge, badgeColor }: {
  label: string; value: string; onChange: (v: string) => void; id: string
  showKeys: Record<string, boolean>; setShowKeys: (v: Record<string, boolean>) => void
  placeholder: string; badge?: string; badgeColor?: string
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.3px' }}>{label}</span>
        {badge && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: (badgeColor || '#10b981') + '22', color: badgeColor || '#10b981', fontWeight: 700 }}>{badge}</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={showKeys[id] ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...adminInputStyle, paddingRight: '48px' }}
        />
        <button onClick={() => setShowKeys({ ...showKeys, [id]: !showKeys[id] })} style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', padding: '4px',
        }}>{showKeys[id] ? '🙈' : '👁️'}</button>
      </div>
    </div>
  )
}

function AdminInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...adminInputStyle, marginBottom: '0' }} />
  )
}

function AdminTextarea({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3}
      style={{ ...adminInputStyle, resize: 'vertical', marginTop: '8px' }} />
  )
}

function AdminSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...adminInputStyle, width: 'auto', cursor: 'pointer' }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function SaveButton({ onClick, loading, label = '저장' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: '10px 24px', background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)',
      border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px',
      fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      opacity: loading ? 0.6 : 1, boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
      transition: 'opacity 0.2s',
    }}>{loading ? '저장 중...' : label}</button>
  )
}

function IconBtn({ onClick, title, danger, children }: { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
      border: '1px solid ' + (danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'),
      color: danger ? '#ef4444' : '#888', borderRadius: '8px', padding: '6px 10px',
      cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s',
    }}>{children}</button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#333', fontSize: '14px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📭</div>
      {text}
    </div>
  )
}

const adminInputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
  padding: '11px 14px', color: '#f0f0f5', fontSize: '14px',
  outline: 'none', fontFamily: "'Noto Sans KR', sans-serif",
  transition: 'border-color 0.2s',
}

