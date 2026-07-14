'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: 'Ov23lixBE1JBA4I67AMe',
      clientSecret: '59c9013436b6f405749760cb85b8168201ec4f4d',
      repo: 'InkStain-S-Blog',
      owner: 'InkStain258',
      admin: ['InkStain258'],
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
    })

    gitalk.render(containerRef.current)
  }, [pathname])

  return (
    <div className="mt-12 w-full max-w-[800px] mx-auto px-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8" ref={containerRef} />
    </div>
  )
}
