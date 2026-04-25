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
  }
}

const base = (bg: string, accent: string, text: string, subBg: string, border: string, badgeBg: string, badgeText: string) =>
  (d: EditableData) => `
<div style="font-family:'Noto Sans KR',sans-serif;max-width:860px;margin:0 auto;background:${bg};color:${text};padding:0 0 60px;">

  <!-- 히어로 -->
  <div style="background:${accent};padding:60px 40px;text-align:center;">
    <p style="font-size:13px;letter-spacing:3px;color:rgba(255,255,255,0.7);margin-bottom:12px;text-transform:uppercase;">PREMIUM PRODUCT</p>
    <h1 style="font-size:36px;font-weight:900;color:#fff;margin-bottom:16px;line-height:1.2;">${d.productName}</h1>
    <p style="font-size:18px;color:rgba(255,255,255,0.9);font-weight:500;">${d.oneLiner}</p>
    <div style="margin-top:24px;display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:8px;padding:10px 28px;">
      <span style="font-size:22px;font-weight:900;color:#fff;">${d.priceRange}</span>
    </div>
  </div>

  <!-- 특징 뱃지 -->
  <div style="padding:32px 40px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;background:${subBg};">
    ${d.features.map(f => `<span style="background:${badgeBg};color:${badgeText};border-radius:20px;padding:7px 18px;font-size:13px;font-weight:700;">${f}</span>`).join('')}
  </div>

  <!-- 상세 설명 -->
  <div style="padding:40px;border-bottom:1px solid ${border};">
    <h2 style="font-size:13px;font-weight:700;letter-spacing:3px;color:${accent};margin-bottom:20px;text-transform:uppercase;">상품 상세 설명</h2>
    <p style="font-size:15px;line-height:2;color:${text};white-space:pre-line;">${d.description}</p>
  </div>

  <!-- 추천 고객 -->
  <div style="padding:40px;background:${subBg};border-bottom:1px solid ${border};">
    <h2 style="font-size:13px;font-weight:700;letter-spacing:3px;color:${accent};margin-bottom:20px;text-transform:uppercase;">이런 분께 추천합니다</h2>
    <p style="font-size:15px;line-height:2;white-space:pre-line;color:${text};">${d.recommendation}</p>
  </div>

  <!-- CTA -->
  <div style="padding:40px;text-align:center;border-bottom:1px solid ${border};">
    <p style="font-size:16px;line-height:1.8;color:${accent};font-weight:600;">${d.cta}</p>
  </div>

  <!-- FAQ -->
  <div style="padding:40px;">
    <h2 style="font-size:13px;font-weight:700;letter-spacing:3px;color:${accent};margin-bottom:24px;text-transform:uppercase;">자주 묻는 질문</h2>
    ${d.faq.map(f => `
    <div style="margin-bottom:20px;border-left:3px solid ${accent};padding-left:16px;">
      <p style="font-weight:700;color:${text};margin-bottom:6px;">Q. ${f.q}</p>
      <p style="color:${text};opacity:0.7;font-size:14px;line-height:1.7;">A. ${f.a}</p>
    </div>`).join('')}
  </div>

  <!-- 키워드 -->
  <div style="padding:0 40px 40px;display:flex;flex-wrap:wrap;gap:8px;">
    ${d.keywords.map(k => `<span style="background:${subBg};border:1px solid ${border};border-radius:6px;padding:4px 12px;font-size:12px;color:${accent};">#${k}</span>`).join('')}
  </div>
</div>`

export const TEMPLATES: Template[] = [
  {
    id: 1,
    name: '모던 다크',
    desc: '세련된 다크 톤',
    render: base('#0a0a0f', '#ff6b35', '#f0f0f5', '#13131a', '#2a2a3a', '#1c1c28', '#ff6b35'),
  },
  {
    id: 2,
    name: '클린 화이트',
    desc: '깔끔한 밝은 스타일',
    render: base('#ffffff', '#2563eb', '#1a1a2e', '#f8f9ff', '#e0e4f0', '#e8f0ff', '#2563eb'),
  },
  {
    id: 3,
    name: '핑크 러블리',
    desc: '감성적인 핑크 톤',
    render: base('#fff5f8', '#ff4d8f', '#2a0a18', '#ffe0ec', '#ffb3ce', '#ffe0ec', '#ff4d8f'),
  },
  {
    id: 4,
    name: '포레스트 그린',
    desc: '자연친화적 그린',
    render: base('#f0fff4', '#16a34a', '#052e16', '#dcfce7', '#bbf7d0', '#dcfce7', '#16a34a'),
  },
  {
    id: 5,
    name: '로얄 퍼플',
    desc: '고급스러운 보라',
    render: base('#faf5ff', '#7c3aed', '#2e1065', '#ede9fe', '#ddd6fe', '#ede9fe', '#7c3aed'),
  },
  {
    id: 6,
    name: '골드 럭셔리',
    desc: '프리미엄 골드 감성',
    render: base('#0d0b07', '#c9a84c', '#f5e6c8', '#1a1608', '#3a2e10', '#2a2208', '#c9a84c'),
  },
  {
    id: 7,
    name: '미니멀 그레이',
    desc: '심플 모노크롬',
    render: base('#fafafa', '#333333', '#111111', '#f0f0f0', '#dddddd', '#eeeeee', '#333333'),
  },
]
