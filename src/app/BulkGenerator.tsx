'use client'

import { useState, useRef } from 'react'
import { GeneratedResult } from '@/lib/types'

const CATEGORIES = [
  '패션의류','패션잡화','뷰티','식품','주방용품','생활용품',
  '가구/인테리어','디지털/가전','스포츠/레저','출산/육아',
  '반려동물','문구/오피스','자동차용품','건강','기타',
]

const MAX_ITEMS = 10

interface BulkItem {
  productName: string
  category: string
  features: string[]
  targetCustomer: string
  priceRange: string
  extraInfo: string
}

interface BulkResult {
  item: BulkItem
  result: GeneratedResult | null
  status: 'pending' | 'generating' | 'done' | 'error'
  error?: string
}

interface Props {
  callAI: (prompt: string) => Promise<string>
  platform: string
  persona: string
}

const PERSONA_GUIDES: Record<string, string> = {
  A: '친근한 이웃 언니/오빠처럼 써주세요. 솔직하고 편한 구어체.',
  B: '전문가 큐레이터처럼 써주세요. 구체적 수치와 기술적 근거 중심.',
  C: '감성 스토리텔러처럼 써주세요. 사용 전후 스토리 구조.',
  D: '실속파 소비자처럼 써주세요. 가성비, 실용성 중심.',
}

export default function BulkGenerator({ callAI, platform, persona }: Props) {
  const [items, setItems] = useState<BulkItem[]>([])
  const [results, setResults] = useState<BulkResult[]>([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFile = async (file: File) => {
    setParseError('')
    setItems([])
    setResults([])
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]

      if (rows.length < 2) { setParseError('데이터가 없습니다. 헤더 포함 2행 이상 필요합니다.'); return }

      // 헤더 행 제외
      const dataRows = rows.slice(1).filter(r => r[0]?.toString().trim())

      if (dataRows.length === 0) { setParseError('상품 데이터가 없습니다.'); return }
      if (dataRows.length > MAX_ITEMS) {
        setParseError(`최대 ${MAX_ITEMS}개까지만 가능합니다. 앞에서 ${MAX_ITEMS}개만 처리합니다.`)
      }

      const parsed: BulkItem[] = dataRows.slice(0, MAX_ITEMS).map(r => ({
        productName:    r[0]?.toString().trim() || '',
        category:       CATEGORIES.includes(r[1]?.toString().trim()) ? r[1].toString().trim() : '기타',
        features:       (r[2]?.toString() || '').split(',').map(f => f.trim()).filter(Boolean),
        targetCustomer: r[3]?.toString().trim() || '',
        priceRange:     r[4]?.toString().trim() || '',
        extraInfo:      r[5]?.toString().trim() || '',
      })).filter(i => i.productName)

      setItems(parsed)
    } catch {
      setParseError('파일을 읽을 수 없습니다. 엑셀(.xlsx) 또는 CSV 파일인지 확인해주세요.')
    }
  }

  const buildPrompt = (item: BulkItem): string => {
    const PLATFORM_GUIDES: Record<string, string> = {
      smartstore: '네이버 스마트스토어 최적화: description 700자 이상, 네이버 쇼핑 검색 키워드 반영.',
      coupang:    '쿠팡 최적화: 핵심 특장점 상단 집중, 간결하고 직관적인 문체, description 500자 이내.',
      elevenst:   '11번가 최적화: 할인/쿠폰 혜택 강조, description 600자 내외.',
      own:        '자사몰 최적화: 브랜드 스토리 강조, 프리미엄 감성, description 800자 이상.',
    }
    return `당신은 대한민국 최고의 온라인 쇼핑몰 상품 상세페이지 전문 카피라이터입니다.

[플랫폼 최적화 규칙] ${PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.smartstore}
[글쓰기 스타일] ${PERSONA_GUIDES[persona] || PERSONA_GUIDES.A}
[상품 정보]
- 상품명: ${item.productName}
- 카테고리: ${item.category}
- 핵심 특징: ${item.features.join(', ')}
- 타겟 고객: ${item.targetCustomer}
- 가격대: ${item.priceRange}
- 추가 정보: ${item.extraInfo || '없음'}

절대 한자, 일본어, 중국어 사용 금지. JSON 값 안에 쌍따옴표 사용 금지. 줄바꿈은 \\n.
마크다운 코드블록 없이 순수 JSON만:

{"keywords":["k1","k2","k3","k4","k5","k6","k7","k8","k9","k10"],"oneLiner":"25자 내외 카피","description":"700자 이상 설명","recommendation":"3가지 타입 고객","cta":"구매유도 3~4문장","faq":[{"q":"질문1","a":"답변1"},{"q":"질문2","a":"답변2"},{"q":"질문3","a":"답변3"},{"q":"질문4","a":"답변4"},{"q":"질문5","a":"답변5"}]}`
  }

  const startGenerate = async () => {
    if (!items.length) return
    setGenerating(true)
    setProgress(0)
    const initial: BulkResult[] = items.map(item => ({ item, result: null, status: 'pending' }))
    setResults(initial)

    for (let i = 0; i < items.length; i++) {
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'generating' } : r))
      try {
        const text = await callAI(buildPrompt(items[i]))
        const cleaned = text.replace(/```json|```/gi, '').trim()

        const fixJson = (str: string): string => {
          let inStr = false, esc = false, out = ''
          for (const c of str) {
            if (esc) { out += c; esc = false }
            else if (c === '\\' && inStr) { out += c; esc = true }
            else if (c === '"') { inStr = !inStr; out += c }
            else if (inStr && c === '\n') { out += '\\n' }
            else if (inStr && c === '\r') { /* skip */ }
            else { out += c }
          }
          return out
        }

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('응답 파싱 실패')
        const parsed: GeneratedResult = JSON.parse(fixJson(jsonMatch[0]).replace(/,\s*([}\]])/g, '$1'))
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, result: parsed, status: 'done' } : r))
        setExpandedIdx(i)
      } catch (e: unknown) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: e instanceof Error ? e.message : '오류' } : r))
      }
      setProgress(i + 1)
    }
    setGenerating(false)
  }

  const downloadTxt = (r: GeneratedResult, name: string) => {
    const txt = `[검색 키워드]\n${r.keywords.join(', ')}\n\n[핵심 카피]\n${r.oneLiner}\n\n[상세 설명]\n${r.description}\n\n[추천 고객]\n${r.recommendation}\n\n[구매 유도 멘트]\n${r.cta}\n\n[FAQ]\n${r.faq.map(f=>`Q. ${f.q}\nA. ${f.a}`).join('\n\n')}`
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const [showGuide, setShowGuide] = useState(false)

  return (
    <div>
      <style>{`
        @keyframes bulkSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* 사용방법 */}
      <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'12px', padding:'12px 16px', marginBottom:'14px' }}>
        <button onClick={() => setShowGuide(v => !v)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:'13px', fontWeight:800, color:'#818cf8' }}>📖 사용방법</p>
          <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>{showGuide ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
        {showGuide && (
          <div style={{ marginTop:'10px', display:'grid', gap:'8px' }}>
            {[
              { step:'1', icon:'📥', title:'엑셀 파일 준비', desc:'아래 양식에 맞게 엑셀(xlsx) 또는 CSV 파일을 작성하세요. A열부터 순서대로 상품명, 카테고리, 특징, 타겟고객, 가격대, 추가정보(선택).' },
              { step:'2', icon:'📂', title:'파일 업로드', desc:'파일 클릭 또는 드래그해서 올리면 상품 목록이 미리보기로 표시됩니다. 최대 10개까지 처리 가능합니다.' },
              { step:'3', icon:'✦', title:'자동 생성 시작', desc:'"N개 상품 자동 생성 시작" 버튼을 누르면 상품을 순서대로 하나씩 생성합니다. 중간에 나가도 이미 생성된 것은 유지됩니다.' },
              { step:'4', icon:'📋', title:'결과 확인 및 저장', desc:'각 상품 결과를 펼쳐서 확인하고 전체복사 또는 TXT 파일로 저장하세요. 스마트스토어 등록에 바로 사용 가능합니다.' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', background:'rgba(99,102,241,0.05)', borderRadius:'8px', padding:'10px 12px' }}>
                <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'rgba(99,102,241,0.2)', color:'#818cf8', fontSize:'11px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.step}</div>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', marginBottom:'2px' }}>{s.icon} {s.title}</p>
                  <p style={{ fontSize:'12px', color:'var(--text-muted)', lineHeight:1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 엑셀 양식 안내 */}
      <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px' }}>
        <p style={{ fontSize:'13px', fontWeight:800, color:'#818cf8', marginBottom:'8px' }}>📋 엑셀 작성 형식 (최대 {MAX_ITEMS}개)</p>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', color:'var(--text-muted)', minWidth:'500px' }}>
            <thead>
              <tr>
                {['A: 상품명*','B: 카테고리*','C: 특징* (쉼표구분)','D: 타겟고객*','E: 가격대*','F: 추가정보'].map((h,i) => (
                  <th key={i} style={{ background:'rgba(99,102,241,0.15)', padding:'6px 8px', textAlign:'left', fontWeight:700, whiteSpace:'nowrap', borderRadius:i===0?'6px 0 0 6px':i===5?'0 6px 6px 0':'0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['영광굴비 선물세트','식품','국내산,저염,전통','30~60대','55,000원','명절선물용'].map((v,i) => (
                  <td key={i} style={{ padding:'5px 8px', color:'var(--text)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 파일 업로드 */}
      <div
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{ border:'2px dashed var(--border)', borderRadius:'14px', padding:'clamp(20px,4vw,32px)', textAlign:'center', cursor:'pointer', background:'var(--surface2)', transition:'all 0.2s', marginBottom:'12px' }}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f) }} />
        <div style={{ fontSize:'36px', marginBottom:'8px' }}>📂</div>
        <p style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', marginBottom:'4px' }}>엑셀 파일을 클릭하거나 드래그해서 올려주세요</p>
        <p style={{ fontSize:'12px', color:'var(--text-muted)' }}>.xlsx / .xls / .csv 지원</p>
      </div>

      {parseError && (
        <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.3)', fontSize:'13px', color:'var(--accent)', marginBottom:'12px' }}>⚠️ {parseError}</div>
      )}

      {/* 파싱된 미리보기 */}
      {items.length > 0 && results.length === 0 && (
        <div style={{ marginBottom:'16px' }}>
          <p style={{ fontSize:'13px', fontWeight:800, color:'var(--text)', marginBottom:'8px' }}>✅ {items.length}개 상품 인식됨</p>
          <div style={{ display:'grid', gap:'6px', maxHeight:'200px', overflowY:'auto' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', background:'var(--surface2)', borderRadius:'8px', padding:'8px 12px' }}>
                <span style={{ fontSize:'12px', fontWeight:800, color:'var(--accent)', flexShrink:0 }}>{i+1}</span>
                <span style={{ fontSize:'13px', color:'var(--text)', fontWeight:700, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.productName}</span>
                <span style={{ fontSize:'11px', color:'var(--text-muted)', flexShrink:0 }}>{item.category}</span>
              </div>
            ))}
          </div>
          <button
            onClick={startGenerate}
            style={{ width:'100%', marginTop:'12px', padding:'clamp(13px,3vw,15px)', background:'linear-gradient(135deg,var(--accent),#ff8c42)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'clamp(14px,3vw,15px)', fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(255,107,53,0.35)' }}
          >
            ✦ {items.length}개 상품 자동 생성 시작
          </button>
        </div>
      )}

      {/* 생성 진행 상황 */}
      {results.length > 0 && (
        <div>
          {generating && (
            <div style={{ background:'rgba(255,107,53,0.06)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:'12px', padding:'14px 16px', marginBottom:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <p style={{ fontSize:'13px', fontWeight:800, color:'var(--accent)' }}>
                  <span style={{ display:'inline-block', animation:'bulkSpin 1s linear infinite', marginRight:'6px' }}>⟳</span>
                  {progress}/{items.length} 생성 중...
                </p>
                <p style={{ fontSize:'12px', color:'var(--text-muted)' }}>{Math.round(progress/items.length*100)}%</p>
              </div>
              <div style={{ height:'6px', background:'var(--border)', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress/items.length*100}%`, background:'linear-gradient(90deg,var(--accent),#ff8c42)', borderRadius:'3px', transition:'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {!generating && progress === items.length && (
            <div style={{ background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', borderRadius:'10px', padding:'10px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'18px' }}>✅</span>
              <p style={{ fontSize:'13px', fontWeight:700, color:'var(--green)' }}>전체 생성 완료! {results.filter(r=>r.status==='done').length}/{items.length}개 성공</p>
            </div>
          )}

          <div style={{ display:'grid', gap:'10px' }}>
            {results.map((r, i) => (
              <div key={i} style={{ background:'var(--surface)', border:`1px solid ${r.status==='done'?'rgba(0,229,160,0.25)':r.status==='error'?'rgba(255,68,68,0.25)':'var(--border)'}`, borderRadius:'12px', overflow:'hidden' }}>
                <button
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  style={{ width:'100%', padding:'12px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'10px', textAlign:'left' as const }}
                >
                  <span style={{ fontSize:'16px', flexShrink:0 }}>
                    {r.status==='pending'?'⏳':r.status==='generating'?'⟳':r.status==='done'?'✅':'❌'}
                  </span>
                  <span style={{ flex:1, fontWeight:700, fontSize:'14px', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.item.productName}</span>
                  <span style={{ fontSize:'11px', color:'var(--text-muted)', flexShrink:0 }}>{r.item.category}</span>
                  {r.status==='done' && <span style={{ fontSize:'12px', color:'var(--text-muted)', flexShrink:0 }}>{expandedIdx===i?'▲':'▼'}</span>}
                </button>

                {r.status==='error' && (
                  <div style={{ padding:'0 16px 12px', fontSize:'12px', color:'#f87171' }}>❌ {r.error}</div>
                )}

                {r.status==='done' && r.result && expandedIdx === i && (
                  <div style={{ borderTop:'1px solid var(--border)', padding:'16px' }}>
                    <div style={{ display:'grid', gap:'10px' }}>
                      {/* 키워드 */}
                      <div style={{ background:'var(--surface2)', borderRadius:'10px', padding:'12px 14px' }}>
                        <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px' }}>🔍 키워드</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                          {r.result.keywords.map((k,j) => <span key={j} style={{ background:'rgba(255,107,53,0.1)', color:'var(--accent)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:'6px', padding:'3px 10px', fontSize:'12px', fontWeight:700 }}>{k}</span>)}
                        </div>
                      </div>
                      {/* 카피 */}
                      <div style={{ background:'var(--surface2)', borderRadius:'10px', padding:'12px 14px' }}>
                        <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'4px' }}>✦ 핵심 카피</p>
                        <p style={{ fontSize:'15px', fontWeight:700, color:'var(--accent)' }}>{r.result.oneLiner}</p>
                      </div>
                      {/* 설명 */}
                      <div style={{ background:'var(--surface2)', borderRadius:'10px', padding:'12px 14px' }}>
                        <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'4px' }}>📝 상세 설명</p>
                        <p style={{ fontSize:'13px', color:'var(--text)', lineHeight:1.8, whiteSpace:'pre-line' }}>{r.result.description}</p>
                      </div>
                    </div>
                    {/* 다운로드/복사 */}
                    <div style={{ display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap' }}>
                      <button
                        onClick={() => copyText(`[키워드]\n${r.result!.keywords.join(', ')}\n\n[카피]\n${r.result!.oneLiner}\n\n[상세설명]\n${r.result!.description}\n\n[추천고객]\n${r.result!.recommendation}\n\n[구매유도]\n${r.result!.cta}\n\n[FAQ]\n${r.result!.faq.map(f=>`Q: ${f.q}\nA: ${f.a}`).join('\n\n')}`, `bulk-${i}`)}
                        style={{ flex:1, padding:'10px', background: copied===`bulk-${i}` ? 'var(--green)' : 'var(--surface2)', border:'1px solid var(--border)', borderRadius:'8px', color: copied===`bulk-${i}` ? '#000' : 'var(--text)', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' as const }}
                      >{copied===`bulk-${i}` ? '✓ 복사됨' : '📋 전체 복사'}</button>
                      <button
                        onClick={() => downloadTxt(r.result!, r.item.productName)}
                        style={{ flex:1, padding:'10px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'8px', color:'#34d399', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' as const }}
                      >⬇ TXT 저장</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!generating && (
            <button onClick={() => { setItems([]); setResults([]); setProgress(0); setParseError('') }} style={{ width:'100%', marginTop:'12px', padding:'12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text-muted)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
              ↺ 새 파일 업로드
            </button>
          )}
        </div>
      )}
    </div>
  )
}
