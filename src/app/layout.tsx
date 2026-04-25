import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StoreAuto — 스마트스토어 상품설명 자동화',
  description: '네이버 스마트스토어 상품 상세페이지를 AI로 자동 생성',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
