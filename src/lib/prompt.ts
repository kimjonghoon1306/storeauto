import { ProductInput } from './types'

export function buildPrompt(input: ProductInput): string {
  return `
당신은 네이버 스마트스토어 상품 상세페이지 전문 작성 AI입니다.
다음 상품 정보를 바탕으로 판매에 최적화된 상세 콘텐츠를 생성해주세요.

[상품 정보]
- 상품명: ${input.productName}
- 카테고리: ${input.category}
- 핵심 특징: ${input.features.join(', ')}
- 타겟 고객: ${input.targetCustomer}
- 가격대: ${input.priceRange}
- 프로모션: ${input.promotions.length > 0 ? input.promotions.join(', ') : '없음'}
- 추가 정보: ${input.extraInfo || '없음'}

아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.

{
  "keywords": ["네이버 검색 최적화 키워드 10개 배열"],
  "oneLiner": "상품 핵심을 담은 한 줄 카피 (20자 내외)",
  "description": "상세 설명 본문 (소재/기능/사용법 포함, 300~500자, 줄바꿈은 \\n 사용)",
  "recommendation": "이런 분께 추천합니다 섹션 (3가지 타입의 고객 추천, 각 줄바꿈은 \\n 사용)",
  "cta": "구매 유도 멘트 (긴급성/혜택 강조, 2~3문장)",
  "faq": [
    {"q": "자주 묻는 질문1", "a": "답변1"},
    {"q": "자주 묻는 질문2", "a": "답변2"},
    {"q": "자주 묻는 질문3", "a": "답변3"},
    {"q": "자주 묻는 질문4", "a": "답변4"},
    {"q": "자주 묻는 질문5", "a": "답변5"}
  ],
  "htmlCode": ""
}

htmlCode는 빈 문자열로 두세요.
`
}
