'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signIn } from '@/lib/auth'

type Theme = 'dark' | 'light' | 'yellow'

const THEMES = {
  dark:   { bg: '#050510', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#f0f0ff', muted: '#44446a', input: 'rgba(255,255,255,0.06)' },
  light:  { bg: '#f0f2ff', card: 'rgba(255,255,255,0.9)',  border: 'rgba(0,0,0,0.08)',       text: '#1a1a2e', muted: '#9999bb', input: 'rgba(255,255,255,0.8)' },
  yellow: { bg: '#0a0900', card: 'rgba(255,215,0,0.06)',   border: 'rgba(255,215,0,0.15)',    text: '#fff8dc', muted: '#aa9900', input: 'rgba(255,215,0,0.06)' },
}

const BUSINESS_TYPES = ['음식점/카페', '소매업/편의점', '온라인 쇼핑몰', '제조업', '서비스업', '뷰티/미용', '학원/교육', '의류/패션', '농업/축산', '기타']
const REGIONS = ['서울', '부산', '인천', '대구', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

export default function SignupPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Step 2
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [region, setRegion] = useState('')

  const T = THEMES[theme]
  const ACCENT = '#ff6b35'

  useEffect(() => {
    try {
      const t = localStorage.getItem('storeauto_theme') as Theme
      if (t && THEMES[t]) setTheme(t)
    } catch (_e) { /* ignore */ }
  }, [])

  const saveTheme = (t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('storeauto_theme', t) } catch (_e) { /* ignore */ }
  }

  const handleStep1 = () => {
    if (!email || !password || !password2) { setError('모든 항목을 입력해주세요'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('올바른 이메일 형식이 아니에요'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이에요'); return }
    if (password !== password2) { setError('비밀번호가 일치하지 않아요'); return }
    setError(''); setStep(2)
  }

  const handleSignup = async () => {
    if (!name) { setError('이름을 입력해주세요'); return }
    setLoading(true); setError('')
    try {
      await signUp(email, password)
      // 가입 후 바로 로그인
      await signIn(email, password)
      // 프로필 저장은 mypage에서 처리
      try {
        const session = JSON.parse(localStorage.getItem('sa_session') || '{}')
        if (session.id) {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ id: session.id, email, name, business_name: businessName, phone, business_type: businessType, region }),
          })
        }
      } catch (_e) { /* ignore profile save error */ }
      router.push('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '회원가입 실패')
    } finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.input, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: '13px 18px', color: T.text,
    fontSize: 15, outline: 'none', fontFamily: "'Noto Sans KR',sans-serif",
    transition: 'all 0.2s',
  }

  const progressW = step === 1 ? '50%' : '100%'

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: "'Noto Sans KR',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes glow   { 0%,100%{opacity:0.25} 50%{opacity:0.6} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder, select::placeholder { color: ${T.muted}; }
        select option { background: #1a1a2e; }
        * { box-sizing: border-box; }
      `}</style>

      {/* 배경 글로우 */}
      {[{c:'rgba(16,185,129,0.07)',t:'10%',l:'65%',s:500},{c:'rgba(59,130,246,0.06)',t:'55%',l:'3%',s:450}].map((o,i) => (
        <div key={i} style={{ position:'absolute', width:o.s, height:o.s, borderRadius:'50%', background:o.c, top:o.t, left:o.l, filter:'blur(80px)', animation:`glow ${4+i}s ease-in-out infinite`, pointerEvents:'none' }} />
      ))}

      {/* 테마 버튼 */}
      <div style={{ position:'fixed', top:20, right:20, display:'flex', gap:8, zIndex:100 }}>
        {(['dark','light','yellow'] as Theme[]).map(t => (
          <button key={t} onClick={() => saveTheme(t)} style={{ width:36, height:36, borderRadius:'50%', border:`2px solid ${theme===t ? ACCENT : 'transparent'}`, cursor:'pointer', fontSize:18, background:t==='dark'?'#1a1a2e':t==='light'?'#e8eaff':'#1a1600', boxShadow:theme===t?`0 0 14px ${ACCENT}88`:'' }}>
            {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
          </button>
        ))}
      </div>

      {/* 왼쪽 캐릭터 (PC) */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, position:'relative' }} className="pc-only">
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="50%" cy="50%" rx="40%" ry="40%" fill="url(#rg2)" style={{ animation:'glow 3.5s ease-in-out infinite' }} />
          {Array.from({length:6}).map((_,i) => (
            <line key={i} x1={`${i*17}%`} y1="0" x2={`${i*17}%`} y2="100%" stroke="#10b981" strokeOpacity="0.04" strokeWidth="1" />
          ))}
        </svg>

        <div style={{ animation:'float 4.5s ease-in-out infinite', position:'relative', zIndex:2 }}>
          <div style={{ width:180, height:180, borderRadius:'50%', background:'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.05))', border:'2px solid rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:90, boxShadow:'0 0 60px rgba(16,185,129,0.3)' }}>
            🎉
            <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'1px dashed rgba(16,185,129,0.2)', animation:'spin 15s linear infinite' }} />
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:28, position:'relative', zIndex:2 }}>
          <div style={{ fontSize:26, fontWeight:900, color:T.text, marginBottom:8 }}>환영해요! 🎊</div>
          <div style={{ fontSize:14, color:T.muted, lineHeight:1.8 }}>
            소상공인 맞춤 AI 도구를<br />무료로 시작해보세요
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:20 }}>
            {['✅ 상세페이지 AI 자동 생성', '✅ 리뷰 답글 자동화', '✅ 정부지원금 AI 상담', '✅ 맞춤 지원사업 추천'].map((f,i) => (
              <div key={i} style={{ fontSize:13, color:'#10b981', fontWeight:700 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 폼 */}
      <div style={{ width:'100%', maxWidth:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 24px', position:'relative', zIndex:10 }}>
        <div style={{ width:'100%', animation:'fadeUp 0.5s ease' }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:28, padding:'36px 32px', backdropFilter:'blur(30px)', boxShadow:'0 40px 80px rgba(0,0,0,0.4)' }}>

            {/* 헤더 */}
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,#10b981,#3b82f6)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 10px', boxShadow:'0 0 24px rgba(16,185,129,0.4)' }}>✨</div>
              <div style={{ fontSize:20, fontWeight:900, color:T.text }}>회원가입</div>
            </div>

            {/* 진행바 */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                {['기본 정보', '사업자 정보'].map((s,i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:700, color:step > i ? ACCENT : T.muted }}>{i+1}. {s}</span>
                ))}
              </div>
              <div style={{ height:4, background:T.border, borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:progressW, background:`linear-gradient(90deg,${ACCENT},#ffd700)`, borderRadius:4, transition:'width 0.4s ease' }} />
              </div>
            </div>

            {step === 1 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeUp 0.3s ease' }}>
                <div>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>이메일</div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
                <div>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>비밀번호 (6자 이상)</div>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 입력" style={{ ...inputStyle, paddingRight:50 }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                    />
                    <button onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:T.muted }}>{showPw?'🙈':'👁️'}</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>비밀번호 확인</div>
                  <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStep1()} placeholder="비밀번호 재입력" style={{ ...inputStyle, borderColor:password2 && password !== password2 ? '#ef4444' : T.border }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = password2 && password !== password2 ? '#ef4444' : T.border }}
                  />
                  {password2 && password !== password2 && <div style={{ fontSize:12, color:'#f87171', marginTop:4 }}>비밀번호가 일치하지 않아요</div>}
                </div>
                {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:13, color:'#f87171' }}>⚠️ {error}</div>}
                <button onClick={handleStep1} style={{ width:'100%', padding:15, background:`linear-gradient(135deg,${ACCENT},#ff8c5a)`, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:900, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 6px 24px ${ACCENT}44`, marginTop:4 }}>
                  다음 →
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeUp 0.3s ease' }}>
                <div>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>이름 <span style={{ color:ACCENT }}>*</span></div>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
                <div>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>상호명 (선택)</div>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="OO마트, OO카페" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
                <div>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>연락처 (선택)</div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>업종 (선택)</div>
                    <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                      <option value="">선택</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:7 }}>지역 (선택)</div>
                    <select value={region} onChange={e => setRegion(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                      <option value="">선택</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, padding:'10px 12px', background:`${T.input}`, borderRadius:10, border:`1px solid ${T.border}` }}>
                  💡 업종과 지역 정보를 입력하면 맞춤 정부지원금을 추천해드려요!
                </div>
                {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:13, color:'#f87171' }}>⚠️ {error}</div>}
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setStep(1); setError('') }} style={{ flex:1, padding:14, background:'transparent', border:`1px solid ${T.border}`, borderRadius:14, color:T.muted, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>← 이전</button>
                  <button onClick={handleSignup} disabled={loading} style={{ flex:2, padding:14, background:`linear-gradient(135deg,#10b981,#3b82f6)`, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:900, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', opacity:loading?0.7:1, boxShadow:'0 6px 24px rgba(16,185,129,0.4)' }}>
                    {loading ? '가입 중...' : '🎉 가입 완료!'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:T.muted }}>
              이미 계정이 있으신가요?{' '}
              <button onClick={() => router.push('/login')} style={{ background:'none', border:'none', color:ACCENT, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>로그인</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .pc-only { display: none !important; } }
      `}</style>
    </div>
  )
}

