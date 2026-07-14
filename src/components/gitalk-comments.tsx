'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

const GITALK_CLIENT_ID = process.env.NEXT_PUBLIC_GITALK_CLIENT_ID || 'Ov23lixBE1JBA4I67AMe'
const GITALK_REPO = process.env.NEXT_PUBLIC_GITALK_REPO || 'InkStain-S-Blog'
const GITALK_OWNER = process.env.NEXT_PUBLIC_GITALK_OWNER || 'InkStain258'
const GITALK_ADMIN = (process.env.NEXT_PUBLIC_GITALK_ADMIN || 'InkStain258').split(',')

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    if (!GITALK_CLIENT_ID) return

    containerRef.current.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: GITALK_CLIENT_ID,
      clientSecret: GITALK_CLIENT_ID, // 客户端不需要 secret，由服务端 /api/github 代理处理
      repo: GITALK_REPO,
      owner: GITALK_OWNER,
      admin: GITALK_ADMIN,
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
      title: typeof document !== 'undefined' ? document.title : '',
    })

    gitalk.render(containerRef.current)

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('code')) {
        url.searchParams.delete('code')
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
