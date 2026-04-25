'use client'

import { useState, useEffect } from 'react'

export default function GuideModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [showSaveWarning, setShowSaveWarning] = useState(false)

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
      desc: 'Gemini, OpenAI, Groq 중 하나를 선택하고\nAPI 키를 입력하세요.',
      sub: '키가 없으시면 화면의 "키 발급받기" 링크를 클릭하세요.\nGroq는 무료로 사용 가능합니다!',
      img: [
        '① 상단에서 Gemini / OpenAI / Groq 탭 선택',
        '② 키 입력란에 API 키 붙여넣기',
        '③ 👁 키 보기 버튼으로 제대로 입력됐는지 확인',
      ],
    },
    {
      emoji: '🎭',
      title: '2단계 — 글쓰기 스타일 선택',
      desc: '4가지 페르소나 중 원하는 스타일을 선택하세요.',
      sub: '각 스타일마다 완전히 다른 느낌의 글이 생성됩니다.',
      img: [
        '👥 친근한 언니/오빠 — 솔직한 구어체',
        '🎓 전문가 큐레이터 — 신뢰감 있는 데이터 중심',
        '✨ 감성 스토리텔러 — 감정 이입 스토리',
        '💰 실속파 소비자 — 가성비·실용성 중심',
      ],
    },
    {
      emoji: '📦',
      title: '3단계 — 상품 정보 입력',
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
      title: '4단계 — 자동 생성',
      desc: '"✦ 상품 설명 자동 생성" 버튼을\n클릭하면 AI가 10~20초 안에\n모든 내용을 만들어줍니다.',
      sub: '키워드, 상세설명, FAQ까지 한 번에 완성됩니다.',
    },
    {
      emoji: '🎨',
      title: '5단계 — 상세페이지 제작',
      desc: '생성 완료 후 아래쪽에\n"상세페이지 제작" 섹션이 나타납니다.',
      img: [
        '① 7가지 디자인 템플릿 중 선택',
        '② 썸네일 + 중간 이미지 3장 업로드 (선택)',
        '③ 내용 수정 후 미리보기',
        '④ PNG 다운로드 → 스마트스토어 업로드',
      ],
    },
    {
      emoji: '🌙',
      title: '추가 기능',
      desc: '헤더 우측 버튼으로\n다크 · 라이트 · 핑크 테마를\n자유롭게 바꿀 수 있습니다.',
      sub: '생성 기록은 자동 저장됩니다.\n📋 기록 버튼으로 이전 결과를 불러올 수 있어요!',
    },
  ]

  if (!open) return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .btn-float  { animation: float 3s ease-in-out infinite; }
        .btn-float2 { animation: float 3s ease-in-out infinite; animation-delay: 0.5s; }
      `}</style>

      {/* 저장 경고 팝업 */}
      {showSaveWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '20px', overflowY: 'auto',
        }} onClick={() => setShowSaveWarning(false)}>
          <div style={{
            background: '#0f0f1a', border: '2px solid #ff4d8f',
            borderRadius: '20px', padding: '32px 28px 28px', maxWidth: '440px', width: '100%',
            margin: 'auto', position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            {/* 닫기 버튼 */}
            <button onClick={() => setShowSaveWarning(false)} style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'rgba(255,77,143,0.2)', border: '1px solid #ff4d8f',
              color: '#ff4d8f', borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff0f5', marginBottom: '6px' }}>
                저장 데이터 주의사항
              </h3>
              <p style={{ fontSize: '13px', color: '#cc88aa' }}>사용 전에 꼭 읽어주세요</p>
            </div>

            {[
              { icon: '📱', title: '이 기기 브라우저 전용 저장', desc: '지금 사용 중인 기기의 이 브라우저에만 저장돼요. 스마트폰으로 만든 내용은 PC에서 볼 수 없고, PC에서 만든 내용은 스마트폰에서 볼 수 없어요.' },
              { icon: '🌐', title: '브라우저가 달라도 안 보여요', desc: '크롬에서 만든 내용은 사파리·엣지에서 보이지 않아요. 같은 기기라도 브라우저가 다르면 데이터가 공유되지 않습니다.' },
              { icon: '🗑️', title: '캐시 삭제 = 데이터 완전 삭제', desc: '브라우저 캐시, 쿠키, 사이트 데이터를 지우면 저장된 기록이 모두 사라집니다. 삭제 전에 반드시 복사해두세요!' },
              { icon: '🕵️', title: '시크릿 모드에서는 저장 안 됨', desc: '시크릿/프라이빗 모드에서는 브라우저를 닫는 순간 모든 데이터가 사라져요. 일반 모드에서 사용하세요.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                background: 'rgba(255,77,143,0.07)', border: '1px solid rgba(255,77,143,0.2)',
                borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
              }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: '#ff4d8f', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: '#e0c0cc', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}

            <div style={{
              background: 'rgba(255,77,143,0.15)', borderRadius: '10px',
              padding: '12px 16px', margin: '16px 0 20px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '14px', color: '#ffb3d1', fontWeight: 700 }}>
                💡 중요한 내용은 생성 후 바로 복사하거나 PNG로 다운받아두세요!
              </p>
            </div>

            <button onClick={() => setShowSaveWarning(false)} style={{
              width: '100%', background: 'linear-gradient(135deg, #ff4d8f, #ff80c0)',
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '15px', fontSize: '15px', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(255,77,143,0.4)',
            }}>
              ✓ 확인했습니다. 시작할게요!
            </button>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 2개 — 옆으로 나란히, 모바일 위치 고정 */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
        display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center',
      }}>
        <button
          className="btn-float2"
          onClick={() => setShowSaveWarning(true)}
          style={{
            background: 'linear-gradient(135deg, #ff4d8f, #ff80c0)',
            color: '#fff', border: 'none',
            borderRadius: '50px', padding: '12px 18px', fontSize: '13px',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 24px rgba(255,77,143,0.5)',
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          ⚠️ 저장 안내
        </button>
        <button
          className="btn-float"
          onClick={() => { setStep(0); setOpen(true) }}
          style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff9a35)',
            color: '#fff', border: 'none',
            borderRadius: '50px', padding: '12px 18px', fontSize: '13px',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 24px rgba(255,107,53,0.5)',
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          ❓ 사용 방법
        </button>
      </div>
    </>
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
        <button onClick={close} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: '8px',
          width: '32px', height: '32px', cursor: 'pointer',
          fontSize: '16px', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>
          {current.emoji}
        </div>

        <h2 style={{
          fontSize: '22px', fontWeight: 900, color: 'var(--text)',
          marginBottom: '16px', textAlign: 'center', lineHeight: 1.3,
        }}>
          {current.title}
        </h2>

        <p style={{
          fontSize: '16px', lineHeight: 1.9, color: 'var(--text)',
          whiteSpace: 'pre-line', textAlign: 'center', marginBottom: '16px',
        }}>
          {current.desc}
        </p>

        {current.img && (
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px', marginBottom: '16px',
          }}>
            {current.img.map((item, i) => (
              <p key={i} style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.9, paddingLeft: '4px' }}>{item}</p>
            ))}
          </div>
        )}

        {current.sub && (
          <p style={{
            fontSize: '13px', color: 'var(--text-muted)',
            whiteSpace: 'pre-line', textAlign: 'center', marginBottom: '16px', lineHeight: 1.7,
          }}>
            {current.sub}
          </p>
        )}

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
