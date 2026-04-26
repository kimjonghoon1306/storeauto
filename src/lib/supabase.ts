const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function supabaseQuery(table: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: object, query?: string) {
  const isUpsert = method === 'POST' && query?.includes('on_conflict')
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': isUpsert
        ? 'return=representation,resolution=merge-duplicates'
        : method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error('Supabase 오류: ' + res.status)
  if (method === 'DELETE' || method === 'PATCH') return null
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}
