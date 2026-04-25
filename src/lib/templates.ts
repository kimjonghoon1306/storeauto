import { GeneratedResult } from './types'

export interface Template {
  id: number
  name: string
  desc: string
  render: (data: EditableData) => string
}

export interface EditableData {
  productName: string
  oneLiner: string
  description: string
  recommendation: string
  cta: string
  priceRange: string
  keywords: string[]
  faq: { q: string; a: string }[]
  features: string[]
  thumbUrl: string
  img1Url: string
  img2Url: string
  img3Url: string
}

export function resultToEditable(result: GeneratedResult, productName: string, priceRange: string, features: string[]): EditableData {
  return {
    productName,
    oneLiner: result.oneLiner,
    description: result.description,
    recommendation: result.recommendation,
    cta: result.cta,
    priceRange,
    keywords: result.keywords,
    faq: result.faq,
    features,
    thumbUrl: '',
    img1Url: '',
    img2Url: '',
    img3Url: '',
  }
}

const imgBlock = (url: string) => url
  ? `<div style="width:100%;margin:0;line-height:0;"><img src="${url}" alt="" style="width:100%;display:block;object-fit:cover;max-height:600px;" /></div>`
  : ''

const base = (bg: string, accent: string, text: string, subBg: string, border: string, badgeBg: string, badgeText: string, heroTextColor: string) =>
  (d: EditableData) => `
<div style="font-family:'Noto Sans KR',sans-serif;max-width:100%;margin:0 auto;background:${bg};color:${text};padding:0;">

  <!-- 썸네일 이미지 -->
  ${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" alt="${d.productName}" style="width:100%;display:block;max-height:700px;object-fit:cover;" /></div>` : ''}

  <!-- 히어로 -->
  <div style="background:${accent};padding:70px 60px;text-align:center;">
    <p style="font-size:14px;letter-spacing:4px;color:rgba(255,255,255,0.7);margin-bottom:16px;text-transform:uppercase;font-weight:500;">PREMIUM PRODUCT</p>
    <h1 style="font-size:42px;font-weight:900;color:${heroTextColor};margin-bottom:20px;line-height:1.25;">${d.productName}</h1>
    <p style="font-size:22px;color:rgba(255,255,255,0.92);font-weight:500;line-height:1.6;">${d.oneLiner}</p>
    <div style="margin-top:32px;display:inline-block;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);border-radius:10px;padding:14px 40px;">
      <span style="font-size:28px;font-weight:900;color:${heroTextColor};">${d.priceRange}</span>
    </div>
  </div>

  <!-- 특징 뱃지 -->
  <div style="padding:40px 60px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center;background:${subBg};border-bottom:1px solid ${border};">
    ${d.features.map(f => `<span style="background:${badgeBg};color:${badgeText};border-radius:24px;padding:10px 24px;font-size:16px;font-weight:700;">${f}</span>`).join('')}
  </div>

  <!-- 상세 설명 -->
  <div style="padding:60px;border-bottom:1px solid ${border};">
    <h2 style="font-size:28px;font-weight:900;color:${accent};margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid ${accent};">상품 상세 설명</h2>
    <p style="font-size:18px;line-height:2.1;color:${text};white-space:pre-line;">${d.description}</p>
  </div>

  <!-- 중간 이미지 1 -->
  ${imgBlock(d.img1Url)}

  <!-- 추천 고객 -->
  <div style="padding:60px;background:${subBg};border-bottom:1px solid ${border};">
    <h2 style="font-size:28px;font-weight:900;color:${accent};margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid ${accent};">이런 분께 추천합니다</h2>
    <p style="font-size:18px;line-height:2.1;white-space:pre-line;color:${text};">${d.recommendation}</p>
  </div>

  <!-- 중간 이미지 2 -->
  ${imgBlock(d.img2Url)}

  <!-- CTA -->
  <div style="padding:60px;text-align:center;border-bottom:1px solid ${border};background:${accent};">
    <p style="font-size:22px;line-height:1.9;color:${heroTextColor};font-weight:700;">${d.cta}</p>
  </div>

  <!-- 중간 이미지 3 -->
  ${imgBlock(d.img3Url)}

  <!-- FAQ -->
  <div style="padding:60px;border-bottom:1px solid ${border};">
    <h2 style="font-size:28px;font-weight:900;color:${accent};margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid ${accent};">자주 묻는 질문</h2>
    ${d.faq.map(f => `
    <div style="margin-bottom:28px;background:${subBg};border-radius:12px;padding:24px 28px;border-left:4px solid ${accent};">
      <p style="font-weight:800;color:${text};margin-bottom:10px;font-size:18px;">Q. ${f.q}</p>
      <p style="color:${text};opacity:0.75;font-size:17px;line-height:1.9;">A. ${f.a}</p>
    </div>`).join('')}
  </div>

  <!-- 키워드 -->
  <div style="padding:40px 60px 60px;display:flex;flex-wrap:wrap;gap:10px;">
    ${d.keywords.map(k => `<span style="background:${subBg};border:1px solid ${border};border-radius:8px;padding:8px 16px;font-size:15px;color:${accent};font-weight:600;">#${k}</span>`).join('')}
  </div>
</div>`

export const TEMPLATES: Template[] = [
  { id: 1, name: '모던 다크',    desc: '세련된 다크 톤',       render: base('#0a0a0f','#ff6b35','#f0f0f5','#13131a','#2a2a3a','#1c1c28','#ff6b35','#ffffff') },
  { id: 2, name: '클린 화이트',  desc: '깔끔한 밝은 스타일',   render: base('#ffffff','#2563eb','#1a1a2e','#f0f4ff','#dde4f5','#dde4f5','#2563eb','#ffffff') },
  { id: 3, name: '핑크 러블리',  desc: '감성적인 핑크 톤',     render: base('#fff5f8','#ff4d8f','#2a0a18','#ffe0ec','#ffb3ce','#ffe0ec','#ff4d8f','#ffffff') },
  { id: 4, name: '포레스트 그린',desc: '자연친화적 그린',       render: base('#f0fff4','#16a34a','#052e16','#dcfce7','#bbf7d0','#dcfce7','#16a34a','#ffffff') },
  { id: 5, name: '로얄 퍼플',    desc: '고급스러운 보라',       render: base('#faf5ff','#7c3aed','#2e1065','#ede9fe','#ddd6fe','#ede9fe','#7c3aed','#ffffff') },
  { id: 6, name: '골드 럭셔리',  desc: '프리미엄 골드 감성',   render: base('#0d0b07','#c9a84c','#f5e6c8','#1a1608','#3a2e10','#2a2208','#c9a84c','#0d0b07') },
  { id: 7, name: '미니멀 그레이',desc: '심플 모노크롬',         render: base('#fafafa','#333333','#111111','#f0f0f0','#dddddd','#e8e8e8','#333333','#ffffff') },
]
