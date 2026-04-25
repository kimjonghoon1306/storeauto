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
<style>
  .sa-wrap{font-family:'Noto Sans KR',sans-serif;max-width:100%;margin:0 auto;background:${bg};color:${text};padding:0;}
  .sa-hero{background:${accent};padding:60px 40px;text-align:center;}
  .sa-hero h1{font-size:clamp(26px,5vw,42px);font-weight:900;color:${heroTextColor};margin-bottom:16px;line-height:1.25;}
  .sa-hero p.sub{font-size:clamp(16px,3vw,22px);color:rgba(255,255,255,0.92);font-weight:500;line-height:1.6;}
  .sa-hero .price{margin-top:24px;display:inline-block;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);border-radius:10px;padding:12px 32px;}
  .sa-hero .price span{font-size:clamp(20px,4vw,28px);font-weight:900;color:${heroTextColor};}
  .sa-badge{padding:clamp(24px,4vw,40px) clamp(20px,4vw,60px);display:flex;flex-wrap:wrap;gap:10px;justify-content:center;background:${subBg};border-bottom:1px solid ${border};}
  .sa-badge span{background:${badgeBg};color:${badgeText};border-radius:24px;padding:clamp(8px,1.5vw,10px) clamp(16px,3vw,24px);font-size:clamp(14px,2.5vw,16px);font-weight:700;}
  .sa-section{padding:clamp(32px,5vw,60px) clamp(20px,5vw,60px);border-bottom:1px solid ${border};}
  .sa-section.alt{background:${subBg};}
  .sa-section h2{font-size:clamp(20px,4vw,28px);font-weight:900;color:${accent};margin-bottom:clamp(16px,3vw,28px);padding-bottom:12px;border-bottom:2px solid ${accent};}
  .sa-section p{font-size:clamp(15px,3vw,18px);line-height:2.1;white-space:pre-line;}
  .sa-cta{padding:clamp(32px,5vw,60px) clamp(20px,5vw,60px);text-align:center;background:${accent};border-bottom:1px solid ${border};}
  .sa-cta p{font-size:clamp(17px,3.5vw,22px);line-height:1.9;color:${heroTextColor};font-weight:700;}
  .sa-faq{padding:clamp(32px,5vw,60px) clamp(20px,5vw,60px);border-bottom:1px solid ${border};}
  .sa-faq h2{font-size:clamp(20px,4vw,28px);font-weight:900;color:${accent};margin-bottom:clamp(20px,3vw,32px);padding-bottom:12px;border-bottom:2px solid ${accent};}
  .sa-faq-item{margin-bottom:clamp(16px,3vw,28px);background:${subBg};border-radius:12px;padding:clamp(16px,3vw,24px) clamp(16px,3vw,28px);border-left:4px solid ${accent};}
  .sa-faq-item .q{font-weight:800;color:${text};margin-bottom:8px;font-size:clamp(15px,3vw,18px);}
  .sa-faq-item .a{color:${text};opacity:0.75;font-size:clamp(14px,2.5vw,17px);line-height:1.9;}
  .sa-keywords{padding:clamp(24px,4vw,40px) clamp(20px,4vw,60px) clamp(40px,6vw,60px);display:flex;flex-wrap:wrap;gap:8px;}
  .sa-keywords span{background:${subBg};border:1px solid ${border};border-radius:8px;padding:clamp(6px,1.5vw,8px) clamp(12px,2vw,16px);font-size:clamp(13px,2.5vw,15px);color:${accent};font-weight:600;}
  .sa-img{width:100%;line-height:0;}
  .sa-img img{width:100%;display:block;object-fit:cover;max-height:600px;}
  @media(max-width:640px){
    .sa-hero{padding:40px 20px;}
    .sa-section,.sa-faq,.sa-cta,.sa-keywords{padding-left:16px;padding-right:16px;}
    .sa-badge{padding-left:16px;padding-right:16px;}
  }
</style>
<div class="sa-wrap">

  ${d.thumbUrl ? `<div class="sa-img"><img src="${d.thumbUrl}" alt="${d.productName}" /></div>` : ''}
  <div class="sa-hero">
    <p style="font-size:13px;letter-spacing:4px;color:rgba(255,255,255,0.7);margin-bottom:14px;text-transform:uppercase;font-weight:500;">PREMIUM PRODUCT</p>
    <h1>${d.productName}</h1>
    <p class="sub">${d.oneLiner}</p>
    <div class="price"><span>${d.priceRange}</span></div>
  </div>
  <div class="sa-badge">${d.features.map(f => `<span>${f}</span>`).join('')}</div>
  <div class="sa-section">
    <h2>상품 상세 설명</h2>
    <p>${d.description}</p>
  </div>
  ${imgBlock(d.img1Url)}
  <div class="sa-section alt">
    <h2>이런 분께 추천합니다</h2>
    <p>${d.recommendation}</p>
  </div>
  ${imgBlock(d.img2Url)}
  <div class="sa-cta"><p>${d.cta}</p></div>
  ${imgBlock(d.img3Url)}
  <div class="sa-faq">
    <h2>자주 묻는 질문</h2>
    ${d.faq.map(f => `<div class="sa-faq-item"><p class="q">Q. ${f.q}</p><p class="a">A. ${f.a}</p></div>`).join('')}
  </div>
  <div class="sa-keywords">${d.keywords.map(k => `<span>#${k}</span>`).join('')}</div>
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
