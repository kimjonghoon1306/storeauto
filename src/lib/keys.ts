import { loadSession } from './auth'

const SURL = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SKEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/** 관리자 로그인 상태인지 확인 */
function isAdminAuthed(): boolean {
  try {
    return typeof window !== 'undefined' &&
      localStorage.getItem('storeauto_admin_authed') === '1'
  } catch { return false }
}

/**
 * 키 정책:
 * - 관리자 로그인 상태 → 관리자 키(localStorage storeauto_admin_*) 사용
 * - 일반 회원 → 본인이 마이페이지에서 입력한 키(user_keys 테이블)만 사용
 * - 회원 키 없음 → 빈 값 반환 (호출부에서 NO_KEY 처리)
 */
export async function loadUserKeys(): Promise<{ gemini: string; openai: string; groq: string }> {
  // ── 관리자: 관리자 키만 사용
  if (isAdminAuthed()) {
    try {
      const gemini = localStorage.getItem('storeauto_admin_gemini') || ''
      const openai = localStorage.getItem('storeauto_admin_openai') || ''
      const groq   = localStorage.getItem('storeauto_admin_groq')   || ''
      return { gemini, openai, groq }
    } catch { return { gemini: '', openai: '', groq: '' } }
  }

  // ── 일반 회원: 본인 키만 사용
  try {
    const sess = loadSession()
    if (!sess) return { gemini: '', openai: '', groq: '' }
    const res = await fetch(
      `${SURL()}/rest/v1/user_keys?user_id=eq.${sess.id}&select=gemini_key,openai_key,groq_key&limit=1`,
      { headers: { apikey: SKEY(), Authorization: `Bearer ${sess.access_token}` } }
    )
    const data = await res.json()
    if (Array.isArray(data) && data[0]) {
      return {
        gemini: data[0].gemini_key || '',
        openai: data[0].openai_key || '',
        groq:   data[0].groq_key   || '',
      }
    }
  } catch { /* ignore */ }

  return { gemini: '', openai: '', groq: '' }
}
