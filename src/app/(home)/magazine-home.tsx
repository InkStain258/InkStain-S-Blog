'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import {
	ArrowRight,
	ArrowUpRight,
	BookMarked,
	Clock3,
	Clock,
	Image as ImageIcon,
	Images,
	Music,
	Shapes,
	Code2,
	Sparkles,
	Gamepad2
} from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { groupSeries } from '@/lib/series'
import { plainInline } from '@/lib/utils'
import PostList from '@/components/post-list'
import { SmartImage } from '@/components/smart-image'
import InlinePlayer from '@/components/inline-player'
import { LAB_TOOLS } from '@/lib/lab-tools'

const origin = ''

const LAB_ICONS = {
	clock: Clock,
	image: ImageIcon,
	images: Images,
	music: Music,
	shapes: Shapes,
	code: Code2,
	sparkles: Sparkles,
	gamepad: Gamepad2
} as const

/**
 * 杂志式首页。
 *
 * 排版靠字阶、留白和分隔线组织，不靠一堆等宽卡片堆叠。
 * 第一屏视线顺序：刊头 → 一句人话 → 最新一篇 → 实验室 / 音乐。
 */
export default function MagazineHome() {
	const { items, loading } = useBlogIndex()

	const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [items])
	const hero = sorted[0]
	const big = sorted[1]
	const small = sorted.slice(2, 4)
	const rest = sorted.slice(4, 14)
	const series = useMemo(() => groupSeries(items).slice(0, 4), [items])

	const tags = useMemo(() => {
		const m = new Map<string, number>()
		for (const it of items) for (const t of it.tags || []) m.set(t, (m.get(t) ?? 0) + 1)
		return [...m.entries()]
			.filter(([, n]) => n >= 2)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 12)
	}, [items])

	const fade = (delay = 0) => ({ style: { animationDelay: `${delay}s` } })

	return (
		<div className='mx-auto w-full max-w-[1460px] px-6 pt-24 pb-24 max-sm:px-4 lg:pl-[330px]'>
			<div className='max-w-[1040px]'>
				{/* 刊头 */}
				<header {...fade()} className='ink-fade-up'>
					<div className='border-border/60 flex items-center justify-between border-b pb-3'>
						<span className='text-brand-ink text-[10.5px] font-medium tracking-[0.3em] uppercase'>InkStain</span>
						<span className='text-secondary text-[10.5px] tabular-nums'>{dayjs().format('YYYY 年 M 月 D 日')}</span>
					</div>

					<h1 className='mt-6 max-w-[640px] text-[34px] leading-[1.22] font-semibold tracking-[-0.015em] max-sm:text-[26px]'>
						读书笔记，
						<br />
						和一些折腾记录。
					</h1>

					<p className='text-secondary mt-4 max-w-[520px] text-[13px] leading-[1.9]'>
						我是 InkStain，在北师大读文学。这里放课堂笔记的整理、读书时的零碎想法，还有折腾这个博客踩过的坑。写得慢，但想清楚了才发。
					</p>

					<div className='mt-6 flex flex-wrap items-center gap-3'>
						<Link
							href={hero ? `/blog/${hero.slug}` : '/blog'}
							className='bg-brand inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90'>
							读最新一篇
							<ArrowRight className='h-3.5 w-3.5' />
						</Link>
						<Link
							href='/blog'
							className='text-secondary hover:text-brand-ink border-border/70 hover:border-brand/40 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-[12.5px] transition-colors'>
							按时间翻
						</Link>
						<Link href='/series' className='text-secondary hover:text-brand-ink inline-flex items-center gap-1.5 px-1 text-[12.5px] transition-colors'>
							<BookMarked className='h-3.5 w-3.5' />
							按系列读
						</Link>
					</div>

					<div className='text-secondary mt-5 flex items-center gap-3 text-[10.5px]'>
						<span>{items.length} 篇</span>
						<span className='opacity-30'>/</span>
						<span>{series.length} 个系列</span>
						<span className='opacity-30'>/</span>
						<span className='flex items-center gap-1'>
							<Clock3 className='h-3 w-3' />
							{hero ? `${dayjs(hero.date).format('M 月 D 日')}更新` : '—'}
						</span>
					</div>
				</header>

				{/* 头条 + 实验室 */}
				<div className='mt-12 grid gap-8 lg:grid-cols-[1.32fr_1fr]'>
					{hero && (
						<Link href={`/blog/${hero.slug}`} {...fade(0.05)} className='ink-fade-up group block'>
							<div className='glass-1 glass-gloss relative aspect-[16/10] overflow-hidden rounded-xl'>
								{hero.cover ? (
									<SmartImage
										src={hero.cover.startsWith('http') ? hero.cover : `${origin}${hero.cover}`}
										slug={hero.slug}
										alt={hero.title}
										priority
										sizes='(max-width: 1024px) 100vw, 640px'
										className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]'
									/>
								) : (
									<div className='from-brand/15 to-brand-secondary/15 h-full w-full bg-gradient-to-br' />
								)}
							</div>
							<div className='mt-4 flex items-center gap-2.5 text-[10.5px]'>
								{hero.category && <span className='text-brand-ink tracking-wider'>{hero.category}</span>}
								<span className='text-secondary'>{dayjs(hero.date).format('YYYY-MM-DD')}</span>
							</div>
							<h2 className='group-hover:text-brand-ink mt-2 text-[19px] leading-[1.45] font-semibold tracking-[-0.01em] transition-colors max-sm:text-[17px]'>
								{hero.title}
							</h2>
							<p className='text-secondary mt-2 line-clamp-2 text-[12.5px] leading-[1.8]'>{plainInline(hero.summary)}</p>
						</Link>
					)}

					<aside {...fade(0.12)} className='ink-fade-up'>
						<div className='mb-3 flex items-baseline justify-between'>
							<h2 className='text-[13px] font-semibold tracking-wide'>实验室</h2>
							<Link href='/lab' className='text-secondary hover:text-brand-ink text-[11px] transition-colors'>
								全部 →
							</Link>
						</div>
						<p className='text-secondary mb-3 text-[11px] leading-relaxed'>顺手做的小工具，平时自己也在用。</p>

						<div className='grid grid-cols-2 gap-2'>
							{LAB_TOOLS.map(t => {
								const Icon = LAB_ICONS[t.icon]
								return (
									<Link
										key={t.href}
										href={t.href}
										className='group glass-1 hover:border-brand/40 flex items-center gap-2 rounded-xl px-2.5 py-2.5 transition-colors'>
										<span className='bg-brand/10 text-brand-ink grid h-7 w-7 shrink-0 place-items-center rounded-lg'>
											<Icon className='h-3.5 w-3.5' />
										</span>
										<span className='min-w-0 flex-1 truncate text-[11.5px]'>{t.title}</span>
										<ArrowUpRight className='text-secondary h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60' />
									</Link>
								)
							})}
						</div>

						<div className='mt-5'>
							<div className='mb-2 flex items-baseline justify-between'>
								<h2 className='text-[13px] font-semibold tracking-wide'>边写边听</h2>
								<Link href='/music' className='text-secondary hover:text-brand-ink text-[11px] transition-colors'>
									Music →
								</Link>
							</div>
							<InlinePlayer />
						</div>
					</aside>
				</div>

				{/* 最近写的 */}
				{big && (
					<section className='mt-16'>
						<div className='border-border/60 mb-5 flex items-baseline justify-between border-b pb-2.5'>
							<h2 className='text-[14px] font-semibold tracking-wide'>最近写的</h2>
							<Link href='/blog' className='text-secondary hover:text-brand-ink text-[11px] transition-colors'>
								全部文章 →
							</Link>
						</div>

						<div className='grid gap-8 lg:grid-cols-[1.35fr_1fr]'>
							<Link href={`/blog/${big.slug}`} {...fade(0.05)} className='ink-fade-up group grid gap-4 sm:grid-cols-[0.85fr_1fr]'>
								<div className='glass-1 overflow-hidden rounded-xl'>
									<div className='aspect-[4/3] sm:aspect-[3/4]'>
										{big.cover ? (
											<SmartImage
												src={big.cover.startsWith('http') ? big.cover : `${origin}${big.cover}`}
												slug={big.slug}
												alt={big.title}
												sizes='(max-width: 640px) 92vw, 240px'
												className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]'
											/>
										) : (
											<div className='from-brand/12 to-brand-secondary/12 h-full w-full bg-gradient-to-br' />
										)}
									</div>
								</div>
								<div className='flex flex-col'>
									<div className='flex items-center gap-2 text-[10.5px]'>
										{big.category && <span className='text-brand-ink tracking-wider'>{big.category}</span>}
										<span className='text-secondary'>{dayjs(big.date).format('YYYY-MM-DD')}</span>
									</div>
									<h3 className='group-hover:text-brand-ink mt-2 text-[16px] leading-[1.5] font-medium transition-colors'>{big.title}</h3>
									<p className='text-secondary mt-2 line-clamp-4 text-[12px] leading-[1.85]'>{plainInline(big.summary)}</p>
									<span className='text-brand-ink mt-auto inline-flex items-center gap-1 pt-3 text-[11px] opacity-0 transition-opacity group-hover:opacity-100'>
										继续读 <ArrowRight className='h-3 w-3' />
									</span>
								</div>
							</Link>

							<div className='divide-border/60 divide-y'>
								{small.map((it, i) => (
									<Link key={it.slug} href={`/blog/${it.slug}`} {...fade(0.1 + i * 0.05)} className='ink-fade-up group block py-4 first:pt-0'>
										<div className='text-secondary flex items-center gap-2 text-[10.5px]'>
											<span>{dayjs(it.date).format('YYYY-MM-DD')}</span>
											{it.category && <span className='text-brand-ink opacity-90'>{it.category}</span>}
										</div>
										<h3 className='group-hover:text-brand-ink mt-1.5 text-[14px] leading-[1.55] font-medium transition-colors'>{it.title}</h3>
										<p className='text-secondary mt-1 line-clamp-2 text-[11.5px] leading-[1.8]'>{plainInline(it.summary)}</p>
									</Link>
								))}
							</div>
						</div>
					</section>
				)}

				{/* 系列 / 再往前 */}
				<div className='mt-16 grid gap-9 lg:grid-cols-[0.82fr_1.18fr]'>
					{series.length > 0 && (
						<section>
							<div className='border-border/60 mb-4 flex items-baseline justify-between border-b pb-2.5'>
								<h2 className='text-[14px] font-semibold tracking-wide'>系列</h2>
								<Link href='/series' className='text-secondary hover:text-brand-ink text-[11px] transition-colors'>
									全部 →
								</Link>
							</div>
							<div>
								{series.map(g => (
									<Link
										key={g.slug}
										href={`/series/${encodeURIComponent(g.slug)}`}
										className='group flex items-center justify-between gap-3 border-b border-transparent py-2.5 transition-colors'>
										<span className='min-w-0'>
											<span className='group-hover:text-brand-ink block truncate text-[12.5px] font-medium transition-colors'>{g.name}</span>
											<span className='text-secondary mt-0.5 block text-[10.5px]'>
												{g.items.length} 篇 · 最近 {dayjs(g.items[g.items.length - 1].date).format('M 月 D 日')}
											</span>
										</span>
										<ArrowRight className='text-secondary h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-50' />
									</Link>
								))}
							</div>
						</section>
					)}

					<section>
						<div className='border-border/60 mb-4 flex items-baseline justify-between border-b pb-2.5'>
							<h2 className='text-[14px] font-semibold tracking-wide'>再往前</h2>
							<Link href='/archive' className='text-secondary hover:text-brand-ink text-[11px] transition-colors'>
								归档 →
							</Link>
						</div>
						<PostList items={rest} dense showTags={false} empty={loading ? '加载中…' : '还没有文章'} />
					</section>
				</div>

				{/* 标签 */}
				{tags.length > 0 && (
					<section className='mt-14'>
						<div className='border-border/60 mb-4 border-b pb-2.5'>
							<h2 className='text-[14px] font-semibold tracking-wide'>常写的话题</h2>
						</div>
						<div className='flex flex-wrap gap-1.5'>
							{tags.map(([t, n]) => (
								<Link
									key={t}
									href={`/blog/tag/${encodeURIComponent(t)}`}
									className='text-secondary hover:border-brand/40 hover:text-brand-ink border-border/50 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors'>
									{t}
									<span className='ml-1'>{n}</span>
								</Link>
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	)
}
