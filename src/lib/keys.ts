import { loadSession } from './auth'

const SURL = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SKEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function loadUserKeys(): Promise<{ gemini: string; openai: string; groq: string }> {
  try {
    const sess = loadSession()
    if (!sess) return { gemini: '', openai: '', groq: '' }
    const res = await fetch(
      `${SURL()}/rest/v1/user_keys?user_id=eq.${sess.id}&select=gemini_key,openai_key,groq_key&limit=1`,
      { headers: { apikey: SKEY(), Authorization: `Bearer ${sess.access_token}` } }
    )
    const data = await res.json()
    if (Array.isArray(data) && data[0]) {
      return { gemini: data[0].gemini_key||'', openai: data[0].openai_key||'', groq: data[0].groq_key||'' }
    }
  } catch { /* ignore */ }
  return { gemini: '', openai: '', groq: '' }
}
