import '@/styles/globals.css'

import type { Metadata } from 'next'
import Layout from '@/layout'
import Head from '@/layout/head'
import siteContent from '@/config/site-content.json'
import { ThemeProvider } from '@/hooks/use-theme'

const {
  meta: { title, description },
} = siteContent

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description },
  twitter: { title, description },
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ cursor: 'url(/images/cursor.svg) 2 1, auto' }}>
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
