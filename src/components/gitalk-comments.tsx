'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

const GITALK_CLIENT_ID = process.env.NEXT_PUBLIC_GITALK_CLIENT_ID || 'Ov23lixBE1JBA4I67AMe'
const CANONICAL_REDIRECT = 'https://ink-stain-s-blog.vercel.app/'

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    if (!GITALK_CLIENT_ID) return

    containerRef.current.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: GITALK_CLIENT_ID,
      clientSecret: GITALK_CLIENT_ID,
      repo: 'InkStain-S-Blog',
      owner: 'InkStain258',
      admin: ['InkStain258'],
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
      title: document.title,
    })

    gitalk.render(containerRef.current)

    // Override ALL OAuth links to use the exact canonical redirect URI
    setTimeout(() => {
      const links = containerRef.current?.querySelectorAll(
        'a[href*="github.com/login/oauth/authorize"]'
      )
      links?.forEach(a => {
        const url = new URL(a.getAttribute('href') || '')
        url.searchParams.set('redirect_uri', CANONICAL_REDIRECT)
        a.setAttribute('href', url.toString())
      })
    }, 100)

    // Clean code/state from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('code')) {
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, document.title, url.toString())
      }
    }
  }, [pathname])

  if (!GITALK_CLIENT_ID) return null

  return (
    <div className="mt-12 w-full max-w-[800px] mx-auto px-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8" ref={containerRef} />
    </div>
  )
}
