import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'StoreAuto — 스마트스토어 상품설명 자동화',
  description: 'AI로 스마트스토어 상세페이지 10초 자동 생성. 리뷰 답글 대량생성, 정부지원금 AI 상담까지. 소상공인을 위한 AI 비서',
  keywords: ['스마트스토어 자동화', '상세페이지 자동생성', 'AI 소상공인', '리뷰 답글', '정부지원금'],
  authors: [{ name: 'Store Auto' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Store Auto',
    title: 'StoreAuto — 스마트스토어 상품설명 자동화',
    description: 'AI로 상세페이지 10초 완성 · 리뷰 답글 대량생성 · 정부지원금 AI 상담. 소상공인을 위한 AI 비서',
    url: 'https://store.xn--zk5biyyw.com',
    images: [
      {
        url: 'https://store.xn--zk5biyyw.com/storeauto_og.png',
        width: 1200,
        height: 630,
        alt: 'StoreAuto 스마트스토어 상품설명 자동화 AI 비서',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoreAuto — 스마트스토어 상품설명 자동화',
    description: 'AI로 상세페이지 10초 완성. 소상공인을 위한 AI 비서',
    images: ['https://store.xn--zk5biyyw.com/storeauto_og.png'],
  },
  metadataBase: new URL('https://store.xn--zk5biyyw.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  )
}
