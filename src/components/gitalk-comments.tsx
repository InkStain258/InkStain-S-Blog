'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import 'gitalk/dist/gitalk.css'
import '@/styles/gitalk-theme.css'
import Gitalk from 'gitalk'

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    new Gitalk({
      clientID: 'Ov23lixBE1JBA4I67AMe',
      clientSecret: '59c9013436b6f405749760cb85b8168201ec4f4d',
      repo: 'InkStain-S-Blog',
      owner: 'InkStain258',
      admin: ['InkStain258'],
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
    }).render(containerRef.current)
  }, [pathname])

  return (
    <section className="mt-14 w-full max-w-[860px] mx-auto px-4 pb-2 max-sm:px-3">
      <div className="bg-card relative overflow-hidden rounded-[28px] border p-6 backdrop-blur-md shadow-[0_20px_50px_-40px_rgba(0,0,0,0.35)] sm:p-8 max-sm:p-5">
        {/* 顶部渐变装饰线 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent opacity-60" />

        <header className="mb-6 flex items-center gap-3">
          <span className="bg-brand/10 text-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl">
            <MessageCircle className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] leading-tight font-semibold">评论</h2>
            <p className="text-secondary mt-0.5 text-[11px]">使用 GitHub 账号登录后参与讨论</p>
          </div>
        </header>

        <div ref={containerRef} className="gitalk-host" />
      </div>
    </section>
  )
}
