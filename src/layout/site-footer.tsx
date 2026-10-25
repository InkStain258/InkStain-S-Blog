'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { useConfigStore } from '@/app/(home)/stores/config-store'

/** 本地一言池：古典文论 + 技术格言，不依赖外部 API */
const QUOTES: { text: string; from: string }[] = [
	{ text: '操千曲而后晓声，观千剑而后识器。', from: '文心雕龙 · 知音' },
	{ text: '登山则情满于山，观海则意溢于海。', from: '文心雕龙 · 神思' },
	{ text: '寂然凝虑，思接千载；悄焉动容，视通万里。', from: '文心雕龙 · 神思' },
	{ text: '夫缀文者情动而辞发，观文者披文以入情。', from: '文心雕龙 · 知音' },
	{ text: '文变染乎世情，兴废系乎时序。', from: '文心雕龙 · 时序' },
	{ text: '积学以储宝，酌理以富才。', from: '文心雕龙 · 神思' },
	{ text: '简言以达旨，博文以该情。', from: '文心雕龙 · 征圣' },
	{ text: '任何足够先进的技术都与魔法无异。', from: 'Arthur C. Clarke' },
	{ text: '简单是可靠的前提。', from: 'Edsger W. Dijkstra' },
	{ text: '过早的优化是万恶之源。', from: 'Donald Knuth' },
	{ text: '程序是写给人读的，只是顺带能在机器上跑。', from: 'Harold Abelson' },
	{ text: '我们塑造工具，然后工具塑造我们。', from: 'Marshall McLuhan' }
]

const NAV_LINKS = [
	{ href: '/', label: '首页' },
	{ href: '/blog', label: '博客' },
	{ href: '/projects', label: '项目' },
	{ href: '/share', label: '友链' },
	{ href: '/guestbook', label: '留言板' },
	{ href: '/pictures', label: '图集' },
	{ href: '/about', label: '关于' }
]

const TECH = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vercel', 'Cloudflare']

export default function SiteFooter() {
	const pathname = usePathname()
	const { siteContent } = useConfigStore()
	const [qi, setQi] = useState(0)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setQi(Math.floor(Math.random() * QUOTES.length))
		setMounted(true)
	}, [])

	// 首页是拖拽卡片画布，不放页脚
	if (pathname === '/') return null

	const name = siteContent?.meta?.username || 'InkStain'
	const description = siteContent?.meta?.description || ''
	const socials = (siteContent?.socialButtons ?? []) as Array<{ id: string; type: string; value: string; label: string }>
	const beian = siteContent?.beian as { text?: string; link?: string } | undefined
	const quote = QUOTES[qi % QUOTES.length]
	const year = new Date().getFullYear()

	return (
		<motion.footer
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.5, ease: 'easeOut' }}
			className='relative z-10 mx-auto mt-20 w-full max-w-[1140px] px-6 pb-12 max-sm:px-4'>
			<div className='bg-card overflow-hidden rounded-[32px] border backdrop-blur-md'>
				{/* 顶部渐变装饰线 */}
				<div className='h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent opacity-60' />

				<div className='grid gap-10 p-8 sm:grid-cols-2 lg:grid-cols-4 max-sm:p-6'>
					{/* 品牌区 */}
					<div className='lg:col-span-2'>
						<div className='flex items-center gap-3'>
							<Image src='/images/avatar.png' alt={name} width={48} height={48} className='ring-brand/30 h-12 w-12 rounded-full object-cover ring-2' />
							<div>
								<div className='text-base font-semibold'>{name}</div>
								<div className='text-secondary text-xs'>技术杂谈 · AGI / ACG / 文学文艺</div>
							</div>
						</div>
						<p className='text-secondary mt-4 max-w-md text-sm leading-relaxed'>{description}</p>

						{/* 一言 */}
						<button
							type='button'
							onClick={() => setQi(i => (i + 1) % QUOTES.length)}
							title='换一句'
							className='group border-brand/20 bg-brand/5 hover:bg-brand/10 mt-5 w-full max-w-md rounded-2xl border p-4 text-left transition-colors'>
							<div className='text-sm leading-relaxed'>
								<span className='text-brand mr-1'>「</span>
								{mounted ? quote.text : QUOTES[0].text}
								<span className='text-brand ml-1'>」</span>
							</div>
							<div className='text-secondary mt-2 flex items-center justify-between text-[11px]'>
								<span>— {mounted ? quote.from : QUOTES[0].from}</span>
								<span className='opacity-0 transition-opacity group-hover:opacity-100'>换一句 ↻</span>
							</div>
						</button>
					</div>

					{/* 导航 */}
					<div>
						<div className='mb-4 text-xs font-semibold tracking-wider uppercase opacity-50'>导航</div>
						<ul className='space-y-2.5'>
							{NAV_LINKS.map(l => (
								<li key={l.href}>
									<Link href={l.href} className='text-secondary hover:text-brand text-sm transition-colors'>
										{l.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* 连接 */}
					<div>
						<div className='mb-4 text-xs font-semibold tracking-wider uppercase opacity-50'>连接</div>
						<ul className='space-y-2.5'>
							{socials.map(s => (
								<li key={s.id}>
									<a
										href={s.type === 'email' ? `mailto:${s.value}` : s.value}
										target={s.type === 'email' ? undefined : '_blank'}
										rel='noreferrer'
										className='text-secondary hover:text-brand text-sm transition-colors'>
										{s.label || (s.type === 'email' ? '邮箱' : s.type)}
									</a>
								</li>
							))}
							<li>
								<a href='/rss.xml' className='text-secondary hover:text-brand text-sm transition-colors'>
									RSS 订阅
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* 技术栈 */}
				<div className='flex flex-wrap gap-2 px-8 pb-6 max-sm:px-6'>
					{TECH.map(t => (
						<span key={t} className='border-brand/15 bg-brand/5 text-secondary rounded-full border px-3 py-1 text-[11px]'>
							{t}
						</span>
					))}
				</div>

				{/* 版权栏 */}
				<div className='border-t px-8 py-5 max-sm:px-6'>
					<div className='text-secondary flex flex-col items-center justify-between gap-2 text-xs sm:flex-row'>
						<div>
							© {year} {name} · 保留所有权利
						</div>
						<div className='flex items-center gap-3'>
							<span>Powered by Next.js</span>
							{beian?.text ? (
								beian.link ? (
									<a href={beian.link} target='_blank' rel='noreferrer' className='hover:text-brand transition-colors'>
										{beian.text}
									</a>
								) : (
									<span>{beian.text}</span>
								)
							) : null}
						</div>
					</div>
				</div>
			</div>
		</motion.footer>
	)
}
