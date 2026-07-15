'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

const CLIENT_ID = 'Ov23lixBE1JBA4I67AMe'
const CALLBACK_URL = 'https://ink-stain-s-blog.vercel.app/api/github/callback'

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_ID,
      repo: 'InkStain-S-Blog',
      owner: 'InkStain258',
      admin: ['InkStain258'],
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
      title: document.title,
    })

    gitalk.render(containerRef.current)

    // Override OAuth links: use Vercel callback + pass return URL as state
    const fixLinks = () => {
      const links = containerRef.current?.querySelectorAll(
        'a[href*="github.com/login/oauth/authorize"]'
      )
      const returnUrl = window.location.href.replace(/\?.*$/, '').replace(/#.*$/, '')
      links?.forEach(a => {
        const u = new URL(a.getAttribute('href') || '')
        u.searchParams.set('redirect_uri', CALLBACK_URL)
        u.searchParams.set('state', returnUrl)
        a.setAttribute('href', u.toString())
      })
    }
    setTimeout(fixLinks, 50)
    setTimeout(fixLinks, 500)
  }, [pathname])

  // Handle token passed back via URL hash
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/gitalk_token=([^&]+)/)
    if (match && containerRef.current) {
      const token = match[1]
      // Clean URL
      window.location.hash = ''
      // Re-render Gitalk with the token injected
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          const gitalk = new Gitalk({
            clientID: CLIENT_ID,
            clientSecret: CLIENT_ID,
            repo: 'InkStain-S-Blog',
            owner: 'InkStain258',
            admin: ['InkStain258'],
            proxy: '/api/github',
            id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
            distractionFreeMode: false,
            title: document.title,
          })
          // @ts-ignore: inject token before render
          gitalk.accessToken = token
          gitalk.render(containerRef.current)
        }
      }, 200)
    }
  }, [])

  return (
    <div className="mt-12 w-full max-w-[800px] mx-auto px-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8" ref={containerRef} />
    </div>
  )
}
