import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { result, productName } = await req.json()
    if (!result) return NextResponse.json({ error: '내용이 없어요.' }, { status: 400 })

    // 랜덤 ID 생성 (8자)
    const id = Math.random().toString(36).slice(2, 10)

    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ id, content: result, product_name: productName || '상품' }),
    })

    if (!res.ok) return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    return NextResponse.json({ id, url: `/share/${id}` })
  } catch (_e) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID 없음' }, { status: 400 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_pages?id=eq.${id}&select=*&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  const data = await res.json()
  if (!Array.isArray(data) || !data[0]) return NextResponse.json({ error: '찾을 수 없어요.' }, { status: 404 })

  // 만료 체크
  if (new Date(data[0].expires_at) < new Date()) {
    return NextResponse.json({ error: '만료된 링크예요.' }, { status: 410 })
  }

  return NextResponse.json(data[0])
}

