const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const AUTH_URL = `${SUPABASE_URL}/auth/v1`

const authHeaders = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
}

export interface AuthUser {
  id: string
  email: string
  access_token: string
  refresh_token: string
}

export interface Profile {
  id: string
  email: string
  name: string
  business_name: string
  phone: string
  business_type: string
  region: string
}

// 세션 저장/불러오기
export const saveSession = (user: AuthUser) => {
  try {
    localStorage.setItem('sa_session', JSON.stringify(user))
  } catch (_e) { /* ignore */ }
}

export const loadSession = (): AuthUser | null => {
  try {
    const s = localStorage.getItem('sa_session')
    return s ? JSON.parse(s) : null
  } catch (_e) { return null }
}

export const clearSession = () => {
  try { localStorage.removeItem('sa_session') } catch (_e) { /* ignore */ }
}

// 회원가입
export const signUp = async (email: string, password: string) => {
  const res = await fetch(`${AUTH_URL}/signup`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.msg || data.error_description || '회원가입 실패')
  return data
}

// 로그인
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || '이메일 또는 비밀번호가 올바르지 않아요')
  const user: AuthUser = {
    id: data.user?.id,
    email: data.user?.email,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  }
  saveSession(user)
  return user
}

// 로그아웃
export const signOut = async (token: string) => {
  try {
    await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: { ...authHeaders, Authorization: `Bearer ${token}` },
    })
  } catch (_e) { /* ignore */ }
  clearSession()
}

// 비밀번호 재설정 이메일
export const resetPassword = async (email: string) => {
  const res = await fetch(`${AUTH_URL}/recover`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.msg || '이메일 발송 실패')
  }
}

// 프로필 가져오기
export const getProfile = async (userId: string, token: string): Promise<Profile | null> => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
    { headers: { ...authHeaders, Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

// 프로필 저장/업데이트
export const upsertProfile = async (profile: Partial<Profile>, token: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      Authorization: `Bearer ${token}`,
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(profile),
  })
  const text = await res.text()
  if (!res.ok) throw new Error('프로필 저장 실패')
  return text ? JSON.parse(text) : null
}

// 사용 통계 기록
export const logUsage = async (userId: string, type: string, token: string, meta = '') => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/usage_stats`, {
      method: 'POST',
      headers: { ...authHeaders, Authorization: `Bearer ${token}`, Prefer: '' },
      body: JSON.stringify({ user_id: userId, type, meta }),
    })
  } catch (_e) { /* ignore */ }
}

// 사용 통계 가져오기
export const getUsageStats = async (userId: string, token: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usage_stats?user_id=eq.${userId}&order=created_at.desc&limit=100`,
    { headers: { ...authHeaders, Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// 북마크 가져오기
export const getBookmarks = async (userId: string, token: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/bookmarks?user_id=eq.${userId}&order=created_at.desc`,
    { headers: { ...authHeaders, Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// 북마크 추가
export const addBookmark = async (userId: string, title: string, url: string, category: string, token: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
    method: 'POST',
    headers: { ...authHeaders, Authorization: `Bearer ${token}`, Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: userId, title, url, category }),
  })
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// 북마크 삭제
export const deleteBookmark = async (id: string, token: string) => {
  await fetch(`${SUPABASE_URL}/rest/v1/bookmarks?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders, Authorization: `Bearer ${token}` },
  })
}

// 세션 유효성 체크 - 만료 시 자동 로그아웃
export const checkSession = async (): Promise<AuthUser | null> => {
  const session = loadSession()
  if (!session) return null

  try {
    // Supabase 토큰 유효성 확인
    const res = await fetch(`${AUTH_URL}/user`, {
      headers: {
        ...authHeaders,
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (res.status === 401 || res.status === 403) {
      // 토큰 만료 - 리프레시 토큰으로 갱신 시도
      if (session.refresh_token) {
        const refreshRes = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          const renewed: AuthUser = {
            id: data.user?.id,
            email: data.user?.email,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          }
          saveSession(renewed)
          return renewed
        }
      }
      // 갱신 실패 - 세션 삭제
      clearSession()
      return null
    }

    return session
  } catch (_e) {
    // 네트워크 오류 시 기존 세션 유지 (오프라인 대응)
    return session
  }
}
