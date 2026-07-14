'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

// Gitalk 配置（通过环境变量注入，有合理默认值）
const GITALK_CONFIG = {
  clientID: process.env.NEXT_PUBLIC_GITALK_CLIENT_ID || '',
  clientSecret: process.env.NEXT_PUBLIC_GITALK_CLIENT_SECRET || '',
  repo: process.env.NEXT_PUBLIC_GITALK_REPO || 'InkStain-S-Blog',
  owner: process.env.NEXT_PUBLIC_GITALK_OWNER || 'InkStain258',
  admin: (process.env.NEXT_PUBLIC_GITALK_ADMIN || 'InkStain258').split(','),
}

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    if (!GITALK_CONFIG.clientID) return // 未配置 OAuth App 时不渲染

    containerRef.current.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: GITALK_CONFIG.clientID,
      clientSecret: GITALK_CONFIG.clientSecret,
      repo: GITALK_CONFIG.repo,
      owner: GITALK_CONFIG.owner,
      admin: GITALK_CONFIG.admin,
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
      title: `Comments: ${document.title}`,
    })

    gitalk.render(containerRef.current)

    const url = new URL(window.location.href)
    if (url.searchParams.has('code')) {
      url.searchParams.delete('code')
      window.history.replaceState({}, document.title, url.toString())
    }
  }, [pathname])

  if (!GITALK_CONFIG.clientID) return null

  return (
    <div className="mt-12 w-full max-w-[800px] mx-auto px-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8" ref={containerRef} />
    </div>
  )
}
