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
      title: 'STORE AUTO 소개',
      desc: 'STORE AUTO는 네이버 트렌드 분석부터\nAI 상세페이지 제작까지\n원스톱으로 해결하는 스마트스토어 자동화 서비스입니다.',
      sub: '처음 사용하시는 분도 5분이면 완성됩니다. 함께 시작해볼까요?',
    },
    {
      emoji: '⚙️',
      title: '0단계 — 키 설정 (최초 1회)',
      desc: '헤더의 ⚙️ 키 설정 버튼을 눌러\nAI 키와 네이버 데이터랩 키를\n설정 페이지에서 등록하세요.',
      sub: 'Groq는 완전 무료! 키 발급은 1분이면 됩니다.',
      img: [
        '🤖 AI 키: Gemini(일부무료) / OpenAI(유료) / Groq(무료) 중 선택',
        '📊 네이버 데이터랩: 검색 트렌드 분석용 (선택)',
        '💾 마이페이지 → API 키 탭에서 저장하면 저장소에 보관돼 어디서든 사용 가능해요',
      ],
    },
    {
      emoji: '🖼',
      title: '1단계 — AI 이미지 분석 (선택)',
      desc: '상품 사진을 올리면 AI가 상품 정보를\n자동으로 읽어서 입력폼을 채워줍니다.\n사진이 없으면 건너뛰고 직접 입력하세요.',
      sub: 'Gemini 또는 OpenAI 키가 필요합니다.\nGroq는 이미지 분석을 지원하지 않습니다.',
      img: [
        '① AI 이미지 분석 섹션 클릭해서 펼치기',
        '② 상품 사진 업로드 (클릭 또는 드래그)',
        '③ AI 이미지 분석 시작 버튼 클릭',
        '④ 상품명·카테고리·특징이 아래 입력폼에 자동 입력됨',
        '⑤ 트렌드 검색창에도 상품명이 자동으로 채워짐',
        '⚠️ 이 기능은 입력폼 자동완성용입니다. 글 안에 포함되는 SEO 키워드는 트렌드 분석에서 선택하세요.',
      ],
    },
    {
      emoji: '📊',
      title: '2단계 — 네이버 트렌드 분석',
      desc: '팔고 싶은 상품 키워드를 입력하면\n네이버 12개월 검색량 트렌드를\n그래프로 보여줍니다.',
      sub: 'AI가 트렌드를 분석해 최적의 SEO 키워드 5개를 추천해줍니다.',
      img: [
        '① 검색창에 상품 키워드 입력 (예: 영광굴비)',
        '② 🔍 분석 버튼 클릭',
        '③ 12개월 검색량 그래프 + 최고/최저/현재 수치 확인',
        '④ AI 추천 키워드 중 하나 클릭 → 글 생성 시 자동 반영',
        '⑤ 선택한 키워드는 상세설명에 5회 이상 자연스럽게 포함됩니다',
      ],
    },
    {
      emoji: '🎭',
      title: '3단계 — 글쓰기 스타일 선택',
      desc: '4가지 페르소나 중 원하는\n글쓰기 스타일을 선택하세요.',
      sub: '같은 상품도 스타일에 따라 완전히 다른 느낌으로 생성됩니다.',
      img: [
        '👥 친근한 언니/오빠 — 솔직하고 편한 구어체',
        '🎓 전문가 큐레이터 — 수치·근거 중심 신뢰감',
        '✨ 감성 스토리텔러 — 사용 전후 감정 이입 스토리',
        '💰 실속파 소비자 — 가성비·실용성 직접 비교',
      ],
    },
    {
      emoji: '🤖',
      title: '4단계 — AI 선택',
      desc: 'Gemini, OpenAI, Groq 중\n사용할 AI를 선택하세요.',
      sub: '설정 페이지에서 키를 등록하면 자동으로 불러와집니다.',
      img: [
        '✦ Gemini — 일부 무료, 한국어 품질 우수',
        '⬡ OpenAI — 유료, GPT-4o 최고 품질',
        '⚡ Groq — 완전 무료, 빠른 속도',
      ],
    },
    {
      emoji: '📦',
      title: '5단계 — 상품 정보 입력',
      desc: '판매하실 상품 정보를 입력하세요.\n상세할수록 좋은 결과가 나옵니다.',
      sub: '별표(*) 항목은 필수입니다.',
      img: [
        '① 상품명 입력 (예: 영광 법성포 굴비 선물세트)',
        '② 카테고리 선택 (예: 식품)',
        '③ 핵심 특징 입력 후 추가 (예: 국내산, 저염, 전연령식품)',
        '④ 타겟 고객 (예: 30~70대 전연령)',
        '⑤ 가격대 입력 (예: 55,000원)',
      ],
    },
    {
      emoji: '✦',
      title: '6단계 — 자동 생성',
      desc: '"✦ 상품 설명 자동 생성" 버튼을\n클릭하면 AI가 10~20초 안에\n모든 내용을 완성합니다.',
      img: [
        '🔍 네이버 SEO 최적화 키워드 10개',
        '✦ 핵심 카피 (클릭률 높은 한 줄)',
        '📝 상세 설명 700자 이상 (선택 키워드 5회 이상 포함)',
        '👤 추천 고객 3가지 타입',
        '🛒 구매 유도 멘트',
        '❓ FAQ 5개',
      ],
    },
    {
      emoji: '🎨',
      title: '7단계 — 상세페이지 제작',
      desc: '생성 완료 후 결과 아래\n"상세페이지 제작" 섹션이 나타납니다.',
      img: [
        '① 7가지 디자인 템플릿 선택',
        '② 썸네일 + 중간 이미지 3장 업로드 (선택)',
        '③ 내용 직접 수정 가능',
        '④ 🖥️ 전체 화면 미리보기 (새 탭)',
        '⑤ ⬇ PNG 다운로드 → 스마트스토어에 바로 업로드',
        '⑥ 📋 HTML 코드 복사 → 스마트스토어 HTML 에디터에 붙여넣기',
      ],
    },
    {
      emoji: '💡',
      title: '편의 기능',
      desc: '더 편리하게 사용하는 방법들',
      img: [
        '🌙☀️🌸 테마 변경 — 헤더 우측 이모지 버튼',
        '📋 기록 버튼 — 이전 생성 결과 불러오기 (최대 20개)',
        '↺ 재생성 — 결과 카드별로 부분 재생성 가능',
        '☁️ 생성 결과·API 키 모두 저장소에 저장 — 폰·PC 어디서든 동일하게 사용',
        '💾 중요한 내용은 반드시 복사하거나 PNG로 저장하세요',
      ],
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
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>💾</div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff0f5', marginBottom: '6px' }}>
                저장 안내
              </h3>
              <p style={{ fontSize: '13px', color: '#cc88aa' }}>API 키는 안전하게 저장돼요 ✅</p>
            </div>

            {[
              { icon: '🔑', title: 'API 키 — 마이페이지에 안전 저장', desc: '마이페이지 → API 키 탭에서 저장한 키는 이 기기 브라우저에 유지됩니다. 화면을 꺼도 사라지지 않아요!' },
              { icon: '📋', title: '생성 결과 — 이 기기 브라우저 전용', desc: '상세페이지 생성 결과·기록은 이 브라우저에만 저장돼요. 다른 기기나 브라우저에서는 보이지 않으니 중요한 내용은 복사·저장하세요.' },
              { icon: '🗑️', title: '캐시 삭제 시 기록 사라짐', desc: '브라우저 캐시·쿠키·사이트 데이터를 지우면 생성 기록과 API 키가 모두 삭제됩니다. 키는 마이페이지에서 다시 입력하면 돼요.' },
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
                💡 로그인 후 사용하면 모든 내용이 저장소에 저장돼 폰·PC 어디서든 볼 수 있어요!
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
