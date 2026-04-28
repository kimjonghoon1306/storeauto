'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')

  useEffect(() => {
    // Supabase Auth는 이메일 링크 클릭 시 URL hash에 access_token을 담아 리다이렉트
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // 토큰 파싱 후 세션 저장
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type') // signup, recovery 등

      if (accessToken) {
        // 사용자 정보 가져오기
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
        })
          .then(r => r.json())
          .then(data => {
            if (data.id) {
              localStorage.setItem('sa_session', JSON.stringify({
                id: data.id,
                email: data.email,
                access_token: accessToken,
                refresh_token: refreshToken || '',
              }))
              setStatus('success')
              // 비밀번호 재설정이면 바로 이동
              if (type === 'recovery') {
                setTimeout(() => router.push('/mypage'), 2000)
              } else {
                setTimeout(() => router.push('/'), 2500)
              }
            } else {
              setStatus('error')
            }
          })
          .catch(() => setStatus('error'))
      } else {
        setStatus('error')
      }
    } else {
      setStatus('error')
    }
  }, [router])

  const ACCENT = '#ff6b35'

  return (
    <div style={{
      minHeight: '100vh', background: '#050510',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans KR', sans-serif", padding: '20px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
      `}</style>

      <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease', maxWidth: 400, width: '100%' }}>
        {status === 'checking' && (
          <>
            <div style={{ fontSize: 60, marginBottom: 20, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⟳</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f0ff', marginBottom: 8 }}>인증 확인 중...</div>
            <div style={{ fontSize: 14, color: '#44446a' }}>잠시만 기다려주세요</div>
          </>
        )}

        {status === 'success' && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 24, padding: '40px 32px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', marginBottom: 8 }}>인증 완료!</div>
            <div style={{ fontSize: 14, color: '#34d399', opacity: 0.7, lineHeight: 1.7 }}>
              이메일 인증이 완료됐어요.<br />잠시 후 자동으로 이동합니다.
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 24, padding: '40px 32px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f87171', marginBottom: 8 }}>인증 링크 오류</div>
            <div style={{ fontSize: 14, color: '#f87171', opacity: 0.7, lineHeight: 1.7, marginBottom: 24 }}>
              인증 링크가 만료됐거나 올바르지 않아요.<br />다시 로그인해주세요.
            </div>
            <button onClick={() => router.push('/login')} style={{
              padding: '12px 28px', background: `linear-gradient(135deg,${ACCENT},#ff8c5a)`,
              border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>로그인하러 가기</button>
          </div>
        )}
      </div>
    </div>
  )
}

