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

// ─────────────────────────────────────────────
// 신규 템플릿 8~17: 완전히 다른 레이아웃
// ─────────────────────────────────────────────

// 8. 쿠팡 스타일
const renderCoupang = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#f5f5f5;color:#111;}
.cp-wrap{max-width:860px;margin:0 auto;background:#fff;}
.cp-top{background:#fff;padding:24px 28px 0;border-bottom:3px solid #e8380d;}
.cp-top-badges{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}
.cp-badge{padding:3px 10px;border-radius:3px;font-size:11px;font-weight:700;}
.cp-badge.rocket{background:#1a73e8;color:#fff;}
.cp-badge.best{background:#e8380d;color:#fff;}
.cp-badge.free{background:#00c73c;color:#fff;}
.cp-name{font-size:clamp(20px,4vw,28px);font-weight:700;line-height:1.4;margin-bottom:8px;color:#111;}
.cp-copy{font-size:15px;color:#555;margin-bottom:16px;line-height:1.6;}
.cp-price-box{background:#fff9f8;border:1px solid #ffd0c5;border-radius:8px;padding:16px 20px;margin-bottom:0;display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
.cp-price{font-size:clamp(26px,5vw,36px);font-weight:900;color:#e8380d;}
.cp-price-sub{font-size:13px;color:#888;}
.cp-delivery{background:#fff;border-top:8px solid #f5f5f5;padding:16px 28px;}
.cp-delivery-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0;}
.cp-delivery-row:last-child{border:none;}
.cp-delivery-label{font-size:12px;color:#888;min-width:70px;}
.cp-delivery-val{font-size:13px;color:#111;font-weight:700;}
.cp-delivery-val.blue{color:#1a73e8;}
.cp-section{background:#fff;border-top:8px solid #f5f5f5;padding:28px 28px;}
.cp-section-title{font-size:17px;font-weight:900;color:#111;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #111;display:flex;align-items:center;gap:8px;}
.cp-check-list{display:flex;flex-direction:column;gap:10px;}
.cp-check-item{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;background:#f8f8f8;border-radius:8px;border-left:3px solid #e8380d;}
.cp-check-icon{color:#e8380d;font-weight:900;font-size:16px;flex-shrink:0;margin-top:1px;}
.cp-check-text{font-size:14px;line-height:1.7;color:#333;font-weight:500;}
.cp-desc{font-size:15px;line-height:2.1;color:#333;white-space:pre-line;}
.cp-rec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}
.cp-rec-card{background:#f8f9ff;border:1px solid #e0e8ff;border-radius:10px;padding:16px;border-top:3px solid #1a73e8;}
.cp-rec-icon{font-size:24px;margin-bottom:8px;}
.cp-rec-text{font-size:13px;line-height:1.8;color:#444;}
.cp-cta-box{background:linear-gradient(135deg,#e8380d,#ff6b35);padding:28px;text-align:center;border-radius:0;}
.cp-cta-text{font-size:clamp(15px,3vw,19px);color:#fff;font-weight:700;line-height:1.9;margin-bottom:20px;white-space:pre-line;}
.cp-cta-btn{display:inline-block;background:#fff;color:#e8380d;font-size:16px;font-weight:900;padding:14px 40px;border-radius:6px;border:none;cursor:pointer;}
.cp-faq-item{border-bottom:1px solid #f0f0f0;padding:16px 0;}
.cp-faq-q{font-size:14px;font-weight:700;color:#111;margin-bottom:6px;display:flex;gap:8px;align-items:flex-start;}
.cp-faq-q::before{content:"Q";background:#e8380d;color:#fff;width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0;margin-top:1px;}
.cp-faq-a{font-size:13px;color:#555;line-height:1.9;padding-left:28px;}
.cp-keywords{padding:20px 28px 28px;display:flex;flex-wrap:wrap;gap:6px;}
.cp-kw{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:5px 12px;font-size:12px;color:#555;}
${d.thumbUrl ? `.cp-thumb{width:100%;line-height:0;}<br>.cp-thumb img{width:100%;max-height:500px;object-fit:cover;}` : ''}
</style>
<div class="cp-wrap">
${d.thumbUrl ? `<div class="cp-thumb"><img src="${d.thumbUrl}" alt="${d.productName}"/></div>` : ''}
<div class="cp-top">
  <div class="cp-top-badges">
    <span class="cp-badge rocket">🚀 로켓배송</span>
    <span class="cp-badge best">BEST</span>
    <span class="cp-badge free">무료반품</span>
  </div>
  <div class="cp-name">${d.productName}</div>
  <div class="cp-copy">${d.oneLiner}</div>
  <div class="cp-price-box">
    <div>
      <div class="cp-price">${d.priceRange}</div>
      <div class="cp-price-sub">쿠팡 최저가 보장</div>
    </div>
    <div style="font-size:13px;color:#00c73c;font-weight:700;">✓ 최대 적립 혜택 적용</div>
  </div>
</div>
<div class="cp-delivery">
  <div class="cp-delivery-row"><span class="cp-delivery-label">배송</span><span class="cp-delivery-val blue">🚀 내일(화) 도착 보장</span></div>
  <div class="cp-delivery-row"><span class="cp-delivery-label">배송비</span><span class="cp-delivery-val">무료배송</span></div>
  <div class="cp-delivery-row"><span class="cp-delivery-label">반품/교환</span><span class="cp-delivery-val">무료 반품 · 30일 이내</span></div>
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="cp-section">
  <div class="cp-section-title">✅ 핵심 특징</div>
  <div class="cp-check-list">
    ${d.features.map(f => `<div class="cp-check-item"><span class="cp-check-icon">✓</span><span class="cp-check-text">${f}</span></div>`).join('')}
  </div>
</div>
<div class="cp-section" style="background:#fff;">
  <div class="cp-section-title">📋 상품 상세</div>
  <p class="cp-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="cp-section">
  <div class="cp-section-title">👤 이런 분께 추천</div>
  <div class="cp-rec-grid">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).slice(0,3).map((r: string, i: number) => `<div class="cp-rec-card"><div class="cp-rec-icon">${['🙋‍♀️','🙋‍♂️','👨‍👩‍👧'][i]}</div><div class="cp-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="cp-cta-box">
  <div class="cp-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="cp-cta-btn">지금 바로 구매하기 →</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="cp-section">
  <div class="cp-section-title">❓ 자주 묻는 질문</div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="cp-faq-item"><div class="cp-faq-q">${f.q}</div><div class="cp-faq-a">${f.a}</div></div>`).join('')}
</div>
<div class="cp-keywords">${d.keywords.map((k: string) => `<span class="cp-kw">#${k}</span>`).join('')}</div>
</div></html>`

// 9. 스마트스토어 스타일
const renderSmartstore = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#fff;color:#111;}
.ss-wrap{max-width:860px;margin:0 auto;background:#fff;}
.ss-header{background:#03c75a;padding:0 28px;}
.ss-header-inner{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.2);}
.ss-brand{font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;}
.ss-score{display:flex;gap:12px;}
.ss-score span{font-size:12px;color:#fff;font-weight:700;}
.ss-hero{background:#fff;padding:28px;}
.ss-kw-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.ss-kw-tag{background:#e8faf1;color:#03c75a;border:1px solid #b3e8cc;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:700;}
.ss-product-name{font-size:clamp(20px,4vw,30px);font-weight:900;line-height:1.4;margin-bottom:10px;}
.ss-copy{font-size:15px;color:#555;margin-bottom:20px;line-height:1.6;}
.ss-price-area{background:#f9fff9;border:2px solid #03c75a;border-radius:10px;padding:18px 22px;margin-bottom:0;}
.ss-price-label{font-size:12px;color:#888;margin-bottom:4px;}
.ss-price{font-size:clamp(28px,5vw,38px);font-weight:900;color:#03c75a;}
.ss-price-info{display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;}
.ss-price-info span{font-size:12px;color:#666;}
.ss-divider{height:8px;background:#f5f5f5;margin:0;}
.ss-section{padding:28px;}
.ss-section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
.ss-section-bar{width:4px;height:22px;background:#03c75a;border-radius:2px;}
.ss-section-title{font-size:18px;font-weight:900;color:#111;}
.ss-feature-list{display:flex;flex-direction:column;gap:0;}
.ss-feature-item{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #f0f0f0;}
.ss-feature-num{width:28px;height:28px;background:#03c75a;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;}
.ss-feature-text{font-size:14px;line-height:1.7;color:#333;padding-top:3px;}
.ss-desc{font-size:15px;line-height:2.2;color:#333;white-space:pre-line;}
.ss-rec-list{display:flex;flex-direction:column;gap:12px;}
.ss-rec-item{background:#f0faf5;border-left:4px solid #03c75a;border-radius:0 8px 8px 0;padding:14px 18px;font-size:14px;line-height:1.8;color:#333;}
.ss-cta{background:#111;padding:32px 28px;text-align:center;}
.ss-cta-text{color:#fff;font-size:clamp(15px,3vw,18px);line-height:1.9;margin-bottom:20px;white-space:pre-line;}
.ss-cta-btn{display:inline-block;background:#03c75a;color:#fff;font-size:16px;font-weight:900;padding:15px 44px;border-radius:8px;}
.ss-faq-item{border:1px solid #e8e8e8;border-radius:8px;margin-bottom:10px;overflow:hidden;}
.ss-faq-q{background:#f9f9f9;padding:14px 18px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;}
.ss-faq-q::before{content:"Q";background:#03c75a;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0;}
.ss-faq-a{padding:14px 18px 14px 48px;font-size:13px;line-height:1.9;color:#555;background:#fff;}
.ss-footer{background:#f9fff9;border-top:2px solid #03c75a;padding:20px 28px;display:flex;flex-wrap:wrap;gap:6px;}
.ss-footer-kw{background:#fff;border:1px solid #b3e8cc;border-radius:4px;padding:4px 12px;font-size:12px;color:#03c75a;font-weight:700;}
</style>
<div class="ss-wrap">
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:500px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="ss-header">
  <div class="ss-header-inner">
    <span class="ss-brand">NAVER SMARTSTORE</span>
    <div class="ss-score"><span>⭐ 판매량 급상승</span><span>👍 구매만족 98%</span></div>
  </div>
</div>
<div class="ss-hero">
  <div class="ss-kw-tags">${d.keywords.slice(0,5).map((k: string) => `<span class="ss-kw-tag">#${k}</span>`).join('')}</div>
  <div class="ss-product-name">${d.productName}</div>
  <div class="ss-copy">${d.oneLiner}</div>
  <div class="ss-price-area">
    <div class="ss-price-label">판매가</div>
    <div class="ss-price">${d.priceRange}</div>
    <div class="ss-price-info">
      <span>✅ 네이버페이 포인트 적립</span>
      <span>🚚 무료배송</span>
      <span>🔄 30일 무료반품</span>
    </div>
  </div>
</div>
<div class="ss-divider"></div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;" alt=""/></div><div class="ss-divider"></div>` : ''}
<div class="ss-section">
  <div class="ss-section-header"><div class="ss-section-bar"></div><div class="ss-section-title">핵심 특징</div></div>
  <div class="ss-feature-list">
    ${d.features.map((f: string, i: number) => `<div class="ss-feature-item"><div class="ss-feature-num">${i+1}</div><div class="ss-feature-text">${f}</div></div>`).join('')}
  </div>
</div>
<div class="ss-divider"></div>
<div class="ss-section" style="background:#fafafa;">
  <div class="ss-section-header"><div class="ss-section-bar"></div><div class="ss-section-title">상품 상세</div></div>
  <p class="ss-desc">${d.description}</p>
</div>
${d.img2Url ? `<div class="ss-divider"></div><div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="ss-divider"></div>
<div class="ss-section">
  <div class="ss-section-header"><div class="ss-section-bar"></div><div class="ss-section-title">이런 분께 추천</div></div>
  <div class="ss-rec-list">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).map((r: string) => `<div class="ss-rec-item">✅ ${r}</div>`).join('')}
  </div>
</div>
<div class="ss-divider"></div>
<div class="ss-cta">
  <div class="ss-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="ss-cta-btn">네이버페이로 구매하기</div>
</div>
${d.img3Url ? `<div class="ss-divider"></div><div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="ss-divider"></div>
<div class="ss-section">
  <div class="ss-section-header"><div class="ss-section-bar"></div><div class="ss-section-title">자주 묻는 질문</div></div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="ss-faq-item"><div class="ss-faq-q">${f.q}</div><div class="ss-faq-a">${f.a}</div></div>`).join('')}
</div>
<div class="ss-footer">${d.keywords.map((k: string) => `<span class="ss-footer-kw">#${k}</span>`).join('')}</div>
</div></html>`

// 10. 럭셔리 에디토리얼
const renderLuxuryEditorial = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#faf8f3;color:#1a1409;}
.le-wrap{max-width:860px;margin:0 auto;background:#faf8f3;}
.le-top-bar{border-top:3px solid #c9a84c;border-bottom:1px solid #ddd5b8;padding:12px 48px;display:flex;justify-content:space-between;align-items:center;}
.le-top-label{font-size:10px;letter-spacing:4px;color:#c9a84c;font-weight:500;text-transform:uppercase;}
.le-top-line{width:60px;height:1px;background:#c9a84c;}
.le-hero{padding:80px 48px 60px;border-bottom:1px solid #ddd5b8;}
.le-hero-sub{font-size:11px;letter-spacing:6px;color:#c9a84c;text-transform:uppercase;margin-bottom:24px;font-weight:500;}
.le-hero-name{font-family:'Noto Serif KR',serif;font-size:clamp(32px,6vw,56px);font-weight:900;line-height:1.15;margin-bottom:24px;letter-spacing:-1px;}
.le-hero-line{width:60px;height:2px;background:#c9a84c;margin-bottom:24px;}
.le-hero-copy{font-size:clamp(15px,2.5vw,19px);font-weight:300;line-height:1.9;color:#5a4e3a;font-style:italic;margin-bottom:36px;}
.le-price-row{display:flex;align-items:baseline;gap:16px;}
.le-price{font-family:'Noto Serif KR',serif;font-size:clamp(24px,4vw,36px);font-weight:700;color:#c9a84c;}
.le-price-label{font-size:12px;letter-spacing:2px;color:#888;text-transform:uppercase;}
.le-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0;border-top:1px solid #ddd5b8;border-left:1px solid #ddd5b8;}
.le-feature-item{padding:24px 28px;border-right:1px solid #ddd5b8;border-bottom:1px solid #ddd5b8;}
.le-feature-num{font-family:'Noto Serif KR',serif;font-size:28px;font-weight:900;color:#c9a84c;opacity:0.3;line-height:1;margin-bottom:8px;}
.le-feature-text{font-size:13px;line-height:1.8;color:#4a3f2e;}
.le-section{padding:60px 48px;border-bottom:1px solid #ddd5b8;}
.le-section.alt{background:#f2ede0;}
.le-section-label{font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;margin-bottom:6px;font-weight:500;}
.le-section-title{font-family:'Noto Serif KR',serif;font-size:clamp(18px,3vw,24px);font-weight:700;margin-bottom:28px;color:#1a1409;}
.le-desc{font-size:15px;line-height:2.4;color:#4a3f2e;white-space:pre-line;font-weight:300;}
.le-rec-items{display:flex;flex-direction:column;gap:20px;}
.le-rec-item{display:flex;gap:20px;align-items:flex-start;}
.le-rec-dash{width:24px;height:1px;background:#c9a84c;margin-top:12px;flex-shrink:0;}
.le-rec-text{font-size:14px;line-height:2;color:#4a3f2e;font-weight:300;}
.le-cta{padding:60px 48px;background:#1a1409;text-align:center;}
.le-cta-sub{font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;margin-bottom:16px;}
.le-cta-text{font-family:'Noto Serif KR',serif;font-size:clamp(17px,3vw,22px);color:#faf8f3;line-height:1.9;margin-bottom:32px;font-weight:300;font-style:italic;white-space:pre-line;}
.le-cta-btn{display:inline-block;border:1px solid #c9a84c;color:#c9a84c;font-size:12px;letter-spacing:3px;text-transform:uppercase;padding:14px 40px;}
.le-faq{padding:60px 48px;border-bottom:1px solid #ddd5b8;}
.le-faq-item{padding:20px 0;border-bottom:1px solid #ddd5b8;display:grid;grid-template-columns:1fr 2fr;gap:24px;}
.le-faq-item:last-child{border:none;}
.le-faq-q{font-size:13px;font-weight:700;color:#1a1409;line-height:1.7;}
.le-faq-a{font-size:13px;color:#5a4e3a;line-height:1.9;font-weight:300;}
.le-footer{padding:28px 48px;border-top:1px solid #ddd5b8;display:flex;flex-wrap:wrap;gap:8px;}
.le-kw{font-size:11px;letter-spacing:1px;color:#c9a84c;padding:4px 0;margin-right:16px;}
.le-kw::before{content:"— ";}
</style>
<div class="le-wrap">
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="le-top-bar"><span class="le-top-label">Premium Collection</span><div class="le-top-line"></div><span class="le-top-label">Exclusive</span></div>
<div class="le-hero">
  <div class="le-hero-sub">Selected Product</div>
  <div class="le-hero-name">${d.productName}</div>
  <div class="le-hero-line"></div>
  <div class="le-hero-copy">${d.oneLiner}</div>
  <div class="le-price-row"><div class="le-price">${d.priceRange}</div><div class="le-price-label">Price</div></div>
</div>
<div class="le-features">
  ${d.features.map((f: string, i: number) => `<div class="le-feature-item"><div class="le-feature-num">0${i+1}</div><div class="le-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="le-section">
  <div class="le-section-label">Details</div>
  <div class="le-section-title">상품 상세</div>
  <p class="le-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="le-section alt">
  <div class="le-section-label">For You</div>
  <div class="le-section-title">이런 분께 추천</div>
  <div class="le-rec-items">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).map((r: string) => `<div class="le-rec-item"><div class="le-rec-dash"></div><div class="le-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="le-cta">
  <div class="le-cta-sub">Limited Offer</div>
  <div class="le-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="le-cta-btn">지금 구매하기</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="le-faq">
  <div class="le-section-label">FAQ</div>
  <div class="le-section-title" style="margin-bottom:20px;">자주 묻는 질문</div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="le-faq-item"><div class="le-faq-q">${f.q}</div><div class="le-faq-a">${f.a}</div></div>`).join('')}
</div>
<div class="le-footer">${d.keywords.map((k: string) => `<span class="le-kw">${k}</span>`).join('')}</div>
</div></html>`

// 11. 사이버펑크 네온
const renderCyberpunk = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#050508;color:#e0e0ff;}
.cy-wrap{max-width:860px;margin:0 auto;background:#050508;position:relative;}
.cy-scanline{position:fixed;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,245,0.015) 2px,rgba(0,255,245,0.015) 4px);pointer-events:none;z-index:1;}
.cy-hero{padding:60px 40px;border-bottom:1px solid rgba(0,255,245,0.2);position:relative;}
.cy-hero::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00fff5,transparent);}
.cy-tag{font-size:11px;letter-spacing:4px;color:#00fff5;text-transform:uppercase;margin-bottom:16px;font-family:'Orbitron',monospace;}
.cy-name{font-family:'Orbitron',monospace;font-size:clamp(22px,5vw,40px);font-weight:900;line-height:1.2;margin-bottom:16px;color:#fff;text-shadow:0 0 20px rgba(0,255,245,0.5),0 0 40px rgba(0,255,245,0.3);}
.cy-copy{font-size:15px;color:rgba(224,224,255,0.7);margin-bottom:24px;line-height:1.8;border-left:2px solid #00fff5;padding-left:16px;}
.cy-price-box{display:inline-flex;align-items:center;gap:16px;border:1px solid #00fff5;padding:14px 24px;box-shadow:0 0 20px rgba(0,255,245,0.15),inset 0 0 20px rgba(0,255,245,0.05);}
.cy-price{font-family:'Orbitron',monospace;font-size:clamp(22px,4vw,32px);font-weight:900;color:#00fff5;text-shadow:0 0 15px rgba(0,255,245,0.8);}
.cy-price-label{font-size:11px;color:rgba(0,255,245,0.6);letter-spacing:2px;text-transform:uppercase;}
.cy-features{padding:40px;border-bottom:1px solid rgba(0,255,245,0.15);}
.cy-features-title{font-family:'Orbitron',monospace;font-size:14px;letter-spacing:3px;color:#00fff5;margin-bottom:20px;text-transform:uppercase;}
.cy-feature-item{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.cy-feature-bar{width:3px;height:100%;background:linear-gradient(180deg,#00fff5,#ff00e5);flex-shrink:0;align-self:stretch;min-height:20px;}
.cy-feature-text{font-size:14px;color:rgba(224,224,255,0.85);line-height:1.7;}
.cy-section{padding:40px;border-bottom:1px solid rgba(0,255,245,0.15);}
.cy-section-title{font-family:'Orbitron',monospace;font-size:13px;letter-spacing:3px;color:#ff00e5;margin-bottom:20px;text-transform:uppercase;text-shadow:0 0 10px rgba(255,0,229,0.5);}
.cy-desc{font-size:14px;line-height:2.2;color:rgba(224,224,255,0.75);white-space:pre-line;}
.cy-rec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
.cy-rec-card{border:1px solid rgba(0,255,245,0.2);padding:18px;position:relative;background:rgba(0,255,245,0.03);}
.cy-rec-card::before{content:'';position:absolute;top:0;left:0;width:30px;height:2px;background:#00fff5;}
.cy-rec-text{font-size:13px;color:rgba(224,224,255,0.7);line-height:1.8;}
.cy-cta{padding:48px 40px;text-align:center;border-bottom:1px solid rgba(0,255,245,0.15);background:linear-gradient(135deg,rgba(0,255,245,0.05),rgba(255,0,229,0.05));}
.cy-cta-text{font-size:clamp(14px,2.5vw,17px);color:rgba(224,224,255,0.85);line-height:2;margin-bottom:28px;white-space:pre-line;}
.cy-cta-btn{display:inline-block;background:transparent;border:2px solid #00fff5;color:#00fff5;font-family:'Orbitron',monospace;font-size:13px;letter-spacing:2px;padding:14px 36px;text-transform:uppercase;box-shadow:0 0 20px rgba(0,255,245,0.3),inset 0 0 20px rgba(0,255,245,0.05);}
.cy-faq{padding:40px;}
.cy-faq-item{border-left:2px solid rgba(0,255,245,0.3);padding:16px 20px;margin-bottom:12px;background:rgba(0,255,245,0.02);}
.cy-faq-q{font-size:14px;font-weight:700;color:#00fff5;margin-bottom:8px;}
.cy-faq-a{font-size:13px;color:rgba(224,224,255,0.65);line-height:1.9;}
.cy-footer{padding:20px 40px;border-top:1px solid rgba(0,255,245,0.2);display:flex;flex-wrap:wrap;gap:8px;}
.cy-kw{border:1px solid rgba(0,255,245,0.25);padding:4px 12px;font-size:11px;color:rgba(0,255,245,0.6);font-family:'Orbitron',monospace;letter-spacing:1px;}
</style>
<div class="cy-wrap">
<div class="cy-scanline"></div>
${d.thumbUrl ? `<div style="width:100%;line-height:0;position:relative;"><img src="${d.thumbUrl}" style="width:100%;max-height:500px;object-fit:cover;display:block;filter:saturate(1.2) contrast(1.1);" alt=""/></div>` : ''}
<div class="cy-hero">
  <div class="cy-tag">// PRODUCT_SPEC_LOADED</div>
  <div class="cy-name">${d.productName}</div>
  <div class="cy-copy">${d.oneLiner}</div>
  <div class="cy-price-box"><div><div class="cy-price-label">PRICE</div><div class="cy-price">${d.priceRange}</div></div></div>
</div>
<div class="cy-features">
  <div class="cy-features-title">// CORE_SPECS</div>
  ${d.features.map((f: string) => `<div class="cy-feature-item"><div class="cy-feature-bar"></div><div class="cy-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;filter:saturate(1.1);" alt=""/></div>` : ''}
<div class="cy-section">
  <div class="cy-section-title">// FULL_SPEC_DETAIL</div>
  <p class="cy-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="cy-section">
  <div class="cy-section-title">// TARGET_USER_PROFILE</div>
  <div class="cy-rec-grid">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).slice(0,3).map((r: string) => `<div class="cy-rec-card"><div class="cy-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="cy-cta">
  <div class="cy-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="cy-cta-btn">ACQUIRE_NOW.EXE</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="cy-faq">
  <div class="cy-section-title">// FAQ_DATABASE</div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="cy-faq-item"><div class="cy-faq-q">> ${f.q}</div><div class="cy-faq-a">${f.a}</div></div>`).join('')}
</div>
<div class="cy-footer">${d.keywords.map((k: string) => `<span class="cy-kw">#${k}</span>`).join('')}</div>
</div></html>`

// 12. 북유럽 미니멀
const renderNordic = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#f4f3f0;color:#1a1a1a;}
.nd-wrap{max-width:860px;margin:0 auto;background:#f4f3f0;}
.nd-nav{padding:20px 56px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d8d5ce;}
.nd-nav-left{font-size:10px;letter-spacing:4px;color:#888;text-transform:uppercase;}
.nd-nav-right{font-size:10px;color:#888;letter-spacing:1px;}
.nd-hero{padding:72px 56px 56px;}
.nd-hero-category{font-size:10px;letter-spacing:4px;color:#aaa;text-transform:uppercase;margin-bottom:20px;}
.nd-hero-name{font-family:'DM Serif Display',serif;font-size:clamp(36px,7vw,64px);font-weight:400;line-height:1.1;margin-bottom:28px;letter-spacing:-2px;}
.nd-hero-copy{font-size:clamp(15px,2.5vw,18px);font-weight:300;line-height:1.9;color:#555;max-width:520px;margin-bottom:40px;}
.nd-hero-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding-top:32px;border-top:1px solid #d8d5ce;}
.nd-price{font-family:'DM Serif Display',serif;font-size:clamp(24px,4vw,36px);color:#1a1a1a;}
.nd-price-label{font-size:10px;letter-spacing:2px;color:#aaa;text-transform:uppercase;margin-bottom:4px;}
.nd-features{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #d8d5ce;border-left:1px solid #d8d5ce;}
.nd-feature{padding:28px 32px;border-right:1px solid #d8d5ce;border-bottom:1px solid #d8d5ce;}
.nd-feature-n{font-family:'DM Serif Display',serif;font-size:36px;color:#d8d5ce;margin-bottom:6px;}
.nd-feature-text{font-size:13px;font-weight:300;color:#555;line-height:1.9;}
.nd-section{padding:56px;}
.nd-section+.nd-section{border-top:1px solid #d8d5ce;}
.nd-section-meta{font-size:10px;letter-spacing:3px;color:#aaa;text-transform:uppercase;margin-bottom:6px;}
.nd-section-title{font-family:'DM Serif Display',serif;font-size:clamp(22px,4vw,30px);margin-bottom:28px;font-weight:400;}
.nd-desc{font-size:15px;line-height:2.4;font-weight:300;color:#333;white-space:pre-line;}
.nd-rec-list{display:flex;flex-direction:column;gap:16px;}
.nd-rec-item{padding:20px 24px;background:#ebe9e3;font-size:14px;font-weight:300;line-height:1.9;color:#444;}
.nd-cta{background:#1a1a1a;padding:64px 56px;text-align:left;}
.nd-cta-meta{font-size:10px;letter-spacing:3px;color:#666;text-transform:uppercase;margin-bottom:12px;}
.nd-cta-title{font-family:'DM Serif Display',serif;font-size:clamp(24px,4vw,36px);color:#f4f3f0;margin-bottom:24px;font-style:italic;font-weight:400;line-height:1.5;}
.nd-cta-text{font-size:14px;font-weight:300;color:#888;line-height:2;margin-bottom:32px;white-space:pre-line;}
.nd-cta-btn{display:inline-block;border:1px solid #f4f3f0;color:#f4f3f0;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:14px 36px;}
.nd-faq-item{padding:24px 0;border-bottom:1px solid #d8d5ce;display:flex;gap:24px;}
.nd-faq-num{font-family:'DM Serif Display',serif;font-size:20px;color:#d8d5ce;flex-shrink:0;width:32px;}
.nd-faq-content{}
.nd-faq-q{font-size:14px;font-weight:500;margin-bottom:8px;}
.nd-faq-a{font-size:13px;font-weight:300;color:#666;line-height:1.9;}
.nd-footer{padding:24px 56px;border-top:1px solid #d8d5ce;display:flex;flex-wrap:wrap;gap:4px;align-items:center;}
.nd-footer-label{font-size:10px;letter-spacing:2px;color:#aaa;text-transform:uppercase;margin-right:12px;}
.nd-kw{font-size:12px;color:#888;margin-right:8px;font-weight:300;}
.nd-kw::before{content:"/ ";}
</style>
<div class="nd-wrap">
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:560px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="nd-nav"><span class="nd-nav-left">Product Detail</span><span class="nd-nav-right">${d.priceRange}</span></div>
<div class="nd-hero">
  <div class="nd-hero-category">Selected Item</div>
  <div class="nd-hero-name">${d.productName}</div>
  <div class="nd-hero-copy">${d.oneLiner}</div>
  <div class="nd-hero-bottom">
    <div><div class="nd-price-label">Price</div><div class="nd-price">${d.priceRange}</div></div>
    <div style="font-size:12px;color:#aaa;font-weight:300;">${d.keywords.slice(0,3).map((k: string) => `#${k}`).join('  ')}</div>
  </div>
</div>
<div class="nd-features">
  ${d.features.map((f: string, i: number) => `<div class="nd-feature"><div class="nd-feature-n">0${i+1}</div><div class="nd-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="nd-section">
  <div class="nd-section-meta">About</div>
  <div class="nd-section-title">상품 상세</div>
  <p class="nd-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="nd-section">
  <div class="nd-section-meta">For</div>
  <div class="nd-section-title">이런 분께 추천</div>
  <div class="nd-rec-list">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).map((r: string) => `<div class="nd-rec-item">${r}</div>`).join('')}
  </div>
</div>
<div class="nd-cta">
  <div class="nd-cta-meta">Limited Time</div>
  <div class="nd-cta-title">"${d.oneLiner}"</div>
  <div class="nd-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="nd-cta-btn">구매하기</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="nd-section">
  <div class="nd-section-meta">FAQ</div>
  <div class="nd-section-title">자주 묻는 질문</div>
  ${d.faq.map((f: {q:string;a:string}, i: number) => `<div class="nd-faq-item"><div class="nd-faq-num">0${i+1}</div><div class="nd-faq-content"><div class="nd-faq-q">${f.q}</div><div class="nd-faq-a">${f.a}</div></div></div>`).join('')}
</div>
<div class="nd-footer"><span class="nd-footer-label">Tags</span>${d.keywords.map((k: string) => `<span class="nd-kw">${k}</span>`).join('')}</div>
</div></html>`

// 13. K-뷰티 감성
const renderKbeauty = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#fff5f9;color:#2a1a22;}
.kb-wrap{max-width:860px;margin:0 auto;background:#fff5f9;}
.kb-hero{background:linear-gradient(160deg,#fff0f5 0%,#ffd6e8 50%,#f5c6e0 100%);padding:60px 40px;text-align:center;position:relative;overflow:hidden;}
.kb-hero::before{content:'✦';position:absolute;top:20px;right:30px;font-size:80px;color:rgba(255,100,150,0.1);}
.kb-hero::after{content:'✦';position:absolute;bottom:20px;left:30px;font-size:50px;color:rgba(255,100,150,0.1);}
.kb-hero-badge{display:inline-block;background:#ff4f9f;color:#fff;font-size:11px;letter-spacing:2px;padding:5px 16px;border-radius:20px;margin-bottom:16px;font-weight:700;}
.kb-hero-name{font-size:clamp(24px,5vw,38px);font-weight:900;color:#1a0a14;margin-bottom:12px;line-height:1.3;}
.kb-hero-copy{font-family:'Playfair Display',serif;font-size:clamp(15px,2.5vw,19px);font-style:italic;color:#7a3a5a;margin-bottom:24px;line-height:1.7;}
.kb-price-pill{display:inline-block;background:#fff;border:2px solid #ff4f9f;border-radius:40px;padding:12px 32px;}
.kb-price{font-size:clamp(22px,4vw,30px);font-weight:900;color:#ff4f9f;}
.kb-features{background:#fff;padding:32px 40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;}
.kb-feature-dot{text-align:center;padding:20px 12px;}
.kb-feature-circle{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#ffb3d1,#ff4f9f);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:22px;}
.kb-feature-text{font-size:12px;font-weight:700;color:#2a1a22;line-height:1.5;text-align:center;}
.kb-section{padding:40px;}
.kb-section.alt{background:#fff;}
.kb-section-title{font-size:18px;font-weight:900;color:#ff4f9f;margin-bottom:6px;text-align:center;}
.kb-section-sub{font-size:12px;color:#aaa;text-align:center;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;}
.kb-divider{width:40px;height:2px;background:linear-gradient(90deg,#ff4f9f,#ffb3d1);margin:0 auto 24px;}
.kb-desc{font-size:14px;line-height:2.3;color:#444;white-space:pre-line;font-weight:300;}
.kb-rec-cards{display:flex;flex-direction:column;gap:12px;}
.kb-rec-card{background:#fff;border-radius:16px;padding:18px 20px;display:flex;gap:14px;align-items:flex-start;border:1px solid #ffd6e8;box-shadow:0 4px 16px rgba(255,79,159,0.06);}
.kb-rec-icon{font-size:28px;flex-shrink:0;}
.kb-rec-text{font-size:13px;line-height:1.9;color:#555;font-weight:300;}
.kb-cta{background:linear-gradient(135deg,#ff4f9f,#ff8cc8);padding:48px 40px;text-align:center;}
.kb-cta-text{font-size:clamp(14px,2.5vw,17px);color:#fff;line-height:2;margin-bottom:24px;white-space:pre-line;}
.kb-cta-btn{display:inline-block;background:#fff;color:#ff4f9f;font-size:15px;font-weight:900;padding:14px 40px;border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,0.15);}
.kb-faq{padding:40px;background:#fff;}
.kb-faq-item{background:#fff5f9;border-radius:12px;padding:16px 20px;margin-bottom:10px;border-left:3px solid #ff4f9f;}
.kb-faq-q{font-size:14px;font-weight:700;color:#2a1a22;margin-bottom:6px;}
.kb-faq-a{font-size:13px;color:#666;line-height:1.9;font-weight:300;}
.kb-keywords{padding:20px 40px 32px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}
.kb-kw{background:#fff;border:1px solid #ffb3d1;border-radius:20px;padding:5px 14px;font-size:12px;color:#ff4f9f;font-weight:700;}
</style>
<div class="kb-wrap">
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:500px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="kb-hero">
  <div class="kb-hero-badge">✦ BEAUTY PICK ✦</div>
  <div class="kb-hero-name">${d.productName}</div>
  <div class="kb-hero-copy">${d.oneLiner}</div>
  <div class="kb-price-pill"><div class="kb-price">${d.priceRange}</div></div>
</div>
<div class="kb-features">
  ${d.features.map((f: string, i: number) => `<div class="kb-feature-dot"><div class="kb-feature-circle">${['✨','💎','🌸','🌿','⭐','💫','🎯','🔬'][i]||'✦'}</div><div class="kb-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="kb-section alt">
  <div class="kb-section-title">상품 상세</div>
  <div class="kb-section-sub">Product Details</div>
  <div class="kb-divider"></div>
  <p class="kb-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="kb-section">
  <div class="kb-section-title">이런 분께 추천</div>
  <div class="kb-section-sub">Recommended For</div>
  <div class="kb-divider"></div>
  <div class="kb-rec-cards">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).slice(0,4).map((r: string, i: number) => `<div class="kb-rec-card"><div class="kb-rec-icon">${['🌸','💄','✨','🌿'][i]||'💖'}</div><div class="kb-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="kb-cta">
  <div class="kb-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="kb-cta-btn">지금 만나보기 ✦</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="kb-faq">
  <div class="kb-section-title">자주 묻는 질문</div>
  <div class="kb-section-sub">FAQ</div>
  <div class="kb-divider"></div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="kb-faq-item"><div class="kb-faq-q">Q. ${f.q}</div><div class="kb-faq-a">A. ${f.a}</div></div>`).join('')}
</div>
<div class="kb-keywords">${d.keywords.map((k: string) => `<span class="kb-kw">#${k}</span>`).join('')}</div>
</div></html>`

// 14. 스포츠 다이나믹
const renderSports = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#0a0a0a;color:#f0f0f0;}
.sp-wrap{max-width:860px;margin:0 auto;background:#0a0a0a;}
.sp-hero{position:relative;overflow:hidden;background:#0a0a0a;padding:0;}
.sp-hero-bg{background:linear-gradient(135deg,#0a0a0a 40%,#1a1a00 100%);padding:60px 40px 0;position:relative;}
.sp-hero-bg::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(45deg,transparent,transparent 40px,rgba(212,255,0,0.02) 40px,rgba(212,255,0,0.02) 80px);}
.sp-tag{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:6px;color:#d4ff00;margin-bottom:12px;}
.sp-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(40px,9vw,80px);line-height:0.95;letter-spacing:-1px;color:#fff;margin-bottom:16px;}
.sp-name span{color:#d4ff00;display:block;}
.sp-copy{font-size:15px;color:rgba(240,240,240,0.6);line-height:1.7;max-width:480px;margin-bottom:32px;}
.sp-price-strip{background:#d4ff00;padding:16px 40px;display:flex;align-items:center;gap:24px;flex-wrap:wrap;}
.sp-price{font-family:'Bebas Neue',sans-serif;font-size:clamp(28px,5vw,42px);color:#0a0a0a;letter-spacing:1px;}
.sp-price-label{font-size:12px;color:#0a0a0a;font-weight:700;letter-spacing:2px;text-transform:uppercase;}
.sp-features{padding:40px;}
.sp-features-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:4px;color:#d4ff00;margin-bottom:20px;}
.sp-feature-item{display:flex;align-items:center;gap:0;margin-bottom:2px;}
.sp-feature-bar{height:40px;background:linear-gradient(90deg,#d4ff00,#a8cc00);display:flex;align-items:center;padding:0 16px;min-width:40px;font-family:'Bebas Neue',sans-serif;font-size:18px;color:#0a0a0a;flex-shrink:0;}
.sp-feature-text{background:#111;flex:1;height:40px;display:flex;align-items:center;padding:0 16px;font-size:13px;color:#ccc;border-left:2px solid #d4ff00;}
.sp-section{padding:40px;border-top:1px solid #222;}
.sp-section-title{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:3px;color:#fff;margin-bottom:20px;display:flex;align-items:center;gap:12px;}
.sp-section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#d4ff00,transparent);}
.sp-desc{font-size:14px;line-height:2.2;color:#aaa;white-space:pre-line;}
.sp-rec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2px;}
.sp-rec-card{background:#111;padding:20px;border-top:3px solid #d4ff00;}
.sp-rec-num{font-family:'Bebas Neue',sans-serif;font-size:36px;color:#d4ff00;opacity:0.3;margin-bottom:6px;}
.sp-rec-text{font-size:13px;color:#999;line-height:1.8;}
.sp-cta{background:#d4ff00;padding:48px 40px;text-align:center;position:relative;overflow:hidden;}
.sp-cta::before{content:'GO';font-family:'Bebas Neue',sans-serif;font-size:200px;color:rgba(0,0,0,0.06);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
.sp-cta-text{font-size:clamp(15px,3vw,19px);color:#0a0a0a;font-weight:900;line-height:1.8;margin-bottom:24px;white-space:pre-line;position:relative;}
.sp-cta-btn{display:inline-block;background:#0a0a0a;color:#d4ff00;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;padding:16px 48px;position:relative;}
.sp-faq-item{display:flex;gap:0;margin-bottom:2px;}
.sp-faq-q-box{background:#111;padding:14px 16px;min-width:32px;display:flex;align-items:flex-start;justify-content:center;border-top:2px solid #d4ff00;}
.sp-faq-q-label{font-family:'Bebas Neue',sans-serif;font-size:16px;color:#d4ff00;}
.sp-faq-content{background:#0d0d0d;flex:1;padding:14px 18px;}
.sp-faq-q{font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;}
.sp-faq-a{font-size:13px;color:#777;line-height:1.8;}
.sp-footer{padding:20px 40px;background:#111;display:flex;flex-wrap:wrap;gap:6px;}
.sp-kw{border:1px solid #333;padding:4px 12px;font-size:11px;color:#666;font-weight:700;letter-spacing:1px;}
.sp-kw:hover{border-color:#d4ff00;color:#d4ff00;}
</style>
<div class="sp-wrap">
<div class="sp-hero">
<div class="sp-hero-bg">
  <div class="sp-tag">PERFORMANCE GEAR</div>
  <div class="sp-name">${d.productName.split(' ').slice(0,2).join(' ')}<span>${d.productName.split(' ').slice(2).join(' ')||'PRO'}</span></div>
  <div class="sp-copy">${d.oneLiner}</div>
</div>
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:460px;object-fit:cover;display:block;filter:contrast(1.1) saturate(0.9);" alt=""/></div>` : ''}
<div class="sp-price-strip"><div class="sp-price-label">PRICE</div><div class="sp-price">${d.priceRange}</div><div style="font-size:12px;color:#0a0a0a;font-weight:700;">FREE DELIVERY</div></div>
</div>
<div class="sp-features">
  <div class="sp-features-title">CORE SPECS</div>
  ${d.features.map((f: string, i: number) => `<div class="sp-feature-item"><div class="sp-feature-bar">0${i+1}</div><div class="sp-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;filter:contrast(1.1);" alt=""/></div>` : ''}
<div class="sp-section">
  <div class="sp-section-title">DETAIL</div>
  <p class="sp-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="sp-section">
  <div class="sp-section-title">WHO</div>
  <div class="sp-rec-grid">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).slice(0,3).map((r: string, i: number) => `<div class="sp-rec-card"><div class="sp-rec-num">0${i+1}</div><div class="sp-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="sp-cta">
  <div class="sp-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="sp-cta-btn">SHOP NOW</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="sp-section">
  <div class="sp-section-title">FAQ</div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="sp-faq-item"><div class="sp-faq-q-box"><div class="sp-faq-q-label">Q</div></div><div class="sp-faq-content"><div class="sp-faq-q">${f.q}</div><div class="sp-faq-a">${f.a}</div></div></div>`).join('')}
</div>
<div class="sp-footer">${d.keywords.map((k: string) => `<span class="sp-kw">#${k.toUpperCase()}</span>`).join('')}</div>
</div></html>`

// 15. 따뜻한 수공예
const renderHandcraft = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#fdf6ec;color:#3d2b1a;}
.hc-wrap{max-width:860px;margin:0 auto;background:#fdf6ec;}
.hc-hero{padding:56px 48px;text-align:center;border-bottom:2px dashed #e8d5b8;}
.hc-hero-leaf{font-size:32px;margin-bottom:12px;}
.hc-hero-sub{font-size:11px;letter-spacing:3px;color:#b07840;text-transform:uppercase;margin-bottom:16px;}
.hc-hero-name{font-family:'Noto Serif KR',serif;font-size:clamp(26px,5vw,40px);font-weight:900;line-height:1.3;margin-bottom:16px;color:#2c1a08;}
.hc-hero-copy{font-size:clamp(14px,2.5vw,17px);color:#7a5c3a;line-height:1.9;margin-bottom:28px;font-weight:300;}
.hc-price-wrap{display:inline-block;background:#fff;border:2px solid #e8d5b8;border-radius:20px;padding:12px 28px;}
.hc-price{font-family:'Noto Serif KR',serif;font-size:clamp(20px,4vw,28px);color:#b07840;font-weight:700;}
.hc-features{padding:40px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;background:#fff8f0;border-top:1px solid #f0e0c8;border-bottom:1px solid #f0e0c8;}
.hc-feature-card{background:#fdf6ec;border:1px solid #e8d5b8;border-radius:16px;padding:20px;text-align:center;}
.hc-feature-icon{font-size:28px;margin-bottom:8px;}
.hc-feature-text{font-size:13px;color:#5a3e28;line-height:1.7;font-weight:400;}
.hc-section{padding:48px;}
.hc-section+.hc-section{border-top:2px dashed #e8d5b8;}
.hc-section.alt{background:#fff8f0;}
.hc-section-leaf{font-size:20px;margin-bottom:8px;text-align:center;}
.hc-section-title{font-family:'Noto Serif KR',serif;font-size:clamp(18px,3.5vw,24px);font-weight:900;color:#2c1a08;margin-bottom:20px;text-align:center;}
.hc-desc{font-size:15px;line-height:2.3;color:#5a3e28;white-space:pre-line;font-weight:300;}
.hc-rec-list{display:flex;flex-direction:column;gap:12px;}
.hc-rec-item{background:#fff;border:1px solid #e8d5b8;border-radius:14px;padding:16px 20px;display:flex;gap:12px;align-items:flex-start;}
.hc-rec-icon{font-size:20px;flex-shrink:0;margin-top:2px;}
.hc-rec-text{font-size:14px;line-height:1.9;color:#5a3e28;font-weight:300;}
.hc-cta{background:linear-gradient(135deg,#8b5e3c,#c49060);padding:52px 48px;text-align:center;}
.hc-cta-icon{font-size:40px;margin-bottom:16px;}
.hc-cta-text{font-size:clamp(14px,2.5vw,17px);color:rgba(255,248,240,0.9);line-height:2;margin-bottom:28px;white-space:pre-line;}
.hc-cta-btn{display:inline-block;background:#fdf6ec;color:#8b5e3c;font-size:15px;font-weight:700;padding:14px 36px;border-radius:40px;}
.hc-faq{padding:48px;}
.hc-faq-item{background:#fff;border-radius:14px;padding:18px 22px;margin-bottom:10px;border:1px solid #e8d5b8;}
.hc-faq-q{font-size:14px;font-weight:700;color:#2c1a08;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.hc-faq-q::before{content:"🌿";font-size:14px;}
.hc-faq-a{font-size:13px;color:#7a5c3a;line-height:1.9;padding-left:22px;font-weight:300;}
.hc-footer{padding:24px 48px;border-top:2px dashed #e8d5b8;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.hc-kw{background:#fff;border:1px solid #e8d5b8;border-radius:20px;padding:5px 14px;font-size:12px;color:#b07840;}
</style>
<div class="hc-wrap">
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:500px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="hc-hero">
  <div class="hc-hero-leaf">🌿</div>
  <div class="hc-hero-sub">Handmade with Love</div>
  <div class="hc-hero-name">${d.productName}</div>
  <div class="hc-hero-copy">${d.oneLiner}</div>
  <div class="hc-price-wrap"><div class="hc-price">${d.priceRange}</div></div>
</div>
<div class="hc-features">
  ${d.features.map((f: string, i: number) => `<div class="hc-feature-card"><div class="hc-feature-icon">${['🌱','🍯','✂️','🎁','🔆','💚','🧵','🪡'][i]||'✦'}</div><div class="hc-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="hc-section">
  <div class="hc-section-leaf">📖</div>
  <div class="hc-section-title">상품 이야기</div>
  <p class="hc-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="hc-section alt">
  <div class="hc-section-leaf">🌸</div>
  <div class="hc-section-title">이런 분께 어울려요</div>
  <div class="hc-rec-list">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).map((r: string, i: number) => `<div class="hc-rec-item"><div class="hc-rec-icon">${['🌷','🌼','🌻','🌺'][i]||'🌸'}</div><div class="hc-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="hc-cta">
  <div class="hc-cta-icon">🎁</div>
  <div class="hc-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="hc-cta-btn">지금 만나보세요 🌿</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="hc-faq">
  <div class="hc-section-leaf">💌</div>
  <div class="hc-section-title">자주 묻는 질문</div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="hc-faq-item"><div class="hc-faq-q">${f.q}</div><div class="hc-faq-a">${f.a}</div></div>`).join('')}
</div>
<div class="hc-footer">${d.keywords.map((k: string) => `<span class="hc-kw">#${k}</span>`).join('')}</div>
</div></html>`

// 16. 프리미엄 블랙
const renderBlackLuxury = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Noto+Sans+KR:wght@300;400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#000;color:#e8e0d0;}
.bl-wrap{max-width:860px;margin:0 auto;background:#000;}
.bl-top{padding:16px 56px;border-bottom:1px solid #c9a84c;display:flex;justify-content:space-between;align-items:center;}
.bl-top-brand{font-size:9px;letter-spacing:6px;color:#c9a84c;text-transform:uppercase;}
.bl-top-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);margin:0 20px;}
.bl-hero{padding:80px 56px;border-bottom:1px solid #1a1a1a;}
.bl-hero-eyebrow{font-size:9px;letter-spacing:6px;color:#c9a84c;text-transform:uppercase;margin-bottom:24px;}
.bl-hero-name{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,7vw,68px);font-weight:700;line-height:1.1;margin-bottom:24px;letter-spacing:-1px;}
.bl-hero-divider{width:48px;height:1px;background:#c9a84c;margin-bottom:24px;}
.bl-hero-copy{font-family:'Cormorant Garamond',serif;font-size:clamp(17px,2.5vw,22px);font-style:italic;color:#a09080;line-height:1.8;margin-bottom:40px;}
.bl-price-area{display:flex;align-items:center;gap:24px;}
.bl-price-label{font-size:9px;letter-spacing:4px;color:#666;text-transform:uppercase;}
.bl-price{font-family:'Cormorant Garamond',serif;font-size:clamp(26px,4vw,40px);color:#c9a84c;font-weight:400;}
.bl-features{display:grid;grid-template-columns:1fr 1fr;border:1px solid #1a1a1a;}
.bl-feature{padding:32px 40px;border-right:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;position:relative;}
.bl-feature::before{content:'';position:absolute;top:0;left:0;width:2px;height:0;background:#c9a84c;transition:height 0.3s;}
.bl-feature:hover::before{height:100%;}
.bl-feature-n{font-family:'Cormorant Garamond',serif;font-size:48px;color:#1a1a1a;margin-bottom:10px;}
.bl-feature-text{font-size:13px;font-weight:300;color:#888;line-height:1.9;}
.bl-section{padding:64px 56px;border-bottom:1px solid #111;}
.bl-section.alt{background:#050505;}
.bl-section-eyebrow{font-size:9px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;margin-bottom:8px;}
.bl-section-title{font-family:'Cormorant Garamond',serif;font-size:clamp(22px,4vw,30px);font-weight:400;margin-bottom:28px;}
.bl-desc{font-size:14px;line-height:2.5;color:#888;white-space:pre-line;font-weight:300;}
.bl-rec-list{display:flex;flex-direction:column;gap:0;}
.bl-rec-item{padding:20px 0;border-bottom:1px solid #111;display:flex;gap:20px;align-items:flex-start;}
.bl-rec-dash{width:20px;height:1px;background:#c9a84c;margin-top:10px;flex-shrink:0;}
.bl-rec-text{font-size:14px;color:#888;line-height:1.9;font-weight:300;}
.bl-cta{padding:72px 56px;text-align:center;border-bottom:1px solid #111;}
.bl-cta-eyebrow{font-size:9px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;margin-bottom:16px;}
.bl-cta-text{font-family:'Cormorant Garamond',serif;font-size:clamp(18px,3vw,26px);font-style:italic;color:#e8e0d0;line-height:1.8;margin-bottom:36px;white-space:pre-line;}
.bl-cta-btn{display:inline-block;border:1px solid #c9a84c;color:#c9a84c;font-size:9px;letter-spacing:5px;text-transform:uppercase;padding:16px 48px;}
.bl-faq{padding:64px 56px;}
.bl-faq-item{padding:22px 0;border-bottom:1px solid #111;display:grid;grid-template-columns:40px 1fr;gap:16px;}
.bl-faq-n{font-family:'Cormorant Garamond',serif;font-size:20px;color:#333;padding-top:2px;}
.bl-faq-q{font-size:13px;font-weight:400;color:#c9a84c;margin-bottom:6px;}
.bl-faq-a{font-size:13px;color:#666;line-height:1.9;font-weight:300;}
.bl-footer{padding:20px 56px;border-top:1px solid #c9a84c;display:flex;flex-wrap:wrap;gap:0;align-items:center;}
.bl-kw{font-size:10px;color:#333;padding:0 12px;letter-spacing:1px;}
.bl-kw:first-child{padding-left:0;}
.bl-kw+.bl-kw{border-left:1px solid #222;}
</style>
<div class="bl-wrap">
<div class="bl-top"><span class="bl-top-brand">Premium</span><div class="bl-top-line"></div><span class="bl-top-brand">Collection</span></div>
${d.thumbUrl ? `<div style="width:100%;line-height:0;"><img src="${d.thumbUrl}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="bl-hero">
  <div class="bl-hero-eyebrow">Selected Product</div>
  <div class="bl-hero-name">${d.productName}</div>
  <div class="bl-hero-divider"></div>
  <div class="bl-hero-copy">${d.oneLiner}</div>
  <div class="bl-price-area"><div class="bl-price-label">Price</div><div class="bl-price">${d.priceRange}</div></div>
</div>
<div class="bl-features">
  ${d.features.map((f: string, i: number) => `<div class="bl-feature"><div class="bl-feature-n">0${i+1}</div><div class="bl-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;"><img src="${d.img1Url}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="bl-section">
  <div class="bl-section-eyebrow">Details</div>
  <div class="bl-section-title">상품 상세</div>
  <p class="bl-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;"><img src="${d.img2Url}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="bl-section alt">
  <div class="bl-section-eyebrow">For You</div>
  <div class="bl-section-title">이런 분께 추천</div>
  <div class="bl-rec-list">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).map((r: string) => `<div class="bl-rec-item"><div class="bl-rec-dash"></div><div class="bl-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="bl-cta">
  <div class="bl-cta-eyebrow">Limited Offer</div>
  <div class="bl-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="bl-cta-btn">지금 구매하기</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;"><img src="${d.img3Url}" style="width:100%;max-height:600px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="bl-faq">
  <div class="bl-section-eyebrow">FAQ</div>
  <div class="bl-section-title">자주 묻는 질문</div>
  ${d.faq.map((f: {q:string;a:string}, i: number) => `<div class="bl-faq-item"><div class="bl-faq-n">0${i+1}</div><div><div class="bl-faq-q">${f.q}</div><div class="bl-faq-a">${f.a}</div></div></div>`).join('')}
</div>
<div class="bl-footer">${d.keywords.map((k: string) => `<span class="bl-kw">${k}</span>`).join('')}</div>
</div></html>`

// 17. 팝아트 레트로
const renderPopArt = (d: EditableData) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#fff;color:#111;}
.pa-wrap{max-width:860px;margin:0 auto;background:#fff;border:4px solid #111;}
.pa-hero{background:#ffe600;border-bottom:4px solid #111;padding:48px 40px;position:relative;overflow:hidden;}
.pa-hero-dots{position:absolute;top:0;left:0;right:0;bottom:0;background-image:radial-gradient(circle,#111 1px,transparent 1px);background-size:20px 20px;opacity:0.05;}
.pa-hero-tag{display:inline-block;background:#111;color:#ffe600;font-family:'Black Han Sans',sans-serif;font-size:12px;letter-spacing:2px;padding:4px 12px;margin-bottom:16px;}
.pa-hero-name{font-family:'Black Han Sans',sans-serif;font-size:clamp(30px,7vw,56px);line-height:1.1;color:#111;margin-bottom:12px;text-shadow:4px 4px 0 rgba(0,0,0,0.15);}
.pa-hero-copy{font-size:clamp(14px,2.5vw,17px);color:#333;line-height:1.7;margin-bottom:24px;border-left:4px solid #111;padding-left:14px;}
.pa-price-box{display:inline-flex;align-items:center;gap:0;border:3px solid #111;}
.pa-price-label{background:#111;color:#ffe600;font-size:11px;font-weight:700;padding:8px 12px;letter-spacing:2px;}
.pa-price{font-family:'Black Han Sans',sans-serif;font-size:clamp(22px,4vw,32px);padding:8px 20px;color:#111;}
.pa-features{border-bottom:4px solid #111;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));}
.pa-feature{padding:20px;border-right:3px solid #111;border-bottom:3px solid #111;}
.pa-feature:last-child{border-right:none;}
.pa-feature-num{font-family:'Black Han Sans',sans-serif;font-size:32px;color:#ffe600;-webkit-text-stroke:2px #111;margin-bottom:6px;}
.pa-feature-text{font-size:13px;color:#222;line-height:1.7;font-weight:700;}
.pa-section{padding:40px;border-bottom:4px solid #111;}
.pa-section.alt{background:#f5f5f5;}
.pa-section-title{font-family:'Black Han Sans',sans-serif;font-size:clamp(20px,4vw,28px);margin-bottom:20px;display:flex;align-items:center;gap:10px;}
.pa-section-title span{background:#ffe600;padding:0 8px;}
.pa-desc{font-size:14px;line-height:2.2;color:#333;white-space:pre-line;}
.pa-rec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
.pa-rec-card{border:3px solid #111;padding:16px;background:#fff;position:relative;}
.pa-rec-card::before{content:'';position:absolute;top:4px;left:4px;right:-4px;bottom:-4px;background:#111;z-index:-1;}
.pa-rec-num{font-family:'Black Han Sans',sans-serif;font-size:28px;color:#ffe600;-webkit-text-stroke:1px #111;margin-bottom:6px;}
.pa-rec-text{font-size:13px;color:#222;line-height:1.8;}
.pa-cta{background:#111;padding:48px 40px;text-align:center;border-bottom:4px solid #ffe600;}
.pa-cta-text{font-size:clamp(15px,3vw,18px);color:#fff;line-height:1.9;margin-bottom:24px;white-space:pre-line;}
.pa-cta-btn{display:inline-block;background:#ffe600;color:#111;font-family:'Black Han Sans',sans-serif;font-size:18px;letter-spacing:2px;padding:14px 40px;border:3px solid #ffe600;position:relative;}
.pa-cta-btn::after{content:'';position:absolute;top:4px;left:4px;right:-4px;bottom:-4px;border:3px solid #ffe600;z-index:-1;}
.pa-faq{padding:40px;}
.pa-faq-item{border:3px solid #111;margin-bottom:8px;position:relative;}
.pa-faq-item::after{content:'';position:absolute;top:4px;left:4px;right:-4px;bottom:-4px;background:#111;z-index:-1;}
.pa-faq-q{background:#ffe600;padding:12px 16px;font-weight:700;font-size:14px;border-bottom:2px solid #111;}
.pa-faq-a{padding:12px 16px;font-size:13px;color:#333;line-height:1.8;background:#fff;}
.pa-footer{padding:20px 40px;border-top:4px solid #111;display:flex;flex-wrap:wrap;gap:6px;}
.pa-kw{border:2px solid #111;padding:4px 12px;font-size:12px;font-weight:700;color:#111;background:#ffe600;}
</style>
<div class="pa-wrap">
${d.thumbUrl ? `<div style="width:100%;line-height:0;border-bottom:4px solid #111;"><img src="${d.thumbUrl}" style="width:100%;max-height:500px;object-fit:cover;display:block;" alt=""/></div>` : ''}
<div class="pa-hero">
  <div class="pa-hero-dots"></div>
  <div class="pa-hero-tag">★ NEW ARRIVAL ★</div>
  <div class="pa-hero-name">${d.productName}</div>
  <div class="pa-hero-copy">${d.oneLiner}</div>
  <div class="pa-price-box"><div class="pa-price-label">PRICE</div><div class="pa-price">${d.priceRange}</div></div>
</div>
<div class="pa-features">
  ${d.features.map((f: string, i: number) => `<div class="pa-feature"><div class="pa-feature-num">0${i+1}</div><div class="pa-feature-text">${f}</div></div>`).join('')}
</div>
${d.img1Url ? `<div style="width:100%;line-height:0;border-bottom:4px solid #111;"><img src="${d.img1Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="pa-section">
  <div class="pa-section-title"><span>상품</span> 상세</div>
  <p class="pa-desc">${d.description}</p>
</div>
${d.img2Url ? `<div style="width:100%;line-height:0;border-top:4px solid #111;border-bottom:4px solid #111;"><img src="${d.img2Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="pa-section alt">
  <div class="pa-section-title">이런 분께 <span>추천</span></div>
  <div class="pa-rec-grid">
    ${d.recommendation.split('\n').filter((s: string) => s.trim()).slice(0,3).map((r: string, i: number) => `<div class="pa-rec-card"><div class="pa-rec-num">0${i+1}</div><div class="pa-rec-text">${r}</div></div>`).join('')}
  </div>
</div>
<div class="pa-cta">
  <div class="pa-cta-text">${d.cta.replace(/\n/g,'<br>')}</div>
  <div class="pa-cta-btn">지금 바로 구매!</div>
</div>
${d.img3Url ? `<div style="width:100%;line-height:0;border-bottom:4px solid #111;"><img src="${d.img3Url}" style="width:100%;display:block;" alt=""/></div>` : ''}
<div class="pa-faq">
  <div class="pa-section-title"><span>FAQ</span></div>
  ${d.faq.map((f: {q:string;a:string}) => `<div class="pa-faq-item"><div class="pa-faq-q">Q. ${f.q}</div><div class="pa-faq-a">${f.a}</div></div>`).join('')}
</div>
<div class="pa-footer">${d.keywords.map((k: string) => `<span class="pa-kw">#${k}</span>`).join('')}</div>
</div></html>`

export const TEMPLATES: Template[] = [
  { id: 1, name: '모던 다크',    desc: '세련된 다크 톤',       render: base('#0a0a0f','#ff6b35','#f0f0f5','#13131a','#2a2a3a','#1c1c28','#ff6b35','#ffffff') },
  { id: 2, name: '클린 화이트',  desc: '깔끔한 밝은 스타일',   render: base('#ffffff','#2563eb','#1a1a2e','#f0f4ff','#dde4f5','#dde4f5','#2563eb','#ffffff') },
  { id: 3, name: '핑크 러블리',  desc: '감성적인 핑크 톤',     render: base('#fff5f8','#ff4d8f','#2a0a18','#ffe0ec','#ffb3ce','#ffe0ec','#ff4d8f','#ffffff') },
  { id: 4, name: '포레스트 그린',desc: '자연친화적 그린',       render: base('#f0fff4','#16a34a','#052e16','#dcfce7','#bbf7d0','#dcfce7','#16a34a','#ffffff') },
  { id: 5, name: '로얄 퍼플',    desc: '고급스러운 보라',       render: base('#faf5ff','#7c3aed','#2e1065','#ede9fe','#ddd6fe','#ede9fe','#7c3aed','#ffffff') },
  { id: 6, name: '골드 럭셔리',  desc: '프리미엄 골드 감성',   render: base('#0d0b07','#c9a84c','#f5e6c8','#1a1608','#3a2e10','#2a2208','#c9a84c','#0d0b07') },
  { id: 7, name: '미니멀 그레이',desc: '심플 모노크롬',         render: base('#fafafa','#333333','#111111','#f0f0f0','#dddddd','#e8e8e8','#333333','#ffffff') },
  { id: 8,  name: '쿠팡 스타일',      desc: '로켓배송 · 가격강조 · 구매전환 중심', render: renderCoupang },
  { id: 9,  name: '스마트스토어',      desc: '네이버 공식 · 그린 · 신뢰감',         render: renderSmartstore },
  { id: 10, name: '럭셔리 에디토리얼', desc: '아이보리 · 골드 · 잡지 레이아웃',     render: renderLuxuryEditorial },
  { id: 11, name: '사이버펑크 네온',   desc: '블랙 · 네온 · 전자/게임 느낌',        render: renderCyberpunk },
  { id: 12, name: '북유럽 미니멀',     desc: '회색 · 세리프 · 여백 극대화',         render: renderNordic },
  { id: 13, name: 'K-뷰티',           desc: '핑크 · 감성 · 뷰티/코스메틱',          render: renderKbeauty },
  { id: 14, name: '스포츠 다이나믹',   desc: '블랙 · 라임 · 강렬한 에너지',         render: renderSports },
  { id: 15, name: '따뜻한 수공예',     desc: '크림 · 브라운 · 핸드메이드 감성',     render: renderHandcraft },
  { id: 16, name: '프리미엄 블랙',     desc: '블랙 · 골드 · 명품 느낌',             render: renderBlackLuxury },
  { id: 17, name: '팝아트 레트로',     desc: '노랑 · 굵은 선 · 유니크 레이아웃',    render: renderPopArt },
]
