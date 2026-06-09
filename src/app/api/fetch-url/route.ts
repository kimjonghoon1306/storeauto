import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL이 없습니다.' }, { status: 400 })
    }

    // URL 유효성 검사
    let parsed: URL
    try {
      parsed = new URL(url.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    } catch {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다. (https://... 로 시작해야 해요)' }, { status: 400 })
    }

    // 서버에서 직접 페이지 요청 (CORS 우회)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let html = ''
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      })
      clearTimeout(timeout)
      if (!res.ok) {
        return NextResponse.json({ error: `페이지를 불러올 수 없습니다. (HTTP ${res.status})` }, { status: 422 })
      }
      html = await res.text()
    } catch (e: unknown) {
      clearTimeout(timeout)
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('abort') || msg.includes('timeout')) {
        return NextResponse.json({ error: '페이지 응답 시간이 초과됐어요. 다시 시도해주세요.' }, { status: 408 })
      }
      return NextResponse.json({ error: '페이지를 불러올 수 없어요. URL을 다시 확인해주세요.' }, { status: 422 })
    }

    // ── HTML에서 핵심 정보 추출 ──────────────────────────────────

    // 1. 타이틀
    const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
    const title = titleMatch?.[1]?.replace(/&amp;/g,'&').replace(/&#\d+;/g,'').trim() || ''

    // 2. OG / 메타 태그
    const getMetaImg = (): string => {
      const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i)
             || html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:image["']/i)
      return m?.[1]?.trim() || ''
    }

    const getMeta = (prop: string): string => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']{1,500})["']`, 'i'))
             || html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))
      return m?.[1]?.replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim() || ''
    }
    const ogTitle       = getMeta('og:title')
    const ogDescription = getMeta('og:description')
    const ogPrice       = getMeta('product:price:amount') || getMeta('og:price:amount')
    const description   = getMeta('description')

    // 3. JSON-LD 구조화 데이터 (Product 스키마)
    let jsonLdText = ''
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let m
    while ((m = jsonLdRegex.exec(html)) !== null) {
      try {
        const obj = JSON.parse(m[1])
        const items = Array.isArray(obj) ? obj : [obj]
        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type'] === 'ItemList') {
            jsonLdText = JSON.stringify(item).slice(0, 1500)
            break
          }
        }
        if (jsonLdText) break
      } catch { /* continue */ }
    }

    // 4. 본문 텍스트 (스크립트/스타일 제거 후 텍스트만)
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 3000) // AI 토큰 제한

    // 수집된 정보가 너무 적으면 실패 처리
    if (!title && !ogTitle && bodyText.length < 100) {
      return NextResponse.json({ error: '이 페이지에서 상품 정보를 가져올 수 없어요. 다른 URL을 시도해보세요.' }, { status: 422 })
    }

    // 추출된 데이터 반환
    const extracted = {
      title:       ogTitle || title,
      description: ogDescription || description,
      price:       ogPrice,
      image:       getMetaImg(),
      jsonLd:      jsonLdText,
      bodyText,
      host:        parsed.hostname,
    }

    return NextResponse.json({ extracted })

  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '서버 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
