'use client'

import { useState, useEffect } from 'react'

export default function GuideModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('guide_seen')
    if (!seen) setOpen(true)
  }, [])

  const close = () => {
    localStorage.setItem('guide_seen', '1')
    setOpen(false)
  }

  const steps = [
    {
      emoji: '👋',
      title: '안녕하세요!',
      desc: 'STORE AUTO는 상품 정보만 입력하면\nAI가 스마트스토어 상세페이지를\n자동으로 만들어주는 서비스입니다.',
      sub: '처음 사용하시는 분도 3분이면 완성됩니다.',
    },
    {
      emoji: '🔑',
      title: '1단계 — AI 키 입력',
      desc: 'Gemini 또는 OpenAI 중 하나를 선택하고\nAPI 키를 입력하세요.',
      sub: '키가 없으시면 화면의 "키 발급받기" 링크를 클릭하세요.\n발급은 무료입니다.',
      img: [
        '① 상단에서 Gemini 또는 OpenAI 탭 선택',
        '② 키 입력란에 API 키 붙여넣기',
      ],
    },
    {
      emoji: '📦',
      title: '2단계 — 상품 정보 입력',
      desc: '판매하실 상품의 정보를 입력하세요.',
      sub: '별표(*) 표시된 항목은 반드시 입력해야 합니다.',
      img: [
        '① 상품명 입력 (예: 영광 법성포 굴비)',
        '② 카테고리 선택 (예: 식품)',
        '③ 핵심 특징 입력 후 추가 버튼 클릭',
        '④ 타겟 고객, 가격대 입력',
      ],
    },
    {
      emoji: '✦',
      title: '3단계 — 자동 생성',
      desc: '"✦ 상품 설명 자동 생성" 버튼을\n클릭하면 AI가 10~20초 안에\n모든 내용을 만들어줍니다.',
      sub: '키워드, 상세설명, FAQ, HTML 코드까지 한 번에 완성됩니다.',
    },
    {
      emoji: '🎨',
      title: '4단계 — 상세페이지 제작',
      desc: '생성 완료 후 아래쪽에\n"상세페이지 제작" 섹션이 나타납니다.',
      img: [
        '① 7가지 디자인 템플릿 중 마음에 드는 것 선택',
        '② 내용 수정이 필요하면 편집',
        '③ 미리보기로 확인',
        '④ PNG 다운로드 후 스마트스토어에 업로드',
      ],
    },
    {
      emoji: '🌙',
      title: '추가 기능',
      desc: '화면 오른쪽 상단 버튼으로\n다크 · 라이트 · 핑크 테마를\n자유롭게 바꿀 수 있습니다.',
      sub: '모든 내용은 서버에 저장되지 않습니다.\n안심하고 사용하세요! 🔒',
    },
  ]

  if (!open) return (
    <button
      onClick={() => { setStep(0); setOpen(true) }}
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
        background: 'var(--accent)', color: '#fff', border: 'none',
        borderRadius: '50px', padding: '12px 20px', fontSize: '14px',
        fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 20px rgba(255,107,53,0.4)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      ❓ 사용 방법
    </button>
  )

  const current = steps[step]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%', maxWidth: '480px',
        padding: '36px 32px 28px',
        position: 'relative',
      }}>
        {/* 닫기 */}
        <button onClick={close} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: '8px',
          width: '32px', height: '32px', cursor: 'pointer',
          fontSize: '16px', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>

        {/* 진행 표시 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* 이모지 */}
        <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>
          {current.emoji}
        </div>

        {/* 제목 */}
        <h2 style={{
          fontSize: '22px', fontWeight: 900, color: 'var(--text)',
          marginBottom: '16px', textAlign: 'center', lineHeight: 1.3,
        }}>
          {current.title}
        </h2>

        {/* 설명 */}
        <p style={{
          fontSize: '16px', lineHeight: 1.9, color: 'var(--text)',
          whiteSpace: 'pre-line', textAlign: 'center', marginBottom: '16px',
        }}>
          {current.desc}
        </p>

        {/* 순서 목록 */}
        {current.img && (
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px', marginBottom: '16px',
          }}>
            {current.img.map((item, i) => (
              <p key={i} style={{
                fontSize: '14px', color: 'var(--text)', lineHeight: 1.8,
                paddingLeft: '4px',
              }}>{item}</p>
            ))}
          </div>
        )}

        {/* 서브 설명 */}
        {current.sub && (
          <p style={{
            fontSize: '13px', color: 'var(--text-muted)',
            whiteSpace: 'pre-line', textAlign: 'center', marginBottom: '16px',
            lineHeight: 1.7,
          }}>
            {current.sub}
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: '13px', borderRadius: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>← 이전</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} style={{
              flex: 2, padding: '13px', borderRadius: '10px',
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>다음 →</button>
          ) : (
            <button onClick={close} style={{
              flex: 2, padding: '13px', borderRadius: '10px',
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>🚀 시작하기!</button>
          )}
        </div>

        {/* 스킵 */}
        {step === 0 && (
          <button onClick={close} style={{
            display: 'block', margin: '14px auto 0', background: 'none',
            border: 'none', color: 'var(--text-muted)', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>건너뛰기</button>
        )}
      </div>
    </div>
  )
}
