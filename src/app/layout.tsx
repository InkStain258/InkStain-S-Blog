import '@/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import { SITE_URL } from '@/lib/site-url'
import Layout from '@/layout'
import Head from '@/layout/head'
import siteContent from '@/config/site-content.json'
import { ThemeProvider } from '@/hooks/use-theme'

const {
  meta: { title, description },
} = siteContent

// siteContent.meta.title 形如 “InkStain's Blog | 技术杂谈 …”，站点名只取品牌段
const SITE_NAME = 'InkStain'

export const metadata: Metadata = {
  // 标签页图标 = 头像。favicon.ico 给老浏览器，其余给高分屏与 iOS 主屏
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico']
  },
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: `%s | ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'zh_CN',
    title,
    description,
    url: '/'
  },
  twitter: { card: 'summary_large_image', title, description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }
  },
  formatDetection: { telephone: false, email: false, address: false },
  authors: [{ name: 'InkStain', url: SITE_URL }],
  creator: 'InkStain',
  publisher: 'InkStain'
}

export const viewport: Viewport = {
  // 手机端必须按设备宽度排版，且**不禁止缩放**（WCAG 1.4.4）。
  // 原来 layout/head.tsx 里手写过一份 user-scalable=no 的 viewport，
  // 和这里这份同时输出，浏览器取第一个 → 用户连双指放大都被禁掉。
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1526' }
  ],
  colorScheme: 'light dark'
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning style={{ cursor: 'url(/images/cursor.svg) 2 1, auto' }}>
      <Head />
      <body>
        {/* Prevent FOUC: read localStorage before page renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('ink-theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
                if (/windows|win32/i.test(navigator.userAgent)) {
                  document.documentElement.classList.add('windows');
                }
              })();
            `,
          }}
        />
        {/* 全站动态背景：三团缓慢漂移的光斑，玻璃卡片会把它模糊成底纹 */}
        <div className='site-aurora' aria-hidden='true'>
          <i />
          <i />
          <i />
        </div>
        <ThemeProvider>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}
