export interface ProductInput {
  productName: string
  category: string
  features: string[]
  targetCustomer: string
  priceRange: string
  promotions: string[]
  extraInfo: string
}

export interface GeneratedResult {
  keywords: string[]
  oneLiner: string
  description: string
  recommendation: string
  cta: string
  faq: { q: string; a: string }[]
  htmlCode: string
}
