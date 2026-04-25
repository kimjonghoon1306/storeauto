'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'dark' | 'light' | 'pink'

const THEMES = {
  dark:  { bg: '#0a0a0f', surface: '#13131a', surface2: '#1c1c28', border: '#2a2a3a', accent: '#ff6b35', text: '#f0f0f5', muted: '#8888aa', green: '#00e5a0' },
  light: { bg: '#f5f5f7', surface: '#ffffff', surface2: '#ebebef', border: '#d0d0dc', accent: '#ff6b35', text: '#1a1a2e', muted: '#666688', green: '#00b37a' },
  pink:  { bg: '#1a0a14', surface: '#241018', surface2: '#2e1520', border: '#4a2035', accent: '#ff4d8f', text: '#fff0f5', muted: '#cc88aa', green: '#ff80c0' },
}

export default function SettingsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('dark')
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<'ai' | 'naver'>('ai')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  const [keys, setKeys] = useState({
    gemini: '',
    openai: '',
    groq: '',
    naverClient: '',
    naverSecret: '',
  })

  const t = THEMES[theme]

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('storeauto_theme') as Theme
      if (savedTheme) setTheme(savedTheme)
      const savedKeys = localStorage.getItem('storeauto_keys')
      if (savedKeys) setKeys(JSON.parse(savedKeys))
    } catch {}
  }, [])

  useEffect(() => {
    document.body.style.background = t.bg
    document.body.style.color = t.text
  }, [theme, t])

  const handleSave = () => {
    try {
      localStorage.setItem('storeauto_keys', JSON.stringify(keys))
      localStorage.setItem('storeauto_theme', theme)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  const toggleShow = (key: string) => {
    setShowKeys(p => ({ ...p, [key]: !p[key] }))
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans KR', sans-serif; background: ${t.bg}; color: ${t.text}; min-height: 100vh; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
    .fade-up { animation: fadeUp 0.5s ease forwards; }
    .card { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 16px; }
    input[type=text], input[type=password] {
      width: 100%; background: ${t.surface2}; border: 1px solid ${t.border};
      border-radius: 10px; padding: 14px 16px; color: ${t.text};
      font-size: 14px; font-family: 'Noto Sans KR', sans-serif; outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: ${t.accent}; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${t.surface}; }
    ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
  `

  const AI_KEYS = [
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '✦',
      badge: '일부무료',
      badgeColor: '#f59e0b',
      placeholder: 'AIza...',
      link: 'https://aistudio.google.com/apikey',
      desc: 'Google AI Studio에서 발급. 무료 할당량 제공.',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '⬡',
      badge: '유료',
      badgeColor: '#ef4444',
      placeholder: 'sk-...',
      link: 'https://platform.openai.com/api-keys',
      desc: 'GPT-4o 모델 사용. 크레딧 충전 필요.',
    },
    {
      id: 'groq',
      name: 'Groq',
      icon: '⚡',
      badge: '무료',
      badgeColor: '#00e5a0',
      placeholder: 'gsk_...',
      link: 'https://console.groq.com/keys',
      desc: 'Llama 3 모델 사용. 완전 무료.',
    },
  ]

  return (
    <>
      <style>{css}</style>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 100px' }}>

        {/* 헤더 */}
        <div className="fade-up" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => router.push('/')} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: '10px', padding: '10px 18px', color: t.muted,
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
              ← 메인으로
            </button>

            {/* 테마 버튼 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {([
                { key: 'dark', label: '🌙', name: '다크' },
                { key: 'light', label: '☀️', name: '라이트' },
                { key: 'pink', label: '🌸', name: '핑크' },
              ] as const).map(th => (
                <button key={th.key} onClick={() => setTheme(th.key)} style={{
                  padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: theme === th.key ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                  background: theme === th.key ? `${t.accent}22` : t.surface2,
                  color: theme === th.key ? t.accent : t.muted,
                  transition: 'all 0.15s',
                }}>
                  {th.label} {th.name}
                </button>
              ))}
            </div>
          </div>

          {/* 타이틀 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: `0 8px 24px ${t.accent}40`,
              animation: 'float 3s ease-in-out infinite',
            }}>⚙️</div>
            <div>
              <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900, color: t.text, lineHeight: 1.2 }}>
                API 키 설정
              </h1>
              <p style={{ fontSize: '14px', color: t.muted, marginTop: '4px' }}>
                키는 이 기기 브라우저에만 저장됩니다 🔒
              </p>
            </div>
          </div>
        </div>

        {/* 섹션 탭 */}
        <div className="fade-up" style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {([
            { key: 'ai', label: '🤖 AI 키', desc: 'Gemini · OpenAI · Groq' },
            { key: 'naver', label: '📊 네이버 키', desc: '데이터랩 트렌드' },
          ] as const).map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
              flex: 1, padding: '16px', borderRadius: '12px', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
              border: activeSection === s.key ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              background: activeSection === s.key ? `${t.accent}15` : t.surface,
              transition: 'all 0.2s',
            }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: activeSection === s.key ? t.accent : t.text, marginBottom: '4px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '12px', color: t.muted }}>{s.desc}</p>
            </button>
          ))}
        </div>

        {/* AI 키 섹션 */}
        {activeSection === 'ai' && (
          <div className="fade-up" style={{ display: 'grid', gap: '16px' }}>
            {AI_KEYS.map(k => (
              <div key={k.id} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: `${t.accent}20`, border: `1px solid ${t.accent}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>{k.icon}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontWeight: 800, fontSize: '16px', color: t.text }}>{k.name}</p>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '20px', color: k.badgeColor,
                          background: `${k.badgeColor}20`, border: `1px solid ${k.badgeColor}40`,
                        }}>{k.badge}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px' }}>{k.desc}</p>
                    </div>
                  </div>
                  {keys[k.id as keyof typeof keys] && (
                    <div style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                      borderRadius: '20px', color: t.green,
                      background: `${t.green}20`, border: `1px solid ${t.green}40`,
                    }}>✓ 등록됨</div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showKeys[k.id] ? 'text' : 'password'}
                    value={keys[k.id as keyof typeof keys]}
                    onChange={e => setKeys(p => ({ ...p, [k.id]: e.target.value }))}
                    placeholder={k.placeholder}
                  />
                  <button onClick={() => toggleShow(k.id)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: t.muted,
                    cursor: 'pointer', fontSize: '16px', padding: '4px',
                  }}>
                    {showKeys[k.id] ? '🙈' : '👁'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <a href={k.link} target="_blank" rel="noreferrer" style={{
                    fontSize: '12px', color: t.accent, textDecoration: 'none', fontWeight: 600,
                  }}>키 발급받기 →</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 네이버 키 섹션 */}
        {activeSection === 'naver' && (
          <div className="fade-up" style={{ display: 'grid', gap: '16px' }}>
            {/* 안내 카드 */}
            <div style={{
              background: `${t.accent}10`, border: `1px solid ${t.accent}30`,
              borderRadius: '16px', padding: '20px',
            }}>
              <p style={{ fontWeight: 800, fontSize: '15px', color: t.accent, marginBottom: '10px' }}>📊 네이버 데이터랩이란?</p>
              <p style={{ fontSize: '14px', color: t.text, lineHeight: 1.8 }}>
                네이버 검색어 트렌드를 분석할 수 있는 공식 API입니다.<br />
                상품 키워드의 검색량 변화를 그래프로 확인하고,<br />
                AI가 트렌드 데이터를 분석해 최적의 전략을 제안합니다.
              </p>
              <a href="https://developers.naver.com/apps/#/register" target="_blank" rel="noreferrer" style={{
                display: 'inline-block', marginTop: '12px',
                fontSize: '13px', color: t.accent, textDecoration: 'none', fontWeight: 700,
              }}>네이버 개발자센터에서 발급받기 →</a>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: '#03c75a20', border: '1px solid #03c75a40',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>🟢</div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '16px', color: t.text }}>네이버 데이터랩</p>
                  <p style={{ fontSize: '12px', color: t.muted }}>검색어 트렌드 분석 API</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: t.muted, display: 'block', marginBottom: '8px' }}>
                    Client ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKeys['naverClient'] ? 'text' : 'password'}
                      value={keys.naverClient}
                      onChange={e => setKeys(p => ({ ...p, naverClient: e.target.value }))}
                      placeholder="네이버 앱 Client ID"
                    />
                    <button onClick={() => toggleShow('naverClient')} style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: '16px',
                    }}>{showKeys['naverClient'] ? '🙈' : '👁'}</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: t.muted, display: 'block', marginBottom: '8px' }}>
                    Client Secret
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKeys['naverSecret'] ? 'text' : 'password'}
                      value={keys.naverSecret}
                      onChange={e => setKeys(p => ({ ...p, naverSecret: e.target.value }))}
                      placeholder="네이버 앱 Client Secret"
                    />
                    <button onClick={() => toggleShow('naverSecret')} style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: '16px',
                    }}>{showKeys['naverSecret'] ? '🙈' : '👁'}</button>
                  </div>
                </div>
              </div>

              {(keys.naverClient && keys.naverSecret) && (
                <div style={{
                  marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
                  background: `${t.green}15`, border: `1px solid ${t.green}30`,
                  fontSize: '13px', color: t.green, fontWeight: 600,
                }}>✓ 네이버 데이터랩 키 등록됨</div>
              )}
            </div>

            {/* 발급 방법 */}
            <div className="card" style={{ padding: '24px' }}>
              <p style={{ fontWeight: 800, fontSize: '14px', color: t.text, marginBottom: '16px' }}>📋 발급 방법</p>
              {[
                '네이버 개발자센터 (developers.naver.com) 접속',
                '로그인 후 "Application 등록" 클릭',
                '"데이터랩 (검색어트렌드)" 사용 API 선택',
                'Client ID와 Client Secret 복사해서 위에 입력',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: t.accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 900,
                  }}>{i + 1}</div>
                  <p style={{ fontSize: '14px', color: t.text, lineHeight: 1.7, paddingTop: '2px' }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div style={{ marginTop: '32px', display: 'grid', gap: '12px' }}>
          <button onClick={handleSave} style={{
            width: '100%', padding: '18px',
            background: saved ? t.green : `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
            color: saved ? '#000' : '#fff', border: 'none', borderRadius: '14px',
            fontSize: '16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 8px 32px ${t.accent}40`, transition: 'all 0.3s',
            letterSpacing: '0.5px',
          }}>
            {saved ? '✓ 저장 완료!' : '💾 키 저장하기'}
          </button>
          <button onClick={() => router.push('/')} style={{
            width: '100%', padding: '15px',
            background: t.surface2, color: t.muted, border: `1px solid ${t.border}`,
            borderRadius: '14px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            메인으로 돌아가기
          </button>
        </div>

        {/* 보안 안내 */}
        <div style={{
          marginTop: '24px', padding: '16px 20px',
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '12px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: t.muted, lineHeight: 1.8 }}>
            🔒 입력하신 키는 <strong style={{ color: t.text }}>이 기기의 브라우저에만</strong> 저장됩니다.<br />
            서버로 전송되거나 다른 곳에 저장되지 않습니다.
          </p>
        </div>
      </div>
    </>
  )
}

