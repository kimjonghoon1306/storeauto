import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret, startDate, endDate, keyword } = await req.json()

    if (!clientId || !clientSecret || !keyword) {
      return NextResponse.json({ error: '필수 파라미터가 없습니다.' }, { status: 400 })
    }

    const body = {
      startDate,
      endDate,
      timeUnit: 'month',
      keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
    }

    const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `네이버 API 오류: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    const results = data.results?.[0]?.data || []

    return NextResponse.json({ results })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '트렌드 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

