'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Images, UserRound } from 'lucide-react'
import clsx from 'clsx'

/**
 * 手机底部导航。
 *
 * 只在 <640px 出现（`sm:hidden`）。桌面端左侧有固定导航，这里不参与。
 * 四个入口取访问频率最高的四条路径，其余（项目 / 友链 / 留言板）留在页脚与「逛逛」里。
 *
 * 安全区：iPhone 有 home indicator，底部用 env(safe-area-inset-bottom) 兜住。
 */
const ITEMS = [
	{ href: '/', label: '首页', Icon: Home, match: (p: string) => p === '/' },
	{ href: '/blog', label: '文章', Icon: BookOpen, match: (p: string) => p.startsWith('/blog') },
	{ href: '/pictures', label: '相册', Icon: Images, match: (p: string) => p.startsWith('/pictures') },
	{ href: '/about', label: '关于', Icon: UserRound, match: (p: string) => p.startsWith('/about') }
]

export default function MobileTabbar() {
	const pathname = usePathname() || '/'

	return (
		<nav
			aria-label='主导航'
			className='fixed inset-x-0 bottom-0 z-40 sm:hidden'
			style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
			<div className='glass-1 mx-3 mb-3 flex items-stretch rounded-2xl px-1.5 py-1.5 shadow-lg'>
				{ITEMS.map(({ href, label, Icon, match }) => {
					const active = match(pathname)
					return (
						<Link
							key={href}
							href={href}
							aria-current={active ? 'page' : undefined}
							className={clsx(
								'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] transition-colors',
								active ? 'text-brand-ink bg-brand/12' : 'text-secondary active:bg-white/5'
							)}>
							<Icon className='h-[18px] w-[18px]' strokeWidth={active ? 2.2 : 1.8} />
							<span>{label}</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}