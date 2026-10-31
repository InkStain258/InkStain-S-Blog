'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import 'gitalk/dist/gitalk.css'
import '@/styles/gitalk-theme.css'
import Gitalk from 'gitalk'
import { GITALK_CLIENT_ID, buildAuthorizeUrl } from '@/config/gitalk'

export default function GitalkComments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    // 从 OAuth 回调页带回来的令牌：写进 Gitalk 认的 key，再把 hash 擦掉
    const m = window.location.hash.match(/[#&]gitalk_token=([^&]+)/)
    if (m) {
      try {
        localStorage.setItem('GT_ACCESS_TOKEN', decodeURIComponent(m[1]))
      } catch {
        /* 隐私模式忽略 */
      }
      const clean = window.location.pathname + window.location.search
      window.history.replaceState(null, '', clean)
    }

    const gitalk = new Gitalk({
      clientID: GITALK_CLIENT_ID,
      repo: 'InkStain-S-Blog',
      owner: 'InkStain258',
      admin: ['InkStain258'],
      proxy: '/api/github',
      id: (pathname.replace(/\/$/, '') || '/').substring(0, 49),
      distractionFreeMode: false,
    })

    gitalk.render(containerRef.current)

    // Gitalk 默认拿 window.location.href 当 redirect_uri，而 GitHub 只认登记过的
    // 那一个回调地址 —— 换个域名登录就报 redirect_uri 不匹配。
    // 这里在捕获阶段拦下登录按钮，改走规范域名的回调，登录后再跳回当前页。
    const host = containerRef.current
    const intercept = (e: MouseEvent) => {
      const el = e.target as Element | null
      const btn = el?.closest?.('.gt-btn-login, .gt-avatar-github')
      if (!btn) return
      e.preventDefault()
      e.stopPropagation()
      const ta = host.querySelector('textarea')
      if (ta?.value) {
        try {
          localStorage.setItem('GT_COMMENT', encodeURIComponent(ta.value))
        } catch {
          /* ignore */
        }
      }
      window.location.href = buildAuthorizeUrl(window.location.href.split('#')[0])
    }
    host.addEventListener('click', intercept, true)

    return () => {
      host.removeEventListener('click', intercept, true)
      host.innerHTML = ''
    }
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
