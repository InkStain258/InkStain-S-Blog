'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

const GITALK_CLIENT_ID = process.env.NEXT_PUBLIC_GITALK_CLIENT_ID || 'Ov23lixBE1JBA4I67AMe'
const GITALK_REPO = 'InkStain-S-Blog'
const GITALK_OWNER = 'InkStain258'
const GITALK_ADMIN = ['InkStain258']

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    if (!GITALK_CLIENT_ID) return

    // Clean OAuth code from URL BEFORE Gitalk captures location.href
    const url = new URL(window.location.href)
    if (url.searchParams.has('code')) {
      url.searchParams.delete('code')
      url.searchParams.delete('state')
      window.history.replaceState({}, document.title, url.toString())
    }

    containerRef.current.innerHTML = ''

    const redirectUri = 'https://ink-stain-s-blog.vercel.app' + pathname

    const gitalk = new Gitalk({
      clientID: GITALK_CLIENT_ID,
      clientSecret: GITALK_CLIENT_ID,
      repo: GITALK_REPO,
      owner: GITALK_OWNER,
      admin: GITALK_ADMIN,
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
      title: document.title,
    })

    gitalk.render(containerRef.current)

    // Fix all OAuth links to use canonical redirect URI
    setTimeout(() => {
      const links = containerRef.current?.querySelectorAll('a[href*="github.com/login/oauth"]')
      links?.forEach(a => {
        const hrefUrl = new URL(a.getAttribute('href') || '')
        hrefUrl.searchParams.set('redirect_uri', redirectUri)
        a.setAttribute('href', hrefUrl.toString())
      })
    }, 200)
  }, [pathname])

  if (!GITALK_CLIENT_ID) return null

  return (
    <div className="mt-12 w-full max-w-[800px] mx-auto px-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8" ref={containerRef} />
    </div>
  )
}
