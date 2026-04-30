'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadUserKeys } from '@/lib/keys'
import { loadSession } from '@/lib/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AdminData {
  id: string
  category: string
  title: string
  content: string
  region: string
  createdAt: string
}

const CATEGORY_CARDS = [
  { emoji: '💰', label: '정책자금', color: '#ff6b35', q: '소상공인 정책자금 종류와 신청 방법을 단계별로 알려줘' },
  { emoji: '📄', label: '사업계획서', color: '#f59e0b', q: '정부지원용 사업계획서 작성 방법과 표준 양식을 알려줘' },
  { emoji: '📥', label: '양식다운로드', color: '#ffd700', q: '사업계획서 공식 양식 다운로드 링크와 각 기관별 신청서 양식을 알려줘' },
  { emoji: '🎁', label: '무상지원', color: '#10b981', q: '소상공인 무상지원 보조금 종류와 신청 방법 알려줘' },
  { emoji: '🗺️', label: '지자체지원', color: '#3b82f6', q: '우리 지역 소상공인 지자체 지원금 확인하는 방법 알려줘' },
  { emoji: '🤝', label: '협동조합', color: '#8b5cf6', q: '협동조합 설립 방법과 지원 혜택을 단계별로 알려줘' },
  { emoji: '👩', label: '여성기업', color: '#ec4899', q: '여성기업 확인 방법과 혜택을 상세히 알려줘' },
  { emoji: '♿', label: '장애인기업', color: '#06b6d4', q: '장애인기업 확인 방법과 혜택을 상세히 알려줘' },
  { emoji: '🛡️', label: '세금혜택', color: '#84cc16', q: '소상공인 창업 세금 감면 혜택과 신청 방법 알려줘' },
  { emoji: '📊', label: '노란우산', color: '#f97316', q: '노란우산공제 가입 방법과 소득공제 혜택 상세히 알려줘' },
  { emoji: '🚪', label: '폐업지원', color: '#ef4444', q: '폐업 시 받을 수 있는 희망리턴패키지 신청 방법 알려줘' },
  { emoji: '🌱', label: '청년창업', color: '#22c55e', q: '청년 창업 지원금 종류와 신청 조건을 알려줘' },
  { emoji: '🏦', label: '보증·대출', color: '#a78bfa', q: '신용보증기금과 지역신용보증재단 보증 신청 방법 알려줘' },
  { emoji: '🕊️', label: '새터민지원', color: '#67e8f9', q: '새터민(북한이탈주민) 창업·취업·정착 지원금과 신청 방법을 자세히 알려줘' },
]

const QUICK_QUESTIONS: string[] = [
  '우리 지역 소상공인 지원금 알려줘',
  '소상공인 무상자금 신청 방법은?',
  '협동조합 설립 방법 알려줘',
  '여성기업 인증 받는 방법은?',
  '사업계획서 작성 방법 알려줘',
  '장애인기업 확인서 발급 방법은?',
  '노란우산공제 가입하면 뭐가 좋아?',
  '희망리턴패키지 신청하고 싶어',
]

const SYSTEM_PROMPT = `당신은 대한민국 자영업자·소상공인·창업자를 위한 정부지원 전문 상담사입니다. 아래 지식을 바탕으로 최대한 구체적이고 실용적으로 안내하세요.

## 1. 소상공인 정책자금 (소상공인시장진흥공단)

### 직접대출
- 일반경영안정자금: 경영 애로 소상공인, 최대 7천만원, 연 2~3%대, 5년 분할상환(거치 2년 포함)
- 성장촉진자금: 성장 가능성 높은 소상공인, 최대 1억원, 연 2~3%대
- 청년고용특별자금: 청년 1인 이상 고용 시, 최대 1억원, 금리 추가 우대
- 장애인기업자금: 장애인 소상공인 전용, 최대 7천만원
- 혁신형소상공인자금: 기술 혁신 소상공인, 최대 1억원
- 소공인특화자금: 제조업 소공인 전용, 최대 1억원

### 신용보증부 대출
- 지역신용보증재단 보증서 발급 → 협약 시중은행에서 대출
- 보증비율: 90~100%, 보증료 연 0.5~1%
- 한도: 최대 1억원(지역별 상이)

### 대리대출 (협약은행)
- 신한·국민·우리·하나·기업·농협·새마을금고 등
- 소진공 재원으로 은행이 대출 실행, 금리 연 3~5%대
- 신청: 소상공인24(www.sbiz.or.kr) 온라인 또는 전국 소진공 지역센터

### 긴급자금
- 소상공인 긴급경영안정자금: 폐업 위기·재해 피해, 최대 1천만원 무이자 또는 저금리
- 재해 피해 특별자금: 화재·수해 등 자연재해 시 신속 지원

---

## 2. 소상공인 무상지원·보조금

### 스마트화 지원
- 스마트공방 기술보급사업: 제조 소공인 스마트 설비 도입, 최대 1천만원(자부담 30%)
- 스마트상점 기술보급사업: 키오스크·POS·서빙로봇·자동화 설비, 최대 150만원(자부담 30%)
- 스마트 미러·CCTV·재고관리시스템 등 포함

### 온라인 판로 지원
- 온라인 진출 바우처: 스마트스토어·쿠팡·11번가·네이버쇼핑 입점 수수료·광고비, 최대 200만원
- 온라인 콘텐츠 제작 지원: 상품 사진·영상 촬영, 최대 200만원
- 라이브커머스 지원: 방송 제작비·플랫폼 입점 비용

### 점포 환경개선
- 간판·인테리어 개선: 최대 250만원(자부담 20%)
- 전통시장 시설 현대화: 아케이드·주차장·화장실 개선
- 문화관광형 시장: 관광 콘텐츠·체험 프로그램 개발 지원

### 경영 지원
- 경영컨설팅 바우처: 세무·노무·법무·마케팅 전문가 연 3회 무료
- 소상공인 역량강화 교육: 온라인·오프라인 무료, 디지털마케팅·회계·창업 등
- 특화시장 육성: 전문상가·야시장·골목상권 활성화

### 배달·플랫폼 지원
- 공공 배달앱(배달특급 등) 입점 지원: 수수료 절감
- 지역화폐 연계 할인: 소비자 캐시백, 가맹점 수수료 지원

---

## 3. 창업 지원 (상세)

### 예비창업패키지
- 대상: 사업자등록 전 예비창업자
- 지원: 최대 1억원 사업화 자금(시제품·마케팅·지재권 등)
- 신청: K-Startup(www.k-startup.go.kr) 공고 확인

### 초기창업패키지
- 대상: 창업 3년 이내
- 지원: 최대 1억원 + 창업 공간·멘토링

### 청년창업사관학교
- 대상: 만 39세 이하, 창업 3년 이내
- 지원: 최대 1억원 + 전용 입주공간 + 집중 멘토링 + IR 기회
- 신청: 창업진흥원(www.kised.or.kr)

### 창업도약패키지
- 대상: 창업 3~7년, 도약 필요 기업
- 지원: 최대 3억원

### 소상공인 재도전 성공패키지
- 대상: 폐업 소상공인 재창업
- 지원: 최대 2천만원 사업화자금 + 교육·멘토링

### 신사업 창업사관학교
- 대상: 주로 40~60대 경력자·시니어
- 지원: 사업화자금 + 점포 운영 지원

### 로컬크리에이터 활성화 지원
- 지역 특화 아이템 창업, 최대 3천만원

### TIPS (민간투자주도형 기술창업)
- 민간 투자 받은 스타트업, 정부 매칭 최대 5억원

---

## 4. 고용 관련 지원 (상세)

### 두루누리 사회보험
- 대상: 월 270만원 미만 근로자 고용한 10인 미만 사업장
- 지원: 고용보험·국민연금 보험료 80% 지원
- 신청: 근로복지공단(www.comwel.or.kr) 또는 4대보험 포털

### 자영업자 고용보험
- 대상: 1인 자영업자~50인 미만 사업주 본인
- 보험료: 기준보수 1등급(182만원)~7등급(363만원) 선택, 2.05~2.25%
- 혜택: 폐업 시 실업급여 최대 8개월, 출산전후급여, 모성보호
- 신청: 근로복지공단

### 청년 일자리 지원
- 청년일자리도약장려금: 청년 채용 사업주 1인당 최대 720만원(월 60만원×12개월)
- 청년 내일채움공제: 청년+기업+정부 3년간 적립, 최대 3천만원 목돈

### 워라밸일자리 장려금
- 소정근로시간 단축 도입 기업, 근로자 1인당 월 30만원

### 고용유지지원금
- 경기 불황 시 휴업·휴직으로 고용 유지한 기업 인건비 지원, 최대 90%

---

## 5. 노란우산공제 (상세)

- 가입 대상: 소기업·소상공인(사업자등록증 보유자), 법인 대표 포함
- 납입: 월 5만~100만원(1만원 단위), 연간 최대 1,200만원
- 소득공제:
  - 사업소득 4,000만원 이하: 연 500만원 공제
  - 4,000~1억원: 연 300만원 공제
  - 1억원 초과: 연 200만원 공제
- 폐업·노령·사망 시: 원금 + 복리이자 수령 (2024년 기준 연 3.2%)
- 대출: 납입금 90% 한도 내 연 3.0% 저금리
- 희망장려금: 신규 가입 소상공인 월 1만원 최대 12개월(지자체별 추가 장려금 운영)
- 압류 금지: 법적으로 압류 불가 → 폐업 시 채권자로부터 보호
- 신청: 소기업소상공인공제(www.8899.or.kr), 가까운 은행·우체국·보험설계사

---

## 6. 폐업지원 - 희망리턴패키지 (상세)

### 사전 폐업 컨설팅
- 폐업 전 경영 진단: 회생 가능성 분석, 법률·세무 무료 자문

### 폐업 지원
- 점포철거비: 최대 250만원 (인테리어 철거, 원상복구)
- 법률·세무 컨설팅: 폐업 절차, 부채 정리, 세금 신고 무료
- 채무조정 연계: 신용회복위원회(www.ccrs.or.kr), 법원 개인회생·파산

### 재기 지원
- 사업정리컨설팅: 자산 처분, 임차료 협상 지원
- 재취업: 취업성공패키지 연계, 구직활동지원금 월 최대 50만원×6개월
- 재창업 교육: 점포경영 아카데미, 디지털 전환 교육 무료 이수
- 재창업 자금: 교육 수료 후 소진공 재창업자금 연계 (최대 7천만원)

### 신청 방법
- 소상공인24(www.sbiz.or.kr) 온라인 신청
- 가까운 소진공 지역센터·상권정보시스템 방문
- 서류: 사업자등록증(또는 폐업사실증명원), 신분증, 임대차계약서

---

## 7. 지자체 지원금 (지역별 상세)

### 공통 확인 방법
- 정부24(www.gov.kr) → 보조금24: 내 상황에 맞는 지원 검색
- 기업마당(www.bizinfo.go.kr): 지역·업종·지원형태 필터 검색
- 복지로(www.bokjiro.go.kr): 복지 서비스 통합 검색

### 서울특별시
- 서울신용보증재단: 소상공인 보증, 최대 1억원, 연 1%대
- 서울형 강소기업 육성: 성장 기업 맞춤 지원
- 서울시 소상공인 경영안정자금: 연 1~2%대, 최대 5천만원
- 서울 온라인 판로 지원: 서울셀러 프로그램
- 서울특별시 소상공인지원센터: 02-2151-3830

### 경기도
- 경기신용보증재단: 경기도 내 소상공인 보증 특화
- 경기도 소상공인 경영안정 자금: 최대 5천만원
- 경기도 골목경제 활성화: 골목상권 상인 지원
- 경기도일자리재단: 청년 창업·취업 연계

### 부산광역시
- 부산신용보증재단: 소상공인 특별 보증
- 부산경제진흥원: 창업·중소기업 종합 지원
- 부산형 뉴딜 지원: 디지털 전환, 그린 분야

### 인천광역시
- 인천신용보증재단: 소상공인 전용 보증
- 인천경제산업정보테크노파크: 창업·기술 지원

### 대구광역시
- 대구신용보증재단: 소상공인 보증
- 대구경북창조경제혁신센터: 스타트업·창업 지원
- 대구시 소상공인 지원센터: 컨설팅·교육

### 기타 광역시도
- 광주: 광주신용보증재단, 광주경제고용진흥원
- 대전: 대전신용보증재단, 대전경제통상진흥원
- 울산: 울산경제진흥원
- 강원: 강원신용보증재단, 강원경제진흥원
- 충북/충남/전북/전남/경북/경남/제주: 각 지역 신용보증재단 + 경제진흥원 문의

---

## 8. 협동조합 설립 (단계별 상세)

### 일반협동조합
1단계: 발기인 모집 (5인 이상)
2단계: 정관 작성 (기획재정부 표준정관 참고)
3단계: 창립총회 개최 (발기인 전원 참석, 의결)
4단계: 설립 신고 (주사무소 소재 시·도지사에게 신고, 2주 소요)
5단계: 출자금 납입 (조합원당 출자금 납입)
6단계: 사업자등록 (세무서)
- 비용: 신고 수수료 없음, 공증 비용 약 20~50만원
- 문의: 기획재정부 협동조합(www.coop.go.kr), 1600-1690

### 사회적협동조합
- 5인 이상, 사회서비스·취약계층 지원 등 공익 목적
- 기획재정부 또는 주무부처 인가 (60일 소요)
- 비영리법인, 배당 불가, 법인세 감면 혜택

### 협동조합 지원
- 협동조합 설립 컨설팅: 무료 (한국사회적기업진흥원)
- 협동조합 활성화 자금: 최대 5천만원 저금리 융자
- 공동 마케팅·판로 지원: 공공기관 납품 우선

---

## 9. 여성기업 지원 (상세)

### 여성기업 확인서 발급
- 발급 기관: (사)한국여성경제인협회
- 신청: 여성기업종합지원센터(www.wbiz.or.kr) 온라인 신청
- 조건: ① 여성이 대표자이거나 ② 실질적으로 경영하는 기업
- 서류: 사업자등록증, 법인등기부등본(법인), 주주명부

### 혜택 상세
- 공공기관 물품·용역 입찰 가점 5%
- 여성기업 전용 정책자금 (소진공): 일반자금 대비 금리 우대
- 여성창업보육센터 입주 우선 배정
- 여성기업 판로 지원: 공공구매 우선 대상
- 조달청 우수조달 물품 가점

### 여성 전용 창업 지원
- 여성창업경진대회: 우수 아이디어 사업화 자금
- 여성벤처창업케어프로그램: 창업 전 과정 밀착 지원
- 여성 1인 창조기업 지원: 사무공간·마케팅 지원

---

## 10. 장애인기업 지원 (상세)

### 장애인기업 확인서 발급
- 발급 기관: (재)장애인기업종합지원센터(www.debc.or.kr)
- 전화: 1588-8972
- 조건: 장애인이 대표자이거나 실질 경영자
- 서류: 장애인등록증, 사업자등록증, 최근 재무제표(법인), 경영실태확인서

### 혜택 상세
- 공공기관 물품·용역 입찰 가점 5%
- 장애인기업 전용 자금: 최대 5억원 (연 2~3%대 저금리)
- 창업 지원: 창업 공간 무료 제공, 창업 자금 우선 지원
- 컨설팅·교육: 경영·마케팅·세무 무료
- 판로 지원: 공공구매 우선 대상

---

## 11. 사회적기업 (상세)

### 인증 요건
- 취약계층 고용 30% 이상 또는 사회서비스 제공
- 민주적 의사결정 구조
- 영업활동 수익 발생
- 신청: 한국사회적기업진흥원(www.socialenterprise.or.kr)

### 지원 내용
- 인건비 지원: 최저임금의 80%, 최대 5년
- 전문인력 지원: 회계·마케팅 전문가 파견
- 경영지원금: 연 최대 3천만원
- 세금 감면: 법인세·소득세 50% 감면 (5년간)
- 공공기관 우선구매: 조달청·공공기관 우선 납품

### 예비사회적기업
- 지역형: 광역지자체 지정, 인건비·사업개발비 지원
- 부처형: 고용노동부·복지부 등 주무부처 지정

---

## 12. 기업 설립 절차 (상세)

### 개인사업자
- 홈택스(www.hometax.go.kr) 온라인 또는 세무서 방문
- 소요 시간: 당일~3일
- 비용: 무료 (일부 업종 허가·등록 비용 별도)
- 업종별 추가 허가: 음식점(위생교육), 주류판매(면허), 의료기기(허가) 등

### 법인 (주식회사)
1단계: 법인명 사전 확인 → 대법원 인터넷등기소(www.iros.go.kr)
2단계: 정관 작성 → 공증인 공증(자본금 10억 미만 발기인 전원 서명으로 대체 가능)
3단계: 주식 인수·출자금 납입 → 은행 잔액증명서 발급
4단계: 법인 설립등기 → 등기소 (자본금 1억 기준 등록면허세 약 20만원, 교육세 포함)
5단계: 사업자등록 → 세무서
- 최소 자본금: 100원 (실질적으로는 수백만원 이상 권장)
- 소요 시간: 2~4주

### 1인 법인
- 발기인 1인으로 설립 가능
- 소규모 법인·프리랜서 세금 절세에 활용

---

## 13. 사업계획서 작성법 (완전 가이드)

### 사업계획서란?
사업의 목표, 전략, 재무계획을 체계적으로 정리한 문서. 정부지원 심사, 투자유치, 은행대출 모두 사업계획서가 필수다.

### 정부지원용 사업계획서 표준 목차 (10장 구성)

1. 사업 개요 (Executive Summary)
- 사업명, 대표자 이름·약력 (1~2줄)
- 핵심 아이템 한 줄 요약: "무엇을, 누구에게, 어떻게"
- 목표 매출 3년 요약, 고용 계획
- 신청 지원금 사용 용도 명시

2. 창업 배경 및 사업 필요성
- 시장의 문제점·불편 데이터로 입증 (통계청·KOSIS·닐슨코리아 인용)
- 기존 해결책의 한계
- 우리 아이템이 이 문제를 해결하는 방법
- "왜 지금인가" - 시장 타이밍 설명

3. 시장 분석
- TAM (전체 시장규모): 국내·글로벌 합산
- SAM (서비스 가능 시장): 실제 공략 가능한 범위
- SOM (목표 점유 시장): 3년 내 달성 목표
- 경쟁사 분석표: 경쟁사 3~5개 장단점 비교
- 차별화 포인트: 기술력·가격·서비스·브랜드

4. 제품·서비스 상세 소개
- 핵심 기능 및 특장점 (스펙 아닌 고객 혜택 중심으로)
- 현재 개발·서비스 현황 (MVP, 프로토타입, 특허 여부)
- 향후 개발 로드맵 (분기별)
- 지식재산권: 특허·상표·디자인 등록 현황

5. 비즈니스 모델 (수익 구조)
- 수익 창출 방법: 판매·구독·수수료·광고·라이선스
- 가격 정책과 그 근거 (원가+마진, 경쟁사 비교)
- 유통 채널: 온라인/오프라인, B2B/B2C/B2G
- 핵심 파트너십 및 공급망

6. 마케팅·영업 전략
- 목표 고객 페르소나 (나이·직업·행동패턴·구매동기)
- 고객 획득 채널: SNS·검색광고·오프라인·입소문
- 월별 마케팅 예산 및 기대 효과
- 고객 유지(재구매) 전략

7. 운영 계획
- 조직도 및 핵심 인력 소개 (경력·역량 강조)
- 생산·서비스 제공 프로세스 (흐름도 포함 권장)
- 외주·협력사 계획
- 사무공간·장비·시설 계획

8. 재무 계획 (3개년)
- 초기 투자비용 내역 (지원금 사용처 포함)
- 월별 매출 예측 근거 (가정 명시 필수)
- 월별 비용 계획 (인건비·임대료·마케팅·재료비)
- 손익분기점(BEP) 달성 시점
- 자금 조달 계획: 자기자본 + 정부지원 + 기타

9. 위험 요소 및 대응 방안
- 시장 리스크: 수요 부진, 경쟁 심화
- 운영 리스크: 인력난, 공급망 문제
- 법규 리스크: 규제 변화, 인허가 문제
- 각 리스크별 구체적 대응 방안

10. 향후 성장 전략
- 단기 (1년): 초기 고객 100명 확보, 제품 안정화
- 중기 (3년): 시장점유율 목표, 신규 서비스 추가
- 장기 (5년): 해외 진출, 기업 공개(IPO) 또는 M&A

### 사업계획서 표준 템플릿 (바로 쓰는 양식)

[표지]
사업계획서
사업명: OOO
대표자: OOO
사업자등록번호: OOO (예정 포함)
제출일: 2025년 O월 O일
신청 지원사업: OOO

[목차]
1. 사업 개요 ··· 1p
2. 창업 배경 ··· 2p
3. 시장 분석 ··· 3p
4. 제품·서비스 ··· 4p
5. 비즈니스 모델 ··· 5p
6. 마케팅 전략 ··· 6p
7. 운영 계획 ··· 7p
8. 재무 계획 ··· 8p
9. 리스크 관리 ··· 9p
10. 성장 전략 ··· 10p

### 심사 통과 핵심 전략 10가지

1. 숫자로 말하라: 모든 주장에 데이터 (통계청·한국은행·업계보고서)
2. 창업자 적합성: 아이템과 대표자 경력의 연결고리 명확히
3. 현실적 매출 예측: 과도한 낙관보다 근거 있는 보수적 예측
4. 사회적 가치: 일자리 창출·지역경제·환경 기여 → 가점
5. 정책 방향 일치: 디지털전환·탄소중립·지역균형발전 키워드
6. 차별화: "왜 우리가 해야 하는가" 설득력 있게
7. MVP 존재: 이미 만들어진 것, 테스트한 것 있으면 강점
8. 팀 역량: 혼자보다 팀, 각자 역할과 경력 명시
9. 지원금 사용처 명확: 어디에 얼마를 쓸지 세부 계획
10. 깔끔한 디자인: 표·그래프 활용, 한 페이지에 1가지 핵심

### 사업계획서 작성 무료 지원
- 소상공인시장진흥공단 경영컨설팅: 1357 (무료)
- 창업진흥원 창업지원단: 1357 (무료)
- 중소벤처기업진흥공단 온라인: www.sbc.or.kr
- 기업마당 사업계획서 샘플: www.bizinfo.go.kr

---

## 14. 세금 혜택 (상세)

### 부가가치세
- 일반과세자: 매출의 10% (매입세액 공제 가능)
- 간이과세자: 연 매출 1억 400만원 미만, 업종별 부가가치율×10%
- 면세: 연 매출 4,800만원 미만 간이과세자 부가세 납부 면제

### 창업 중소기업 세액감면
- 수도권 과밀억제권역 외 지역 창업: 5년간 법인세·소득세 50% 감면
- 청년 창업 (만 34세 이하): 5년간 100% 감면
- 해당 업종: 제조·음식·숙박·도소매·서비스 등 대부분 해당
- 신청: 세무서 세액감면 신청서 제출

### 고용 관련 세액공제
- 청년 정규직 채용: 1인당 연 300~1,100만원 세액공제 (지역·규모별)
- 경력단절여성 채용: 1인당 연 최대 900만원
- 장애인 채용: 1인당 연 최대 2,000만원 공제

### 기타 세금 혜택
- 소규모 법인 최저한세 적용 배제
- 창업벤처 중소기업 50% 감면 (벤처 확인 받은 경우)
- 연구인력개발비 세액공제: R&D 비용의 최대 30%

---

## 15. 금융·보증 지원 (상세)

### 신용보증기금
- 담보 없는 기업 보증, 최대 30억원
- 보증료: 연 0.5~3% (신용도별 차등)
- 신청: 신용보증기금(www.kodit.co.kr) 또는 협약 은행

### 기술보증기금
- 기술 기반 기업 특화 보증
- 기술 평가로 담보 대체, 최대 30억원
- 신청: 기술보증기금(www.kibo.or.kr)

### 중소벤처기업진흥공단
- 중소기업 정책자금: 시설자금·운전자금, 연 2~3%대
- 청년전용창업자금: 만 39세 이하, 최대 1억원
- 신청: 중소벤처기업진흥공단(www.sbc.or.kr)

### 미소금융
- 저신용·저소득 자영업자 전용
- 금리: 연 4.5% 이하
- 한도: 사업자금 2천만원, 창업자금 7천만원
- 신청: 미소금융중앙재단(www.msmf.or.kr)

### 새출발기금
- 코로나 피해 자영업자·소상공인 채무조정
- 원금 감면 또는 장기 분할상환
- 신청: 캠코(한국자산관리공사, www.kamco.or.kr)

---

## 16. 업종별 특화 지원

### 음식점·카페
- 위생교육 의무이수 후 영업허가
- 소상공인 배달비 지원: 공공배달앱 입점 지원
- 로컬푸드 식재료 지원: 지역 농산물 사용 업체 우대

### 소매업·편의점
- 전통시장 상인 우선 지원
- POS·재고관리 시스템 도입 지원

### 제조업 (소공인)
- 소공인 복합지원센터: 공동 장비 사용, 기술 교육
- 스마트공방: AI·IoT 설비 도입 지원

### 서비스업
- 디지털 전환 바우처: AI·클라우드·빅데이터 도입
- 수출 바우처: 해외 판로 개척 지원

---

답변 규칙:
- 질문의 의도를 파악하여 가장 관련 높은 정보 우선 제공
- 신청 방법, 기관 연락처, URL 반드시 포함
- 금액·금리·기간 등 구체적 숫자 제시
- 자격 조건과 필요 서류 안내
- 지자체 지원금은 웹 검색으로 최신 정보 확인 후 안내
- 복잡한 절차는 단계별(1→2→3)로 설명
- 답변은 핵심부터 간결하게, 모바일에서 읽기 편하게
- 반드시 모든 텍스트는 순수 한국어로만 작성 (한자, 중국어, 일본어 문자 절대 사용 금지)
- URL/링크는 아래 검증된 목록에서만 제공: sbiz.or.kr, k-startup.go.kr, mss.go.kr, bizinfo.go.kr, gov.kr, moel.go.kr, unikorea.go.kr, koreahana.or.kr, kodit.co.kr, kibo.or.kr, 8899.or.kr, hometax.go.kr. 목록에 없는 URL은 절대 제공하지 말고 기관명과 전화번호만 제공할 것
- 반드시 답변 맨 마지막에 아래 형식으로 추천 질문 3개 추가 (형식 절대 변경 금지, 한자 금지):
[추천: 질문1||질문2||질문3]

## 16. 새터민(북한이탈주민) 지원

### 정착 지원
- 하나원(통일원): 사회적응교육 3개월 과정, 거주지 배정, 기초생활 지원
- 정착금: 기본금 800만원 + 가산금(장려금, 가족 수에 따라 추가)
- 주거지원: 임대아파트 우선 공급
- 의료보호: 5년간 의료급여 1종 적용

### 취업·창업 지원
- 취업지원관: 직업훈련, 취업알선 (하나센터 통해 신청)
- 창업지원: 소진공 정책자금 일반 소상공인과 동일 적용 가능
- 자격취득 지원: 국가기술자격 시험 응시료 지원
- 취업성공패키지: 고용노동부, 구직활동 지원금 월 최대 50만원

### 교육 지원
- 대학특례입학: 북한이탈주민 특별전형
- 교육비 지원: 중·고·대학교 전액 지원
- 국가장학금 우선 지원

### 주요 기관 및 연락처
- 통일부 공식 사이트: www.unikorea.go.kr
- 남북하나재단 ☎ 1577-6635 (공식: www.koreahana.or.kr)
- 북한이탈주민 지원재단 상담 ☎ 1577-6635
- 취업지원 상담: 남북하나재단 02-3215-5714
- 정착 관련: 통일부 남북통합문화센터 02-2085-7300

### 사업계획서 공식 양식 다운로드
- 소상공인24: www.sbiz.or.kr (자료실 → 서식자료)
- K-Startup: www.k-startup.go.kr (자료실)
- 중소벤처기업부: www.mss.go.kr (자료실 → 서식)
- 기업마당: www.bizinfo.go.kr (자료실)`

export default function GovernmentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! AI 정책자금 컨설턴트입니다 🏛️\n\n수천만원짜리 컨설팅을 무료로 — 자금 신청부터 결론까지 함께합니다.\n\n위 카테고리를 선택하거나 직접 질문해보세요 👇',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminData, setAdminData] = useState<AdminData[]>([])
  const [showGuide, setShowGuide] = useState(false)
  const [authUser, setAuthUser] = useState<{id:string;email:string} | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showReset, setShowReset] = useState(false)
  const [expandedMsgs, setExpandedMsgs] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const sess = loadSession()
      if (sess) setAuthUser({ id: sess.id, email: sess.email })
      const savedTheme = localStorage.getItem('storeauto_theme')
      if (savedTheme && savedTheme !== 'dark') {
        document.body.className = 'theme-' + savedTheme
      }
    } catch (_e) { /* ignore */ }

    // Supabase에서 정부지원 데이터 로드
    const loadGovData = async () => {
      try {
        const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '') + '/rest/v1/gov_support?order=created_at.desc'
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        if (!url || !key) return
        const res = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setAdminData(data)
        }
      } catch (_e) { /* ignore */ }
    }
    loadGovData()

    return () => { document.body.className = '' }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildSystemPrompt = (): string => {
    let prompt = SYSTEM_PROMPT
    if (adminData.length > 0) {
      prompt += '\n\n## 관리자 등록 추가 지원정보 (우선 안내)\n'
      adminData.forEach((d) => {
        prompt += '\n[' + d.region + '] ' + d.title + ' (' + d.category + '): ' + d.content + '\n'
      })
    }
    return prompt
  }

  const toKorErr = (msg: string) => {
    if (!msg) return '⚠️ 오류가 발생했어요. 다시 시도해주세요.'
    if (msg.includes('quota') || msg.includes('limit') || msg.includes('RESOURCE_EXHAUSTED')) return '⏳ API 사용 한도 초과예요. 잠시 후 다시 시도해주세요.'
    if (msg.includes('401') || msg.includes('403') || msg.includes('api_key') || msg.includes('API key')) return '🔑 API 키가 올바르지 않아요. 설정을 확인해주세요.'
    if (msg.includes('429')) return '⏳ 요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
    if (msg.includes('billing') || msg.includes('insufficient_quota')) return '💳 API 크레딧이 부족해요.'
    return '⚠️ 오류가 발생했어요. 다시 시도해주세요.'
  }

  const callAI = async (systemPrompt: string, msgs: Message[]): Promise<string> => {
    // Supabase에서 키 불러오기 (모든 기기 동일)
    const userKeys = await loadUserKeys().catch(() => ({ gemini: '', openai: '', groq: '' }))
    const userGemini = userKeys.gemini
    const userOpenai = userKeys.openai
    const userGroq   = userKeys.groq

    // 키가 하나도 없으면 즉시 안내
    if (!userGemini && !userOpenai && !userGroq) {
      throw new Error('NO_KEY')
    }

    const fullPrompt = systemPrompt + '\n\n' + msgs.map(m => (m.role==='user'?'사용자: ':'AI: ') + m.content).join('\n')

    const providers: Array<'gemini'|'groq'|'openai'> = [
      ...(userGemini ? ['gemini' as const] : []),
      ...(userGroq   ? ['groq'   as const] : []),
      ...(userOpenai ? ['openai' as const] : []),
    ]

    for (const provider of providers) {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, provider, userGemini, userOpenai, userGroq }),
        })
        const data = await res.json()
        if (res.ok && data.text) return data.text
      } catch { continue }
    }
    throw new Error('AI 응답에 실패했어요. 다시 시도해주세요.')
  }

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setSuggestions([])
    setLoading(true)

    try {
      const reply = await callAI(buildSystemPrompt(), newMessages)

      // 추천 질문 파싱
      const sugMatch = reply.match(/\[추천:\s*(.+?)\]/)
      if (sugMatch) {
        const sugs = sugMatch[1].split('||')
          .map((s: string) => s.trim().replace(/[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\uFF00-\uFFEF]/g, '').trim())
          .filter(Boolean)
        setSuggestions(sugs)
      }
      // 추천 질문 태그 제거 후 저장
      const cleanReply = reply.replace(/\[추천:.*?\]/g, '').trim()
      setMessages([...newMessages, { role: 'assistant', content: cleanReply }])
      // 로그인 사용자 usage 기록
      if (authUser) {
        try {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          const sess = JSON.parse(localStorage.getItem('sa_session') || '{}')
          if (sess.access_token) {
            fetch(SUPABASE_URL + '/rest/v1/usage_stats', {
              method: 'POST',
              headers: { 'Content-Type':'application/json', apikey:SUPABASE_ANON_KEY, Authorization:'Bearer '+sess.access_token, Prefer:'' },
              body: JSON.stringify({ user_id: authUser.id, type: 'government', meta: userText.slice(0, 50) }),
            }).catch(() => {})
          }
        } catch (_e) { /* ignore */ }
      }
    } catch (_e) {
      const raw = _e instanceof Error ? _e.message : ''
      if (raw === 'NO_KEY') {
        setMessages([...newMessages, { role: 'assistant', content: 'NO_KEY_UI' }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: toKorErr(raw) }])
      }
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: '대화가 초기화됐어요 😊\n\n위 카테고리를 선택하거나 직접 질문해보세요 👇',
    }])
    setSuggestions([])
    setShowReset(false)
  }

  const formatMessage = (text: string) => {
    const SAFE_DOMAINS = ['sbiz.or.kr','k-startup.go.kr','mss.go.kr','bizinfo.go.kr','kised.or.kr','kodit.co.kr','kibo.or.kr','8899.or.kr','gov.kr','bokjiro.go.kr','hometax.go.kr','sbc.or.kr','comwel.or.kr','nts.go.kr','unikorea.go.kr','koreahana.or.kr','moel.go.kr','kbiz.or.kr','ccrs.or.kr','socialenterprise.or.kr','coop.go.kr','wbiz.or.kr','debc.or.kr','iros.go.kr','mogef.go.kr']

    const makeHref = (url: string): { href: string; isSafe: boolean } => {
      const href = /^https?:\/\//.test(url) ? url : 'https://' + url
      const rawDomain = href.replace(/https?:\/\//, '').split('/')[0]
      const domain = rawDomain.replace(/^www\./, '')
      const isSafe = SAFE_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))
      return { href: isSafe ? href : 'https://www.google.com/search?q=' + encodeURIComponent(rawDomain), isSafe }
    }

    // 마크다운 링크 [텍스트](URL) → URL만 추출
    const preClean = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|www\.[^)]+)\)/g, '$2')

    const clean = preClean
      .replace(/[\u4E00-\u9FFF\u3400-\u4DBF]/g, '')
      .replace(/\*\*(.+?)\*\*/g, '\u3010$1\u3011')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^#{1,3}\s*/gm, '')
      .replace(/^---+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')

    const URL_REGEX = /(https?:\/\/[^\s)\]]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s)\]]*)/g
    const lines = clean.split('\n')
    const result: React.ReactNode[] = []
    let numIdx = 0

    const renderInline = (str: string, key: string): React.ReactNode => {
      // 굵게 처리 〔〕
      const parts = str.split(/(〔.+?〕)/)
      return (
        <span key={key}>
          {parts.map((p, i) => {
            if (p.startsWith('\u3010') && p.endsWith('\u3011')) {
              return <strong key={i} style={{ color: 'var(--text)', fontWeight: 800 }}>{p.slice(1, -1)}</strong>
            }
            return <span key={i}>{p}</span>
          })}
        </span>
      )
    }

    lines.forEach((line, i) => {
      const trimmed = line.trim()

      // 빈 줄
      if (!trimmed) {
        result.push(<div key={'sp'+i} style={{ height: '10px' }} />)
        return
      }

      // URL 포함 → 링크 카드
      if (URL_REGEX.test(trimmed)) {
        URL_REGEX.lastIndex = 0
        const parts = trimmed.split(URL_REGEX)
        const nodes: React.ReactNode[] = []
        parts.forEach((part, j) => {
          if (/^https?:\/\//.test(part) || /^www\./.test(part)) {
            // www. 링크는 Google 검색으로 안전하게 처리 (없는 도메인 방지)
            const { href, isSafe } = makeHref(part)
            const rawDomain = (/^https?:\/\//.test(part) ? part : 'https://' + part).replace(/https?:\/\//, '').split('/')[0]
            const label = isSafe ? rawDomain : rawDomain + ' 검색'
            nodes.push(
              <a key={j} href={href} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: isSafe ? 'rgba(59,130,246,0.12)' : 'rgba(99,102,241,0.12)',
                border: isSafe ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(99,102,241,0.3)',
                borderRadius: '8px', padding: '5px 12px', margin: '2px 2px',
                color: isSafe ? '#60a5fa' : '#a78bfa', fontSize: '13px', fontWeight: 700,
                textDecoration: 'none',
              }}>{isSafe ? '🔗' : '🔍'} {label}</a>
            )
          } else if (part.trim()) {
            nodes.push(<span key={j} style={{ fontSize: '14px' }}>{part}</span>)
          }
        })
        result.push(
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px', margin: '6px 0' }}>
            {nodes}
          </div>
        )
        return
      }

      // 구분선 (----)
      if (/^[-─━]+$/.test(trimmed)) {
        result.push(<div key={i} style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />)
        return
      }

      // 번호 목록 (1. 2. 3.)
      const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
      if (numMatch) {
        const colors = ['#ff6b35','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899']
        const color = colors[numIdx % colors.length]
        numIdx++
        result.push(
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 12px', margin: '4px 0', background: color+'0e', borderLeft: '3px solid '+color, borderRadius: '0 8px 8px 0' }}>
            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, marginTop: 1 }}>{numMatch[1]}</span>
            <span style={{ flex: 1, fontSize: 'clamp(13px,3.5vw,15px)', lineHeight: '1.7' }}>{renderInline(numMatch[2], 'n'+i)}</span>
          </div>
        )
        return
      }

      // 대시/점 목록
      const dashMatch = trimmed.match(/^[-•·▸]\s+(.+)/)
      if (dashMatch) {
        result.push(
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '4px 2px', margin: '1px 0' }}>
            <span style={{ flexShrink: 0, color: '#60a5fa', fontWeight: 900, fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>•</span>
            <span style={{ flex: 1, fontSize: 'clamp(13px,3.5vw,15px)', lineHeight: '1.7', color: 'var(--text)' }}>{renderInline(dashMatch[1], 'd'+i)}</span>
          </div>
        )
        return
      }

      // 소제목 (콜론으로 끝나거나 ### 패턴)
      if ((trimmed.endsWith(':') || trimmed.endsWith('：')) && trimmed.length < 40) {
        numIdx = 0
        result.push(
          <div key={i} style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.5px', marginTop: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 3, height: 14, background: '#fbbf24', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
            {trimmed.replace(/:$/, '').replace(/：$/, '')}
          </div>
        )
        return
      }

      // 일반 텍스트
      result.push(
        <div key={i} style={{ fontSize: '14px', lineHeight: '1.75', color: 'var(--text)', padding: '1px 0' }}>
          {renderInline(trimmed, 't'+i)}
        </div>
      )
    })

    return <div style={{ display: 'flex', flexDirection: 'column' }}>{result}</div>
  }

  const dotDelays = [0, 0.2, 0.4]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      fontFamily: "'Noto Sans KR', sans-serif", display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes floatBtn {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        @keyframes guideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes tagPop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        input::placeholder { color: var(--text-muted); }
        textarea::placeholder { color: var(--text-muted); }
        * { box-sizing: border-box; }
        select option { background: #1c1c28; }
        .guide-tag:hover { transform: scale(1.08); transition: transform 0.2s; }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .cat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 헤더 */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', borderRadius: '10px', padding: '10px 14px',
          cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0,
          minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 700, fontFamily: 'inherit',
        }}>← 대시보드</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🏛️</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>정부지원 안내</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              소상공인·창업·협동조합·여성·장애인기업
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--green)', flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          AI
        </div>

        <button onClick={() => setShowReset(true)} title="대화 초기화" style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', borderRadius: '10px', padding: '10px 12px',
          cursor: 'pointer', fontSize: '18px', flexShrink: 0,
          minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>🔄</button>
      </div>

      {/* 초기화 확인 팝업 */}
      {showReset && (
        <div onClick={() => setShowReset(false)} style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '28px 24px', maxWidth: 300, width: '100%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>대화 초기화</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              지금까지의 대화 내용이 모두 지워져요.<br />초기화할까요?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowReset(false)} style={{
                flex: 1, padding: '11px', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: '12px',
                color: 'var(--text)', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                fontFamily: "'Noto Sans KR',sans-serif",
              }}>취소</button>
              <button onClick={resetChat} style={{
                flex: 1, padding: '11px', background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                border: 'none', borderRadius: '12px', color: 'white',
                cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                fontFamily: "'Noto Sans KR',sans-serif",
                boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
              }}>초기화</button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 카드 - 가로 스크롤 */}
      <div className="cat-scroll" style={{
        overflowX: 'auto', display: 'flex', gap: '8px',
        padding: '10px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        scrollbarWidth: 'none',
      }}>
        {CATEGORY_CARDS.map((c, i) => (
          <button key={i} onClick={() => sendMessage(c.q)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '10px 14px', borderRadius: '14px', cursor: 'pointer', flexShrink: 0,
            border: '1px solid ' + c.color + '33',
            background: c.color + '10',
            transition: 'all 0.2s', fontFamily: "'Noto Sans KR',sans-serif",
          }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = c.color + '22'; el.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = c.color + '10'; el.style.transform = '' }}
          >
            <span style={{ fontSize: '20px' }}>{c.emoji}</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: c.color, whiteSpace: 'nowrap' }}>{c.label}</span>
          </button>
        ))}
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', padding: 'clamp(12px,3vw,20px)',
        paddingBottom: 'clamp(16px,4vw,24px)',
        maxWidth: '800px', width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '8px', alignItems: 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
              }}>🏛️</div>
            )}
            <div style={{
              maxWidth: msg.role === 'user' ? '75%' : '88%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent), #ff8c5a)'
                : 'var(--surface)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              padding: msg.role === 'user' ? '10px 14px' : '14px 16px',
              fontSize: 'clamp(13px,3.5vw,15px)',
              lineHeight: '1.7',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              boxShadow: msg.role === 'assistant' ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
              wordBreak: 'break-word',
            }}>
              {msg.content === 'NO_KEY_UI' ? (
                <div>
                  <div style={{ fontSize: 14, marginBottom: 14 }}>🔑 API 키가 설정되지 않았어요. 마이페이지에서 <strong>Gemini(무료)</strong> 또는 Groq(무료) 키를 등록하면 바로 사용할 수 있어요!</div>
                  <a href="/mypage?tab=keys" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'linear-gradient(135deg,#ff6b35,#ffd700)', borderRadius: 10, color: 'white', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>🔑 마이페이지에서 키 설정하기</a>
                </div>
              ) : msg.role === 'assistant' && msg.content.length > 400 ? (
                <>
                  {expandedMsgs.has(i)
                    ? formatMessage(msg.content)
                    : formatMessage(msg.content.slice(0, 350) + '...')
                  }
                  <button onClick={() => setExpandedMsgs(prev => {
                    const next = new Set(prev)
                    if (next.has(i)) next.delete(i); else next.add(i)
                    return next
                  })} style={{
                    display: 'block', marginTop: '10px',
                    background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)',
                    borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                    fontWeight: 700, color: 'var(--accent)', cursor: 'pointer',
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}>
                    {expandedMsgs.has(i) ? '▲ 접기' : '▼ 전체 보기'}
                  </button>
                </>
              ) : formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>🏛️</div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px', padding: '14px 18px',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}>
              {dotDelays.map((delay, j) => (
                <span key={j} style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                  display: 'inline-block',
                  animation: 'bounce 1.2s ease-in-out ' + delay + 's infinite',
                }} />
              ))}
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700 }}>💡 자주 묻는 질문</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: '20px', padding: '8px 16px',
                  fontSize: '13px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.4',
                  transition: 'all 0.2s', fontFamily: "'Noto Sans KR',sans-serif",
                }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor='var(--accent)'; el.style.color='var(--accent)' }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor='var(--border)'; el.style.color='var(--text)' }}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* AI 추천 질문 */}
        {suggestions.length > 0 && !loading && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 이런 것도 궁금하지 않으세요?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)',
                  color: 'var(--text)', borderRadius: '12px', padding: '10px 16px',
                  fontSize: '13px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.5',
                  width: '100%', fontFamily: "'Noto Sans KR',sans-serif", transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.background='rgba(255,107,53,0.14)'; el.style.transform='translateX(4px)' }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.background='rgba(255,107,53,0.06)'; el.style.transform='' }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 900, flexShrink: 0 }}>→</span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '10px 14px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        position: 'sticky', bottom: 0,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            placeholder="궁금한 지원제도를 물어보세요..."
            disabled={loading}
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '24px', padding: '12px 18px', color: 'var(--text)',
              fontSize: '16px', outline: 'none', minWidth: 0,
              WebkitAppearance: 'none',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '50%', width: 48, height: 48, fontSize: '20px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.4 : 1,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >↑</button>
        </div>
        <div style={{ maxWidth: '800px', margin: '6px auto 0', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          AI+웹검색 · 소상공인시장진흥공단 ☎ 1357
        </div>
      </div>
      {/* 노란 플로팅 버튼 */}
      <button
        onClick={() => setShowGuide(true)}
        style={{
          position: 'fixed', bottom: '80px', right: '20px', zIndex: 500,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffd700, #ffb300)',
          border: 'none', cursor: 'pointer', fontSize: '24px',
          boxShadow: '0 4px 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)',
          animation: 'floatBtn 2.5s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="사용 설명서"
      >📖</button>

      {/* 가이드 모달 */}
      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', animation: 'overlayIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(160deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a1a 100%)',
              border: '1px solid rgba(255,215,0,0.25)',
              borderRadius: 28, padding: '32px 28px',
              animation: 'guideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 0 80px rgba(255,215,0,0.15), 0 40px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 72, height: 72, borderRadius: 22,
                background: 'linear-gradient(135deg, #ffd700, #ffb300)',
                fontSize: 36, marginBottom: 14,
                boxShadow: '0 0 40px rgba(255,215,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
              }}>🏛️</div>
              <div style={{
                fontSize: 'clamp(18px,4vw,24px)', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.5px', marginBottom: 6,
              }}>정부지원 AI 챗봇</div>
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '2px',
                background: 'linear-gradient(90deg, #ffd700, #ff8c5a, #ffd700)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              }}>사용 설명서 · USER GUIDE</div>
            </div>

            {/* 기능 소개 */}
            <div style={{ marginBottom: 22 }}>
              <SectionTitle emoji="✨" text="주요 기능" color="#ffd700" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon:'💰', title:'소상공인 정책자금', desc:'직접대출·대리대출·긴급자금 신청방법 안내', color:'#ff6b35' },
                  { icon:'🎁', title:'무상지원·보조금', desc:'스마트화·온라인판로·점포환경개선 지원', color:'#10b981' },
                  { icon:'🗺️', title:'지자체 지원금 실시간 검색', desc:'전국 17개 시도 최신 지원정보 웹검색 연동', color:'#3b82f6' },
                  { icon:'🤝', title:'협동조합·기업 설립', desc:'협동조합·여성기업·장애인기업·사회적기업', color:'#8b5cf6' },
                  { icon:'📄', title:'사업계획서 작성', desc:'정부지원 심사 통과를 위한 전략적 작성법', color:'#f59e0b' },
                  { icon:'🛡️', title:'세금혜택·노란우산', desc:'간이과세·세액공제·노란우산공제 완벽 안내', color:'#ec4899' },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    background: f.color + '0d',
                    border: '1px solid ' + f.color + '25',
                    borderRadius: 14, padding: '12px 16px',
                    borderLeft: '3px solid ' + f.color,
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: f.color, marginBottom: 2 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 사용방법 */}
            <div style={{ marginBottom: 22 }}>
              <SectionTitle emoji="💡" text="이렇게 사용하세요" color="#34d399" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { step:'1', text:'아래 자주 묻는 질문 버튼을 눌러보세요', tip:'빠른 시작', tipColor:'#10b981' },
                  { step:'2', text:'지역명을 포함해서 질문하면 더 정확해요', tip:'지역 맞춤', tipColor:'#3b82f6' },
                  { step:'3', text:'"신청 방법 알려줘"처럼 구체적으로 물어보세요', tip:'상세 안내', tipColor:'#8b5cf6' },
                  { step:'4', text:'답변의 링크를 클릭하면 신청 페이지로 이동해요', tip:'원클릭 신청', tipColor:'#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #ffd700, #ffb300)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900, color: '#000',
                      boxShadow: '0 0 12px rgba(255,215,0,0.4)',
                    }}>{s.step}</div>
                    <div style={{ flex: 1, paddingTop: 3 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.text}</span>
                      <span className="guide-tag" style={{
                        display: 'inline-block', marginLeft: 8,
                        fontSize: 10, padding: '2px 8px', borderRadius: 20,
                        background: s.tipColor + '22', color: s.tipColor, fontWeight: 800,
                        animation: 'tagPop ' + (2+i*0.3) + 's ease-in-out infinite',
                      }}>{s.tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 질문 예시 */}
            <div style={{ marginBottom: 24 }}>
              <SectionTitle emoji="💬" text="이런 질문을 해보세요" color="#60a5fa" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  '서울 소상공인 지원금 알려줘',
                  '폐업하면 뭘 받을 수 있어?',
                  '협동조합 5명으로 만들 수 있어?',
                  '여성기업 인증하면 뭐가 좋아?',
                  '사업계획서 구성은 어떻게 해?',
                  '노란우산 소득공제 얼마야?',
                  '청년창업 지원금 신청하고 싶어',
                  '간이과세자 기준이 뭐야?',
                ].map((q, i) => (
                  <button key={i} onClick={() => { setShowGuide(false); sendMessage(q) }} style={{
                    background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                    borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    color: '#93c5fd', cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif",
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.08)'; (e.currentTarget as HTMLElement).style.transform = '' }}
                  >{q}</button>
                ))}
              </div>
            </div>

            {/* 푸터 */}
            <div style={{
              textAlign: 'center', padding: '16px', borderRadius: 14,
              background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
                🤖 AI + 실시간 웹검색 기반 · 정확한 정보는 소상공인시장진흥공단
                <span style={{ color: '#ffd700', fontWeight: 800 }}> ☎ 1357 </span>
                문의
              </div>
            </div>

            <button onClick={() => setShowGuide(false)} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #ffd700, #ffb300)',
              border: 'none', borderRadius: 14, color: '#000',
              fontSize: 15, fontWeight: 900, cursor: 'pointer',
              fontFamily: "'Noto Sans KR',sans-serif",
              boxShadow: '0 8px 24px rgba(255,215,0,0.35)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(255,215,0,0.5)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(255,215,0,0.35)' }}
            >🚀 바로 시작하기</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ emoji, text, color }: { emoji: string; text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color, letterSpacing: '0.3px' }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, ' + color + '44, transparent)' }} />
    </div>
  )
}
