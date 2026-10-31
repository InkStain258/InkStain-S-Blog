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
        <ThemeProvider>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}
