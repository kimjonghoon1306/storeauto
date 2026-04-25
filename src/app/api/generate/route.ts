import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: '브라우저에서 직접 AI API를 호출합니다.' }, { status: 400 })
}
