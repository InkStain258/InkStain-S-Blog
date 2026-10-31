'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ArrowRight, BookMarked, Clock3 } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { groupSeries } from '@/lib/series'
import PostList from '@/components/post-list'

const origin = ''

/**
 * 杂志式首页：与卡片拼贴互斥，由「站点设置 → 首页外观」切换。
 * 排版是文档流，不做绝对定位，所以移动端天然自适应。
 */
export default function MagazineHome() {
	const { items, loading } = useBlogIndex()
	const { siteContent, cardStyles } = useConfigStore()
	const { meta } = siteContent

	const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [items])
	const featured = sorted.slice(0, 3)
	const rest = sorted.slice(3, 15)
	const series = useMemo(() => groupSeries(items).slice(0, 4), [items])
	const hero = sorted[0]

	const tags = useMemo(() => {
		const m = new Map<string, number>()
		for (const it of items) for (const t of it.tags || []) m.set(t, (m.get(t) ?? 0) + 1)
		return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)
	}, [items])

	const fade = (delay = 0) => ({
		initial: { opacity: 0, y: 14 },
		animate: { opacity: 1, y: 0 },
		transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
	})

	return (
		<div className='mx-auto w-full max-w-[1460px] px-6 pt-28 pb-24 max-sm:px-4 lg:pl-[330px]'>
			<div className='max-w-[980px]'>
			{/* 主视觉 */}
			<motion.section {...fade()} className='grid items-center gap-9 md:grid-cols-[1.08fr_0.92fr]'>
				<div>
					<div className='text-secondary text-[10.5px] tracking-[0.32em] uppercase opacity-60'>InkStain · 技术杂谈</div>
					<h1 className='mt-3.5 text-[34px] leading-[1.24] font-semibold tracking-tight max-sm:text-[27px]'>
						在代码里找诗，
						<br />
						也把诗写成代码。
					</h1>
					<p className='text-secondary mt-3.5 max-w-[452px] text-[12.5px] leading-relaxed opacity-80'>{meta.description}</p>

					<div className='mt-6 flex flex-wrap items-center gap-2.5'>
						<Link
							href={hero ? `/blog/${hero.slug}` : '/blog'}
							className='bg-brand inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90'>
							读最新一篇
							<ArrowRight className='h-3.5 w-3.5' />
						</Link>
						<Link
							href='/series'
							className='text-secondary hover:text-brand border-border/70 hover:border-brand/40 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-[12.5px] transition-colors'>
							<BookMarked className='h-3.5 w-3.5' />
							按系列读
						</Link>
					</div>

					<div className='text-secondary mt-5 flex items-center gap-3.5 text-[10.5px] opacity-70'>
						<span>{items.length} 篇文章</span>
						<span className='opacity-30'>·</span>
						<span>{series.length} 个系列</span>
						<span className='opacity-30'>·</span>
						<span className='flex items-center gap-1'>
							<Clock3 className='h-3 w-3' />
							{hero ? `最近更新 ${dayjs(hero.date).format('M月D日')}` : '—'}
						</span>
					</div>
				</div>

				{hero && (
					<Link href={`/blog/${hero.slug}`} className='group relative block'>
						<div className='border-border/60 bg-card relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-sm'>
							{hero.cover ? (
								<img
									src={hero.cover.startsWith('http') ? hero.cover : `${origin}${hero.cover}`}
									alt={hero.title}
									className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]'
								/>
							) : (
								<div className='from-brand/15 to-brand-secondary/15 h-full w-full bg-gradient-to-br' />
							)}
							<div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5'>
								<div className='text-[10.5px] text-white/70'>{dayjs(hero.date).format('YYYY-MM-DD')}</div>
								<div className='mt-1 line-clamp-2 text-[14px] leading-snug font-medium text-white'>{hero.title}</div>
							</div>
						</div>
					</Link>
				)}
			</motion.section>

			{/* 精选 */}
			{featured.length > 0 && (
				<section className='mt-14'>
					<div className='mb-4 flex items-baseline justify-between'>
						<h2 className='text-[15px] font-semibold tracking-wide'>最近写的</h2>
						<Link href='/blog' className='text-secondary hover:text-brand text-[11.5px] transition-colors'>
							全部文章 →
						</Link>
					</div>
					<div className='grid gap-3.5 md:grid-cols-3'>
						{featured.map((it, i) => (
							<motion.div key={it.slug} {...fade(0.08 + i * 0.06)}>
								<Link href={`/blog/${it.slug}`} className='bg-card relative flex h-full w-full flex-col overflow-hidden rounded-2xl border transition-colors hover:border-brand/35'>
									<div className='bg-border/30 aspect-[3/2] overflow-hidden'>
										{it.cover ? (
											<img
												src={it.cover.startsWith('http') ? it.cover : `${origin}${it.cover}`}
												alt={it.title}
												className='h-full w-full object-cover transition-transform duration-700 hover:scale-[1.05]'
											/>
										) : (
											<div className='from-brand/12 to-brand-secondary/12 h-full w-full bg-gradient-to-br' />
										)}
									</div>
									<div className='flex flex-1 flex-col p-3.5'>
										{it.category && <div className='text-brand text-[10px] tracking-wider opacity-80'>{it.category}</div>}
										<div className='mt-1.5 line-clamp-2 text-[13px] leading-snug font-medium'>{it.title}</div>
										<div className='text-secondary mt-1.5 line-clamp-1 text-[11px] opacity-65'>{it.summary}</div>
										<div className='text-secondary mt-auto pt-2 text-[10px] opacity-45'>{dayjs(it.date).format('YYYY-MM-DD')}</div>
									</div>
								</Link>
							</motion.div>
						))}
					</div>
				</section>
			)}

			{/* 系列 + 最近更新 */}
			<div className='mt-14 grid gap-8 lg:grid-cols-[0.86fr_1.14fr]'>
				{series.length > 0 && (
					<section>
						<div className='mb-4 flex items-baseline justify-between'>
							<h2 className='text-[15px] font-semibold tracking-wide'>系列</h2>
							<Link href='/series' className='text-secondary hover:text-brand text-[11.5px] transition-colors'>
								全部 →
							</Link>
						</div>
						<div className='space-y-2'>
							{series.map(g => (
								<Link
									key={g.slug}
									href={`/series/${encodeURIComponent(g.slug)}`}
									className='group bg-card/60 border-border/60 hover:border-brand/35 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors'>
									<span className='min-w-0'>
										<span className='group-hover:text-brand block truncate text-[13px] font-medium transition-colors'>{g.name}</span>
										<span className='text-secondary mt-0.5 block truncate text-[10.5px] whitespace-nowrap opacity-60'>
											{g.items.length} 篇 · 最近 {dayjs(g.items[g.items.length - 1].date).format('M月D日')}
										</span>
									</span>
									<ArrowRight className='text-secondary h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60' />
								</Link>
							))}
						</div>
					</section>
				)}

				<section>
					<div className='mb-4 flex items-baseline justify-between'>
						<h2 className='text-[15px] font-semibold tracking-wide'>再往前</h2>
						<Link href='/archive' className='text-secondary hover:text-brand text-[11.5px] transition-colors'>
							归档 →
						</Link>
					</div>
					<div className='card relative w-full px-4 py-1.5'>
						<PostList items={rest} dense showTags={false} empty={loading ? '加载中…' : '还没有文章'} />
					</div>
				</section>
			</div>

			{/* 标签 */}
			{tags.length > 0 && (
				<section className='mt-14'>
					<h2 className='mb-4 text-[15px] font-semibold tracking-wide'>标签</h2>
					<div className='flex flex-wrap gap-2'>
						{tags.map(([t, n]) => (
							<Link
								key={t}
								href={`/blog/tag/${encodeURIComponent(t)}`}
								className='text-secondary hover:border-brand/40 hover:text-brand border-border/60 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors'>
								#{t}
								<span className='ml-1 opacity-50'>{n}</span>
							</Link>
						))}
					</div>
				</section>
			)}
			</div>
		</div>
	)
}
