'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, resetPassword, loadSession } from '@/lib/auth'

type Theme = 'dark' | 'light' | 'yellow'
type Mode = 'login' | 'forgot'

const THEMES = {
  dark:   { bg: '#050510', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#f0f0ff', muted: '#44446a', input: 'rgba(255,255,255,0.06)' },
  light:  { bg: '#f0f2ff', card: 'rgba(255,255,255,0.9)',  border: 'rgba(0,0,0,0.08)',       text: '#1a1a2e', muted: '#9999bb', input: 'rgba(255,255,255,0.8)' },
  yellow: { bg: '#0a0900', card: 'rgba(255,215,0,0.06)',   border: 'rgba(255,215,0,0.15)',    text: '#fff8dc', muted: '#aa9900', input: 'rgba(255,215,0,0.06)' },
}

export default function LoginPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shake, setShake] = useState(false)

  const T = THEMES[theme]
  const ACCENT = '#ff6b35'

  useEffect(() => {
    try {
      const t = localStorage.getItem('storeauto_theme') as Theme
      if (t && THEMES[t]) setTheme(t)
      // 이미 로그인된 경우
      const session = loadSession()
      if (session) router.push('/')
    } catch (_e) { /* ignore */ }
  }, [router])

  const handleLogin = async () => {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요'); return }
    setLoading(true); setError('')
    try {
      await signIn(email, password)
      router.push('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '로그인 실패')
      setShake(true); setTimeout(() => setShake(false), 500)
    } finally { setLoading(false) }
  }

  const handleForgot = async () => {
    if (!email) { setError('이메일을 입력해주세요'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      await resetPassword(email)
      setSuccess('비밀번호 재설정 링크를 이메일로 보냈어요 ✉️')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '전송 실패')
    } finally { setLoading(false) }
  }

  const saveTheme = (t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('storeauto_theme', t) } catch (_e) { /* ignore */ }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.input, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: '14px 18px', color: T.text,
    fontSize: 16, outline: 'none', fontFamily: "'Noto Sans KR',sans-serif",
    transition: 'all 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: "'Noto Sans KR',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes float  { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-20px) rotate(2deg)} }
        @keyframes orbit  { from{transform:rotate(0deg) translateX(160px) rotate(0deg)} to{transform:rotate(360deg) translateX(160px) rotate(-360deg)} }
        @keyframes orbitR { from{transform:rotate(0deg) translateX(220px) rotate(0deg)} to{transform:rotate(-360deg) translateX(220px) rotate(360deg)} }
        @keyframes glow   { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 60%{transform:translateX(8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: ${T.muted}; }
        * { box-sizing: border-box; }
      `}</style>

      {/* 배경 글로우 */}
      {[{c:'rgba(255,107,53,0.08)',t:'5%',l:'60%',s:600},{c:'rgba(139,92,246,0.06)',t:'60%',l:'5%',s:500},{c:'rgba(16,185,129,0.05)',t:'40%',l:'40%',s:400}].map((o,i) => (
        <div key={i} style={{ position:'absolute', width:o.s, height:o.s, borderRadius:'50%', background:o.c, top:o.t, left:o.l, filter:'blur(80px)', animation:`glow ${4+i}s ease-in-out infinite`, animationDelay:`${i*1.5}s`, pointerEvents:'none' }} />
      ))}

      {/* 궤도 파티클 */}
      <div style={{ position:'absolute', top:'50%', left:'25%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:ACCENT, boxShadow:`0 0 16px ${ACCENT}`, animation:'orbit 10s linear infinite', position:'relative' }} />
      </div>
      <div style={{ position:'absolute', top:'50%', left:'25%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#8b5cf6', boxShadow:'0 0 12px #8b5cf6', animation:'orbitR 14s linear infinite', position:'relative' }} />
      </div>

      {/* 테마 버튼 */}
      <div style={{ position:'fixed', top:20, right:20, display:'flex', gap:8, zIndex:100 }}>
        {(['dark','light','yellow'] as Theme[]).map(t => (
          <button key={t} onClick={() => saveTheme(t)} style={{ width:36, height:36, borderRadius:'50%', border:`2px solid ${theme===t ? ACCENT : 'transparent'}`, cursor:'pointer', fontSize:18, background:t==='dark'?'#1a1a2e':t==='light'?'#e8eaff':'#1a1600', boxShadow:theme===t?`0 0 16px ${ACCENT}88`:'' }}>
            {t==='dark'?'🌙':t==='light'?'☀️':'⭐'}
          </button>
        ))}
      </div>

      {/* 왼쪽 캐릭터 영역 (PC 전용) */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, position:'relative' }} className="pc-only">
        {/* SVG 배경 */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="lg1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.12" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="50%" cy="50%" rx="40%" ry="40%" fill="url(#lg1)" style={{ animation:'glow 4s ease-in-out infinite' }} />
          {/* 격자 */}
          {Array.from({length:8}).map((_,i) => (
            <line key={i} x1={`${i*14}%`} y1="0" x2={`${i*14}%`} y2="100%" stroke={ACCENT} strokeOpacity="0.04" strokeWidth="1" />
          ))}
          {Array.from({length:8}).map((_,i) => (
            <line key={i} x1="0" y1={`${i*14}%`} x2="100%" y2={`${i*14}%`} stroke={ACCENT} strokeOpacity="0.04" strokeWidth="1" />
          ))}
        </svg>

        {/* 캐릭터 */}
        <div style={{ animation:'float 5s ease-in-out infinite', position:'relative', zIndex:2 }}>
          <div style={{ width:200, height:200, borderRadius:'50%', background:`linear-gradient(135deg, ${ACCENT}25, ${ACCENT}08)`, border:`2px solid ${ACCENT}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:100, boxShadow:`0 0 60px ${ACCENT}33, 0 0 120px ${ACCENT}11`, position:'relative' }}>
            🏪
            <div style={{ position:'absolute', inset:-12, borderRadius:'50%', border:`2px dashed ${ACCENT}25`, animation:'spin 20s linear infinite' }} />
          </div>
        </div>

        {/* 텍스트 */}
        <div style={{ textAlign:'center', marginTop:32, position:'relative', zIndex:2 }}>
          <div style={{ fontSize:28, fontWeight:900, color:T.text, letterSpacing:'-0.5px', marginBottom:8 }}>혼자 운영하는 사장님을 위한</div>
          <div style={{ fontSize:36, fontWeight:900, color:ACCENT, letterSpacing:'-1px' }}>AI 비서</div>
          <div style={{ fontSize:14, color:T.muted, marginTop:12, lineHeight:1.8 }}>
            상세페이지 · 리뷰 답글 · 정부지원까지<br />
            소상공인의 온라인을 AI가 대신합니다
          </div>
        </div>

        {/* 기능 뱃지 */}
        <div style={{ display:'flex', gap:10, marginTop:24, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:2 }}>
          {[{e:'📄',l:'상세페이지 10초'},{e:'💬',l:'리뷰 자동답글'},{e:'🏛️',l:'정부지원 AI'}].map((b,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:20, background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, fontSize:13, fontWeight:700, color:ACCENT }}>
              {b.e} {b.l}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 폼 */}
      <div style={{ width:'100%', maxWidth:480, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 24px', position:'relative', zIndex:10 }}>
        <div style={{ width:'100%', animation:'fadeUp 0.5s ease' }}>
          {/* 카드 */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:28, padding:'40px 36px', backdropFilter:'blur(30px)', boxShadow:'0 40px 80px rgba(0,0,0,0.4)' }}>
            {/* 로고 */}
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div style={{ width:64, height:64, borderRadius:20, background:`linear-gradient(135deg,${ACCENT},#ffd700)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 12px', boxShadow:`0 0 30px ${ACCENT}44` }}>⚡</div>
              <div style={{ fontSize:22, fontWeight:900, color:T.text }}>STORE AUTO</div>
              <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{mode === 'login' ? '로그인' : '비밀번호 재설정'}</div>
            </div>

            {mode === 'login' ? (
              <>
                {/* 이메일 */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:8 }}>이메일</div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="example@email.com" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT; (e.target as HTMLInputElement).style.boxShadow = `0 0 20px ${ACCENT}22` }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                  />
                </div>

                {/* 비밀번호 */}
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:8 }}>비밀번호</div>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호 입력"
                      style={{ ...inputStyle, paddingRight:50, animation:shake?'shake 0.5s ease':'none', borderColor:error?'#ef4444':T.border, boxShadow:error?'0 0 20px rgba(239,68,68,0.2)':'none' }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                      onBlur={e => { if (!error) (e.target as HTMLInputElement).style.borderColor = T.border }}
                    />
                    <button onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, color:T.muted }}>{showPw?'🙈':'👁️'}</button>
                  </div>
                </div>

                <div style={{ textAlign:'right', marginBottom:20 }}>
                  <button onClick={() => { setMode('forgot'); setError(''); setSuccess('') }} style={{ background:'none', border:'none', color:T.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                    비밀번호를 잊으셨나요?
                  </button>
                </div>

                {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:13, color:'#f87171', marginBottom:16 }}>⚠️ {error}</div>}

                <button onClick={handleLogin} disabled={loading} style={{ width:'100%', padding:16, background:`linear-gradient(135deg,${ACCENT},#ff8c5a)`, border:'none', borderRadius:14, color:'white', fontSize:16, fontWeight:900, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', opacity:loading?0.7:1, boxShadow:`0 8px 28px ${ACCENT}44`, transition:'all 0.2s' }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 14px 36px ${ACCENT}55` } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 28px ${ACCENT}44` }}
                >
                  {loading ? '로그인 중...' : '🚀 로그인'}
                </button>

                <div style={{ textAlign:'center', marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontSize:13, color:T.muted }}>
                    계정이 없으신가요?{' '}
                    <button onClick={() => router.push('/signup')} style={{ background:'none', border:'none', color:ACCENT, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>회원가입</button>
                  </div>
                  <button onClick={() => router.push('/?browse=1')} style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:10, padding:'10px', color:T.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ACCENT; (e.currentTarget as HTMLElement).style.color = ACCENT }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.muted }}
                  >👀 로그인 없이 둘러보기</button>
                  <button onClick={() => router.push('/admin')} style={{ background:'none', border:'none', color:T.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit', opacity:0.5 }}>
                    관리자 페이지 →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:14, color:T.muted, marginBottom:20, lineHeight:1.7 }}>
                  가입한 이메일 주소를 입력하면<br />비밀번호 재설정 링크를 보내드려요.
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:'0.5px', marginBottom:8 }}>이메일</div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgot()} placeholder="example@email.com" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = ACCENT }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
                  />
                </div>
                {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:13, color:'#f87171', marginBottom:16 }}>⚠️ {error}</div>}
                {success && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', fontSize:13, color:'#34d399', marginBottom:16 }}>{success}</div>}
                <button onClick={handleForgot} disabled={loading} style={{ width:'100%', padding:16, background:`linear-gradient(135deg,${ACCENT},#ff8c5a)`, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:900, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', opacity:loading?0.7:1, boxShadow:`0 8px 28px ${ACCENT}44` }}>
                  {loading ? '전송 중...' : '✉️ 재설정 링크 보내기'}
                </button>
                <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} style={{ width:'100%', padding:'12px', marginTop:10, background:'none', border:'none', color:T.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  ← 로그인으로 돌아가기
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .pc-only { display: none !important; } }
      `}</style>
    </div>
  )
}

