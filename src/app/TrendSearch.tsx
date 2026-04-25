'use client'

import { useState, useCallback } from 'react'

interface TrendPoint { period: string; ratio: number }
interface KeywordRec { keyword: string; reason: string; score: number }

interface Props {
  onKeywordSelect: (keyword: string) => void
  onClearSeoKeyword: () => void
  callAI: (prompt: string) => Promise<string>
  naverClientId: string
  naverClientSecret: string
  onGoSettings: () => void
}

export default function TrendSearch({ onKeywordSelect, onClearSeoKeyword, callAI, naverClientId, naverClientSecret, onGoSettings }: Props) {
  const [query, setQuery] = useState('')
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [recommendations, setRecommendations] = useState<KeywordRec[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [phase, setPhase] = useState<'idle' | 'trend' | 'ai' | 'done'>('idle')
  const [showResetWarning, setShowResetWarning] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const hasNaverKey = !!naverClientId && !!naverClientSecret
  const maxRatio = Math.max(...trendData.map(d => d.ratio), 1)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    if (!hasNaverKey) { setError('settings'); return }

    setLoading(true)
    setError('')
    setTrendData([])
    setAiAnalysis('')
    // 30개 이상이면 초기화 경고
    if (recommendations.length >= 30) {
      setShowResetWarning(true)
      return
    }
    setPhase('trend')

    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 12)
      const fmt = (d: Date) => d.toISOString().slice(0, 10)

      const res = await fetch('/api/naver-trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: naverClientId,
          clientSecret: naverClientSecret,
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          keyword: query.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '트렌드 조회 실패')
      }

      const data = await res.json()
      const results: TrendPoint[] = data.results || []
      setTrendData(results)
      setPhase('ai')

      // AI 분석 + 키워드 추천
      setAiLoading(true)
      const recent = results.slice(-6)
      const trend = recent.length >= 2
        ? recent[recent.length-1].ratio - recent[0].ratio
        : 0
      const trendDir = trend > 10 ? '급상승' : trend > 0 ? '상승' : trend < -10 ? '급하락' : '하락' 

      const aiPrompt = `네이버 검색 트렌드 분석 및 키워드 추천을 해주세요.

검색 키워드: "${query.trim()}"
최근 12개월 트렌드: ${results.map(d => `${d.period}:${d.ratio}`).join(', ')}
트렌드 방향: ${trendDir} (최근 6개월 변화: ${trend > 0 ? '+' : ''}${trend.toFixed(1)})
최고점: ${Math.max(...results.map(d => d.ratio))}, 최저점: ${Math.min(...results.map(d => d.ratio))}, 현재: ${results[results.length-1]?.ratio}

다음 JSON 형식으로만 응답하세요. 쌍따옴표 절대 사용 금지. 한글만 사용:
{
  "analysis": "3문장 트렌드 분석",
  "strategy": "2문장 판매 전략",
  "keywords": [
    {"keyword": "추천키워드1", "reason": "추천이유20자이내", "score": 95},
    {"keyword": "추천키워드2", "reason": "추천이유20자이내", "score": 92},
    {"keyword": "추천키워드3", "reason": "추천이유20자이내", "score": 88},
    {"keyword": "추천키워드4", "reason": "추천이유20자이내", "score": 85},
    {"keyword": "추천키워드5", "reason": "추천이유20자이내", "score": 82},
    {"keyword": "추천키워드6", "reason": "추천이유20자이내", "score": 78},
    {"keyword": "추천키워드7", "reason": "추천이유20자이내", "score": 75},
    {"keyword": "추천키워드8", "reason": "추천이유20자이내", "score": 71},
    {"keyword": "추천키워드9", "reason": "추천이유20자이내", "score": 68},
    {"keyword": "추천키워드10", "reason": "추천이유20자이내", "score": 65}
  ]
}

이미 추천된 키워드와 중복되지 않는 새로운 키워드로 만들어주세요.
한글만 사용. "${query.trim()}" 관련 네이버 검색 최적화 롱테일 키워드로 만들어주세요.`
      const aiText = await callAI(aiPrompt)
      const cleaned = aiText.replace(/```json|```/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          setAiAnalysis(`${parsed.analysis || ''} ${parsed.strategy || ''}`.trim())
          const newKeywords = (parsed.keywords || []).filter(
            (nk: KeywordRec) => !recommendations.some(r => r.keyword === nk.keyword)
          )
          setRecommendations(prev => {
            const merged = [...prev, ...newKeywords]
            return merged.slice(0, 30)
          })
        } catch {
          setAiAnalysis(cleaned.slice(0, 200))
        }
      }
      setPhase('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setPhase('idle')
    } finally {
      setLoading(false)
      setAiLoading(false)
    }
  }, [query, naverClientId, naverClientSecret, callAI, hasNaverKey])

  const handleSelect = (kw: string) => {
    setSelectedKeyword(kw)
    onKeywordSelect(kw)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '24px',
      position: 'relative',
    }}>
      {/* 상단 헤더 — 토글 버튼 */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          width: '100%', border: 'none', cursor: 'pointer',
          padding: 'clamp(16px, 3vw, 20px) clamp(16px, 4vw, 28px)',
          display: 'flex', alignItems: 'center', gap: '14px',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          fontFamily: 'inherit', textAlign: 'left' as const,
          background: isOpen
            ? 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(255,107,53,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(255,107,53,0.06) 0%, transparent 100%)',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg, #ff6b35, #ff9a35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
        }}>📊</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 900, fontSize: 'clamp(14px, 3vw, 16px)', color: 'var(--text)', letterSpacing: '-0.3px' }}>
              네이버 트렌드 & AI 키워드 추천
            </p>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(255,107,53,0.15)', color: 'var(--accent)',
              border: '1px solid rgba(255,107,53,0.3)',
            }}>선택사항</span>
            {recommendations.length > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(0,229,160,0.15)', color: 'var(--green)',
                border: '1px solid rgba(0,229,160,0.3)',
              }}>키워드 {recommendations.length}개 저장됨</span>
            )}
          </div>
          <p style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: 'var(--text-muted)', marginTop: '3px' }}>
            {isOpen ? '검색량 분석 → AI 추천 키워드 → 상품 자동 반영' : '클릭해서 펼치면 트렌드 분석을 시작할 수 있어요'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {!hasNaverKey && !isOpen && (
            <span style={{ fontSize: '11px', color: '#ff6666', fontWeight: 600 }}>키 미등록</span>
          )}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', transition: 'transform 0.3s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▾</div>
        </div>
      </button>

      {isOpen && (
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 28px)' }}>

        {/* 키 없을 때 안내 */}
        {!hasNaverKey && (
          <div style={{
            background: 'rgba(255,107,53,0.06)', border: '1px dashed rgba(255,107,53,0.3)',
            borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px',
          }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>🔑</p>
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>네이버 데이터랩 키가 필요합니다</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              설정 페이지에서 네이버 데이터랩 Client ID와<br />Client Secret을 등록하면 사용할 수 있어요
            </p>
            <button onClick={onGoSettings} style={{
              marginTop: '14px', background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>⚙️ 설정 페이지로 이동</button>
          </div>
        )}

        {/* 검색 입력 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && hasNaverKey && handleSearch()}
              placeholder="예: 영광 굴비, 등산화, 프로틴 쉐이크..."
              disabled={!hasNaverKey}
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: 'clamp(12px, 2.5vw, 14px) 16px',
                color: 'var(--text)', fontSize: 'clamp(14px, 3vw, 15px)',
                fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
                opacity: hasNaverKey ? 1 : 0.5,
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !hasNaverKey || !query.trim()}
            style={{
              background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #03c75a, #00a84a)',
              color: loading ? 'var(--text-muted)' : '#fff',
              border: 'none', borderRadius: '12px',
              padding: 'clamp(12px, 2.5vw, 14px) clamp(16px, 3vw, 24px)',
              fontSize: 'clamp(13px, 3vw, 14px)', fontWeight: 800,
              cursor: loading || !hasNaverKey || !query.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s',
              boxShadow: !loading && hasNaverKey ? '0 4px 16px rgba(3,199,90,0.3)' : 'none',
            }}
          >
            {loading ? '⟳ 분석중' : '🔍 분석'}
          </button>
        </div>

        {error && error !== 'settings' && (
          <p style={{ fontSize: '13px', color: '#ff6666', marginBottom: '12px', padding: '10px 14px', background: 'rgba(255,68,68,0.08)', borderRadius: '8px' }}>{error}</p>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)',
                  animation: 'pulse 1.2s ease infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {phase === 'trend' ? '네이버 검색량 조회중...' : 'AI가 키워드를 분석중...'}
            </p>
          </div>
        )}

        {/* 그래프 */}
        {trendData.length > 0 && (
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: 'clamp(14px, 3vw, 20px)', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                📈 <span style={{ color: 'var(--accent)' }}>{query}</span> 검색량 트렌드 (12개월)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: '최고', val: Math.max(...trendData.map(d => d.ratio)), color: 'var(--green)' },
                  { label: '현재', val: trendData[trendData.length-1]?.ratio, color: 'var(--accent)' },
                  { label: '최저', val: Math.min(...trendData.map(d => d.ratio)), color: '#ff6666' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.label}</p>
                    <p style={{ fontSize: '16px', fontWeight: 900, color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG 그래프 */}
            <div style={{ position: 'relative', width: '100%', height: '120px' }}>
              <svg width="100%" height="120" viewBox={`0 0 ${trendData.length * 28} 120`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#ff6b35" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* 그리드 */}
                {[0,25,50,75,100].map(v => (
                  <line key={v} x1="0" y1={110 - (v / maxRatio) * 100}
                    x2={trendData.length * 28} y2={110 - (v / maxRatio) * 100}
                    stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3" />
                ))}
                {/* 면적 */}
                <polygon fill="url(#grad)" points={[
                  ...trendData.map((d, i) => `${i * 28 + 14},${110 - (d.ratio / maxRatio) * 100}`),
                  `${(trendData.length-1)*28+14},110`, `14,110`
                ].join(' ')} />
                {/* 선 */}
                <polyline fill="none" stroke="#ff6b35" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  points={trendData.map((d, i) => `${i*28+14},${110-(d.ratio/maxRatio)*100}`).join(' ')} />
                {/* 점 */}
                {trendData.map((d, i) => (
                  <circle key={i} cx={i*28+14} cy={110-(d.ratio/maxRatio)*100} r="3.5"
                    fill="#ff6b35" stroke="var(--surface2)" strokeWidth="2"/>
                ))}
              </svg>
            </div>
            {/* X축 라벨 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {[0, Math.floor(trendData.length/3), Math.floor(trendData.length*2/3), trendData.length-1].map(i => (
                <span key={i} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {trendData[i]?.period?.slice(0,7)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI 분석 */}
        {aiAnalysis && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.03))',
            border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: '14px', padding: 'clamp(14px, 3vw, 18px)', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              }}>🤖</div>
              <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--accent)' }}>AI 트렌드 분석</p>
            </div>
            <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', color: 'var(--text)', lineHeight: 1.85 }}>{aiAnalysis}</p>
          </div>
        )}

        {/* 초기화 경고 팝업 */}
        {showResetWarning && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }} onClick={() => setShowResetWarning(false)}>
            <div style={{
              background: 'var(--surface)', border: '2px solid var(--accent)',
              borderRadius: '20px', padding: '32px 28px', maxWidth: '400px', width: '100%',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '14px' }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', textAlign: 'center', marginBottom: '12px' }}>
                키워드 30개 최대 도달
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.8, textAlign: 'center', marginBottom: '20px' }}>
                키워드가 최대 30개에 도달했습니다.<br />
                초기화하면 기존 키워드가 모두 삭제되고<br />
                새로 10개를 생성합니다.
              </p>
              <div style={{ display: 'grid', gap: '10px' }}>
                <button onClick={() => {
                  setRecommendations([])
                  onClearSeoKeyword()
                  setShowResetWarning(false)
                }} style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>↺ 초기화 후 다시 분석</button>
                <button onClick={() => setShowResetWarning(false)} style={{
                  background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>취소</button>
              </div>
            </div>
          </div>
        )}

        {/* AI 추천 키워드 */}
        {recommendations.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text)' }}>
                  ✦ AI 추천 SEO 키워드
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  클릭하면 생성 시 글 전체에 자연스럽게 5회 이상 반영됩니다
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                  background: recommendations.length >= 30 ? 'rgba(255,68,68,0.15)' : 'rgba(255,107,53,0.15)',
                  color: recommendations.length >= 30 ? '#ff6666' : 'var(--accent)',
                  border: `1px solid ${recommendations.length >= 30 ? 'rgba(255,68,68,0.3)' : 'rgba(255,107,53,0.3)'}`,
                }}>
                  {recommendations.length}/30
                  {recommendations.length >= 30 && ' 최대'}
                </span>
                {recommendations.length > 0 && (
                  <button onClick={() => { setRecommendations([]); onClearSeoKeyword() }} style={{
                    fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>↺ 초기화</button>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {recommendations.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(rec.keyword)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: selectedKeyword === rec.keyword ? 'rgba(255,107,53,0.12)' : 'var(--surface2)',
                    border: selectedKeyword === rec.keyword ? '2px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '12px', padding: 'clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'all 0.2s', gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: selectedKeyword === rec.keyword ? 'var(--accent)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 900,
                      color: selectedKeyword === rec.keyword ? '#fff' : 'var(--text-muted)',
                    }}>{i+1}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontWeight: 800, fontSize: 'clamp(13px, 3vw, 15px)',
                        color: selectedKeyword === rec.keyword ? 'var(--accent)' : 'var(--text)',
                        marginBottom: '2px',
                      }}>{rec.keyword}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.reason}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* 점수 바 */}
                    <div style={{ width: '60px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${rec.score}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', minWidth: '28px' }}>{rec.score}</span>
                    {selectedKeyword === rec.keyword && (
                      <span style={{ fontSize: '16px' }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selectedKeyword && (
              <div style={{
                marginTop: '12px', padding: '10px 16px', borderRadius: '10px',
                background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '16px' }}>✓</span>
                <p style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 700 }}>
                  <strong>{selectedKeyword}</strong> 키워드가 선택됐습니다. 생성 시 글 전체에 자연스럽게 반영됩니다
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  )
}
