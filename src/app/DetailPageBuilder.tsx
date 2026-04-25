'use client'

import { useState, useRef, useCallback } from 'react'
import { GeneratedResult } from '@/lib/types'
import { TEMPLATES, EditableData, resultToEditable } from '@/lib/templates'

interface Props {
  result: GeneratedResult
  productName: string
  priceRange: string
  features: string[]
}

export default function DetailPageBuilder({ result, productName, priceRange, features }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [step, setStep] = useState<'template' | 'edit' | 'preview'>('template')
  const [data, setData] = useState<EditableData>(() =>
    resultToEditable(result, productName, priceRange, features)
  )
  const [downloading, setDownloading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const tpl = TEMPLATES[selectedTemplate]
  const html = tpl.render(data)

  const updateIframe = useCallback(() => {
    if (!iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open()
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{margin:0;padding:0;}</style>
      </head><body>${html}</body></html>`)
    doc.close()
  }, [html])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (!(window as any).html2canvas) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
          s.onload = () => res()
          s.onerror = () => rej(new Error('html2canvas 로드 실패'))
          document.head.appendChild(s)
        })
      }
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:860px;background:#fff;'
      container.innerHTML = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">${html}`
      document.body.appendChild(container)
      await new Promise(r => setTimeout(r, 800))
      const canvas = await (window as any).html2canvas(container, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', width: 860, scrollX: 0, scrollY: 0,
      })
      document.body.removeChild(container)
      const link = document.createElement('a')
      link.download = `${data.productName}_상세페이지.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      alert('다운로드 중 오류가 발생했습니다.')
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  // 이미지 파일 → base64 dataURL 변환
  const handleImageUpload = (field: 'thumbUrl' | 'img1Url' | 'img2Url' | 'img3Url') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        setData(p => ({ ...p, [field]: ev.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
    fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const,
  }

  const imgUploadBox = (label: string, field: 'thumbUrl' | 'img1Url' | 'img2Url' | 'img3Url', desc: string) => (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
        📷 {label} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{desc}</span>
      </label>
      <div style={{
        border: '2px dashed var(--border)', borderRadius: '10px', padding: '20px',
        textAlign: 'center', background: 'var(--surface2)', position: 'relative',
      }}>
        {data[field] ? (
          <div style={{ position: 'relative' }}>
            <img src={data[field]} alt="" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }} />
            <button
              onClick={() => setData(p => ({ ...p, [field]: '' }))}
              style={{
                position: 'absolute', top: '6px', right: '6px',
                background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                fontSize: '14px', fontFamily: 'inherit',
              }}
            >×</button>
          </div>
        ) : (
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>클릭하여 이미지 선택</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JPG, PNG, WEBP</p>
            <input type="file" accept="image/*" onChange={handleImageUpload(field)} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ marginTop: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>🎨 상세페이지 제작</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['template', 'edit', 'preview'] as const).map((s, i) => (
            <button key={s} onClick={() => { setStep(s); if (s === 'preview') setTimeout(updateIframe, 100) }} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              border: step === s ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: step === s ? 'var(--accent)' : 'var(--surface2)',
              color: step === s ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s',
            }}>
              {i + 1}. {s === 'template' ? '템플릿' : s === 'edit' ? '편집' : '미리보기'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px' }}>

        {/* STEP 1: 템플릿 */}
        {step === 'template' && (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>디자인 템플릿을 선택하세요</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {TEMPLATES.map((t, i) => (
                <button key={t.id} onClick={() => setSelectedTemplate(i)} style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                  border: selectedTemplate === i ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: selectedTemplate === i ? 'rgba(255,107,53,0.08)' : 'var(--surface2)',
                  textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: '100%', height: '8px', borderRadius: '4px', marginBottom: '10px',
                    background: ['#ff6b35','#2563eb','#ff4d8f','#16a34a','#7c3aed','#c9a84c','#333'][i],
                  }} />
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}>{t.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.desc}</p>
                  {selectedTemplate === i && <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '6px', fontWeight: 700 }}>✓ 선택됨</p>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('edit')} style={{
              marginTop: '24px', background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '14px 32px', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>다음 → 내용 편집</button>
          </div>
        )}

        {/* STEP 2: 편집 */}
        {step === 'edit' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>내용과 이미지를 수정하세요</p>

            {/* 이미지 업로드 섹션 */}
            <div style={{
              background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: '12px', padding: '20px', display: 'grid', gap: '16px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>🖼️ 이미지 업로드 (선택)</p>
              {imgUploadBox('썸네일 이미지', 'thumbUrl', '(상단 메인 이미지)')}
              {imgUploadBox('중간 이미지 1', 'img1Url', '(상세설명 아래)')}
              {imgUploadBox('중간 이미지 2', 'img2Url', '(추천고객 아래)')}
              {imgUploadBox('중간 이미지 3', 'img3Url', '(구매유도 아래)')}
            </div>

            {/* 텍스트 편집 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>상품명</label>
              <input value={data.productName} onChange={e => setData(p => ({ ...p, productName: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>가격</label>
              <input value={data.priceRange} onChange={e => setData(p => ({ ...p, priceRange: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>핵심 카피</label>
              <input value={data.oneLiner} onChange={e => setData(p => ({ ...p, oneLiner: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>상세 설명</label>
              <textarea rows={7} value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>추천 고객</label>
              <textarea rows={4} value={data.recommendation} onChange={e => setData(p => ({ ...p, recommendation: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>구매 유도 멘트</label>
              <textarea rows={3} value={data.cta} onChange={e => setData(p => ({ ...p, cta: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>핵심 특징 (쉼표로 구분)</label>
              <input value={data.features.join(', ')} onChange={e => setData(p => ({ ...p, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} style={fieldStyle} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setStep('template')} style={{
                background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>← 템플릿</button>
              <button onClick={() => { setStep('preview'); setTimeout(updateIframe, 100) }} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px 32px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>미리보기 →</button>
            </div>
          </div>
        )}

        {/* STEP 3: 미리보기 + 다운로드 */}
        {step === 'preview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>미리보기 — <strong style={{ color: 'var(--accent)' }}>{tpl.name}</strong> 템플릿</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep('edit')} style={{
                  background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>← 편집</button>
                <button onClick={handleDownload} disabled={downloading} style={{
                  background: downloading ? 'var(--surface2)' : 'var(--green)',
                  color: downloading ? 'var(--text-muted)' : '#000',
                  border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 700,
                  cursor: downloading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  {downloading ? '변환 중...' : '⬇ PNG 다운로드'}
                </button>
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <iframe
                ref={iframeRef}
                onLoad={updateIframe}
                style={{ width: '100%', minHeight: '1000px', border: 'none', display: 'block', background: '#fff' }}
                title="상세페이지 미리보기"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
