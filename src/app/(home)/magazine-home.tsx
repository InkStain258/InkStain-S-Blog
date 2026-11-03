'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { ChevronRight, BookMarked, Clock3, PenLine } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { groupSeries } from '@/lib/series'
import { plainInline } from '@/lib/utils'
import PostList from '@/components/post-list'
import { SmartImage } from '@/components/smart-image'
import InlinePlayer from '@/components/inline-player'
import MonthCalendar from '@/components/month-calendar'

const origin = ''

/**
 * 杂志式首页。
 *
 * 排版靠字阶、留白和分隔线组织，不靠一堆等宽卡片堆叠。
 * 第一屏视线顺序：刊头 → 一句人话 → 最新一篇 → 实验室 / 音乐。
 */
export default function MagazineHome() {
	const { items, loading } = useBlogIndex()
	const router = useRouter()
	const goToDay = (day: string) => {
		const hit = items.find(it => dayjs(it.date).format('YYYY-MM-DD') === day)
		if (hit) router.push(`/blog/${hit.slug}`)
	}

	const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [items])
	const hero = sorted[0]
	// 主区头条下方补一条「接下来」的横卡带，把右栏的高度填平
	const quick = sorted.slice(1, 5)
	const big = sorted[5]
	const small = sorted.slice(6, 8)
	const rest = sorted.slice(8, 18)
	// 系列按一级大类归拢，首页直接展示「大类 → 子系列」两层
	const seriesGroups = useMemo(() => {
		const map = new Map<string, ReturnType<typeof groupSeries>>()
		for (const g of groupSeries(items)) {
			const root = g.categoryPath?.[0] || '未归类'
			map.set(root, [...(map.get(root) ?? []), g])
		}
		return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
	}, [items])
	const seriesCount = useMemo(() => seriesGroups.reduce((n, [, list]) => n + list.length, 0), [seriesGroups])

	const tags = useMemo(() => {
		const m = new Map<string, number>()
		for (const it of items) for (const t of it.tags || []) m.set(t, (m.get(t) ?? 0) + 1)
		// 只保留出现 ≥2 次的话只剩两个标签，底部会空成一条线；
		// 全量按频次排，重复的话题自然排在前面。
		return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
	}, [items])

	// 统计面板：标签总数、分类数、最近 12 个月的写作节奏
	const tagTotal = useMemo(() => {
		const set = new Set<string>()
		for (const it of items) for (const t of it.tags || []) set.add(t)
		return set.size
	}, [items])

	const categoryCount = useMemo(() => {
		const set = new Set<string>()
		for (const it of items) {
			const leaf = it.categoryPath?.length ? it.categoryPath[it.categoryPath.length - 1] : it.category
			if (leaf) set.add(leaf)
		}
		return set.size
	}, [items])

	const { monthly, monthMax, latestLabel } = useMemo(() => {
		const buckets: { key: string; label: string; n: number }[] = []
		const now = dayjs()
		for (let i = 11; i >= 0; i--) {
			const d = now.subtract(i, 'month')
			buckets.push({ key: d.format('YYYY-MM'), label: d.format('M 月'), n: 0 })
		}
		const index = new Map(buckets.map((b, i) => [b.key, i]))
		for (const it of items) {
			const k = dayjs(it.date).format('YYYY-MM')
			const i = index.get(k)
			if (i !== undefined) buckets[i].n += 1
		}
		const latest = items.reduce((acc, it) => (it.date > acc ? it.date : acc), '')
		return {
			monthly: buckets,
			monthMax: Math.max(1, ...buckets.map(b => b.n)),
			latestLabel: latest ? dayjs(latest).format('M 月 D 日') : '—'
		}
	}, [items])

	const fade = (delay = 0) => ({ style: { animationDelay: `${delay}s` } })

	return (
		<>
		<div className='relative z-10 mx-auto w-full max-w-[1460px] px-6 pt-24 pb-24 max-sm:px-4 max-sm:pt-24 lg:pl-[330px]'>
			<div className='max-w-[1040px]'>
				{/* 刊头 */}
				<header {...fade()} className='ink-fade-up'>
					<div className='border-border/60 flex items-center justify-between border-b pb-3'>
						<span className='text-brand-ink text-[10.5px] font-medium tracking-[0.3em] uppercase'>InkStain</span>
						<span className='text-secondary text-[10.5px] tabular-nums max-sm:text-[11px]'>{dayjs().format('YYYY 年 M 月 D 日')}</span>
					</div>

					<h1 className='mt-7 text-[40px] leading-[1.34] tracking-[0.14em] max-sm:text-[31px] max-sm:tracking-[0.1em]'>
						赋术予文
						<br />
						泼墨为痕
					</h1>
					<div aria-hidden className='from-brand/80 via-brand/35 to-brand/0 mt-5 h-px w-28 bg-gradient-to-r max-sm:w-20' />

					<p className='text-secondary mt-5 max-w-[560px] text-[14px] leading-[2] max-sm:text-[13.5px] max-sm:leading-[1.95]'>
						原想着给未来脑腐的自己留下一片清醒的慰藉，实际上只是一个可怜虫找的一片栖身之所罢。
					</p>

					<div className='mt-6 flex flex-wrap items-center gap-3'>
						<Link
							href={hero ? `/blog/${hero.slug}` : '/blog'}
							className='bg-brand inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90'>
							读最新一篇
							<ChevronRight className='h-3.5 w-3.5' />
						</Link>
						<Link
							href='/blog'
							className='glass-1 text-secondary hover:text-brand-ink hover:border-brand/40 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] transition-colors'>
							按时间翻
						</Link>
						<Link href='/series' className='text-secondary hover:text-brand-ink inline-flex items-center gap-1.5 px-1 text-[12.5px] transition-colors'>
							<BookMarked className='h-3.5 w-3.5' />
							按系列读
						</Link>
						<Link
							href='/write'
							className='glass-1 text-brand-ink hover:border-brand/40 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] transition-colors'>
							<PenLine className='h-3.5 w-3.5' />
							写文章
						</Link>
					</div>

					<div className='text-secondary mt-5 flex items-center gap-3 text-[10.5px]'>
						<span>{items.length} 篇</span>
						<span className='opacity-30'>/</span>
						<span>{seriesCount} 个系列</span>
						<span className='opacity-30'>/</span>
						<span className='flex items-center gap-1'>
							<Clock3 className='h-3 w-3' />
							{hero ? `${dayjs(hero.date).format('M 月 D 日')}更新` : '—'}
						</span>
					</div>
				</header>

				{/* 头条 + 右栏 */}
				<div className='mt-14 grid items-start gap-8 max-sm:mt-10 lg:grid-cols-[minmax(0,1fr)_380px]'>
					<div className='min-w-0'>
					{hero && (
						<Link href={`/blog/${hero.slug}`} {...fade(0.05)} className='ink-fade-up group block'>
							<div className='glass-1 glass-gloss relative aspect-[16/10] overflow-hidden rounded-xl max-sm:aspect-[4/3]'>
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
							<div className='glass-2 mt-3 rounded-xl px-4 py-4'>
								<div className='flex items-center gap-2.5 text-[10.5px]'>
									{hero.category && <span className='text-brand-ink tracking-wider'>{hero.category}</span>}
									<span className='text-secondary'>{dayjs(hero.date).format('YYYY-MM-DD')}</span>
								</div>
								<h2 className='group-hover:text-brand-ink mt-2 text-[19px] leading-[1.45] font-semibold tracking-[-0.01em] transition-colors max-sm:text-[18px]'>
									{hero.title}
								</h2>
								<p className='text-secondary mt-2 line-clamp-2 text-[12.5px] leading-[1.8] max-sm:text-[13px]'>{plainInline(hero.summary)}</p>
							</div>
						</Link>
					)}

					<div className='mt-3 space-y-2'>
						{quick.map((it, i) => (
							<Link
								key={it.slug}
								href={`/blog/${it.slug}`}
								{...fade(0.08 + i * 0.03)}
								className='ink-fade-up group glass-1 hover:border-brand/40 flex items-center gap-3 rounded-xl p-2.5 transition-colors'>
								<div className='h-16 w-16 shrink-0 overflow-hidden rounded-lg'>
									{it.cover ? (
										<SmartImage
											src={it.cover.startsWith('http') ? it.cover : `${origin}${it.cover}`}
											slug={it.slug}
											alt={it.title}
											sizes='64px'
											className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
										/>
									) : (
										<div className='from-brand/15 to-brand-secondary/15 h-full w-full bg-gradient-to-br' />
									)}
								</div>
								<div className='min-w-0 flex-1'>
									<div className='text-secondary flex items-center gap-2 text-[10.5px]'>
										<span className='handwriting tabular-nums'>{dayjs(it.date).format('MM-DD')}</span>
										{it.category && <span className='text-brand-ink/80 truncate'>{it.category}</span>}
										{it.words ? <span className='shrink-0 tabular-nums'>{it.words.toLocaleString('zh-CN')} 字</span> : null}
									</div>
									<h3 className='group-hover:text-brand-ink mt-1 truncate text-[14px] font-medium transition-colors max-sm:text-[14.5px]'>
										{it.title}
									</h3>
									<p className='text-secondary mt-0.5 line-clamp-1 text-[11.5px] leading-relaxed'>{plainInline(it.summary)}</p>
								</div>
							</Link>
						))}
					</div>
					</div>

					<aside {...fade(0.12)} className='ink-fade-up'>
						<div className='mb-3 flex items-baseline justify-between'>
							<h2 className='text-[15px] font-semibold tracking-tight'>统计</h2>
							<Link href='/about' className='glass-1 text-secondary hover:text-brand-ink rounded-full px-2.5 py-1 text-[11px] transition-colors'>
								关于
							</Link>
						</div>

						{/* 四格数字 */}
						<div className='grid grid-cols-2 gap-2'>
							{[
								{ v: items.length, l: '篇笔记' },
								{ v: tagTotal, l: '个标签' },
								{ v: categoryCount, l: '个分类' },
								{ v: seriesCount, l: '个系列' }
							].map(cell => (
								<div key={cell.l} className='glass-1 rounded-xl px-3.5 py-3'>
									<div className='text-[22px] leading-none font-semibold tabular-nums'>{cell.v}</div>
									<div className='text-secondary mt-1.5 text-[10.5px]'>{cell.l}</div>
								</div>
							))}
						</div>

						{/* 最近 12 个月的写作节奏 */}
						<div className='glass-1 mt-2 rounded-xl px-3.5 py-3'>
							<div className='text-secondary flex items-baseline justify-between text-[10px]'>
								<span>按月 · 最近 12 个月</span>
								<span className='tabular-nums'>最近 {latestLabel}</span>
							</div>
							<div className='mt-2.5 flex h-14 items-end gap-[3px]'>
								{monthly.map(m => (
									<div key={m.key} className='group/bar relative flex h-full flex-1 items-end' title={`${m.label} · ${m.n} 篇`}>
										<div
											className={m.n > 0 ? 'bg-brand/70 group-hover/bar:bg-brand w-full rounded-[3px] transition-colors' : 'bg-secondary/20 w-full rounded-[3px]'}
											style={{ height: `${Math.max(m.n > 0 ? 12 : 4, (m.n / monthMax) * 100)}%` }}
										/>
									</div>
								))}
							</div>
							<div className='text-secondary mt-1.5 flex justify-between text-[9px] tabular-nums'>
								<span>{monthly[0]?.label}</span>
								<span>{monthly[11]?.label}</span>
							</div>
						</div>

						<div className='mt-5'>
							<div className='mb-2 flex items-baseline justify-between'>
								<h2 className='text-[13px] font-semibold tracking-wide'>发文日历</h2>
								<Link href='/archive' className='glass-1 text-secondary hover:text-brand-ink rounded-full px-2.5 py-1 text-[11px] transition-colors'>
									归档
								</Link>
							</div>
							<MonthCalendar dates={items.map(it => it.date)} onPick={goToDay} />
						</div>

						<div className='mt-5'>
							<div className='mb-2 flex items-baseline justify-between'>
								<h2 className='text-[13px] font-semibold tracking-wide'>边写边听</h2>
								<Link href='/music' className='glass-1 text-secondary hover:text-brand-ink rounded-full px-2.5 py-1 text-[11px] transition-colors'>
									Music
								</Link>
							</div>
							<InlinePlayer />
						</div>

						<div className='mt-5'>
							<div className='mb-2 flex items-baseline justify-between'>
								<h2 className='text-[13px] font-semibold tracking-wide'>逛逛</h2>
							</div>
							<div className='grid grid-cols-2 gap-2'>
								{[
									{ href: '/archive', t: '归档', d: '按时间' },
									{ href: '/series', t: '系列', d: '按主题' },
									{ href: '/projects', t: '项目', d: 'GitHub' },
									{ href: '/guestbook', t: '留言板', d: '随便聊聊' }
								].map(x => (
									<Link
										key={x.href}
										href={x.href}
										className='glass-1 hover:border-brand/40 group rounded-lg px-3 py-2.5 transition-colors'>
										<div className='group-hover:text-brand-ink text-[12px] transition-colors'>{x.t}</div>
										<div className='text-secondary mt-0.5 text-[10px]'>{x.d}</div>
									</Link>
								))}
							</div>
						</div>
					</aside>
				</div>

				{/* 最近写的 */}
				{big && (
					<section className='mt-14 max-sm:mt-10'>
						<div className='border-border/60 mb-5 flex items-baseline justify-between border-b pb-2.5'>
							<h2 className='text-[16px] font-semibold tracking-tight'>最近写的</h2>
							<Link href='/blog' className='glass-1 text-secondary hover:text-brand-ink rounded-full px-2.5 py-1 text-[11px] transition-colors'>
								全部文章
							</Link>
						</div>

						<div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]'>
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
								<div className='glass-2 flex flex-col rounded-xl px-4 py-4'>
									<div className='flex items-center gap-2 text-[10.5px]'>
										{big.category && <span className='text-brand-ink tracking-wider'>{big.category}</span>}
										<span className='text-secondary'>{dayjs(big.date).format('YYYY-MM-DD')}</span>
									</div>
									<h3 className='group-hover:text-brand-ink mt-2 text-[16px] leading-[1.5] font-medium transition-colors max-sm:text-[16.5px]'>{big.title}</h3>
									<p className='text-secondary mt-2 line-clamp-4 text-[12px] leading-[1.85]'>{plainInline(big.summary)}</p>
									<span className='text-brand-ink mt-auto inline-flex items-center gap-1 pt-3 text-[11px] opacity-0 transition-opacity group-hover:opacity-100'>
										继续读 <ChevronRight className='h-3 w-3' />
									</span>
								</div>
							</Link>

							<div className='flex h-full flex-col gap-2'>
								{small.map((it, i) => (
									<Link key={it.slug} href={`/blog/${it.slug}`} {...fade(0.1 + i * 0.05)} className='ink-fade-up group glass-1 hover:border-brand/40 flex flex-1 flex-col rounded-xl px-3.5 py-3 transition-colors'>
										<div className='text-secondary flex items-center gap-2 text-[10.5px]'>
											<span>{dayjs(it.date).format('YYYY-MM-DD')}</span>
											{it.category && <span className='text-brand-ink opacity-90'>{it.category}</span>}
										</div>
										<h3 className='group-hover:text-brand-ink mt-1.5 text-[14px] leading-[1.55] font-medium transition-colors max-sm:text-[15px]'>{it.title}</h3>
										<p className='text-secondary mt-1 line-clamp-2 text-[11.5px] leading-[1.8] max-sm:text-[12.5px]'>{plainInline(it.summary)}</p>
									</Link>
								))}
							</div>
						</div>
					</section>
				)}

				{/* 系列 / 再往前 */}
				<div className='mt-14 grid items-start gap-8 max-sm:mt-10 lg:grid-cols-[minmax(0,1fr)_380px]'>
					{seriesGroups.length > 0 && (
						<section>
							<div className='border-border/60 mb-4 flex items-baseline justify-between border-b pb-2.5'>
								<h2 className='text-[16px] font-semibold tracking-tight'>系列</h2>
								<Link href='/series' className='glass-1 text-secondary hover:text-brand-ink rounded-full px-2.5 py-1 text-[11px] transition-colors'>
									全部
								</Link>
							</div>

							<div className='space-y-5'>
								{seriesGroups.map(([root, list]) => (
									<div key={root}>
										{/* 一级：大类 */}
										<div className='flex items-baseline justify-between gap-3'>
											<span className='text-[15px] leading-tight font-semibold tracking-[-0.01em]'>{root}</span>
											<span className='text-secondary text-[10.5px] tabular-nums'>{list.length} 个系列</span>
										</div>
										{/* 二级：大类下的系列 */}
										<div className='mt-2 space-y-1.5'>
											{list.map(g => (
												<Link
													key={g.slug}
													href={`/series/${encodeURIComponent(g.slug)}`}
													className='group glass-1 hover:border-brand/40 flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors'>
													<span className='min-w-0'>
														<span className='text-secondary group-hover:text-brand-ink block truncate text-[12.5px] transition-colors'>
															{g.name}
														</span>
														<span className='text-secondary mt-0.5 block text-[10.5px] tabular-nums'>
															{g.items.length} 篇 · 最近 {dayjs(g.items[g.items.length - 1].date).format('M 月 D 日')}
														</span>
													</span>
													<ChevronRight className='text-secondary h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-50' />
												</Link>
											))}
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					<section>
						<div className='border-border/60 mb-4 flex items-baseline justify-between border-b pb-2.5'>
							<h2 className='text-[16px] font-semibold tracking-tight'>再往前</h2>
							<Link href='/archive' className='glass-1 text-secondary hover:text-brand-ink rounded-full px-2.5 py-1 text-[11px] transition-colors'>
								归档
							</Link>
						</div>
						<div className='glass-1 rounded-xl px-3.5 py-2'>
							<PostList items={rest} dense showTags={false} empty={loading ? '加载中…' : '还没有文章'} />
						</div>
					</section>
				</div>

				{/* 标签 */}
				{tags.length > 0 && (
					<section className='mt-14 max-sm:mt-10'>
						<div className='border-border/60 mb-4 flex items-baseline justify-between border-b pb-2.5'>
							<h2 className='text-[16px] font-semibold tracking-tight'>话题</h2>
							<span className='text-secondary text-[10.5px] tabular-nums'>{tags.length} 个</span>
						</div>
						<div className='flex flex-wrap gap-1.5'>
							{tags.map(([t, n]) => (
								<Link
									key={t}
									href={`/blog/tag/${encodeURIComponent(t)}`}
									className='glass-1 text-secondary hover:border-brand/40 hover:text-brand-ink rounded-full px-2.5 py-1 text-[10.5px] transition-colors'>
									{t}
									{n > 1 && <span className='text-secondary/60 ml-1 text-[9px] tabular-nums'>{n}</span>}
								</Link>
							))}
						</div>
					</section>
				)}

				<div className='border-border/60 mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-6 max-sm:mt-10'>
					<div className='text-secondary text-[11.5px]'>订阅，或者随便逛逛</div>
					<div className='flex flex-wrap items-center gap-2'>
						<a
							href='/rss.xml'
							className='glass-1 hover:border-brand/40 text-secondary hover:text-brand-ink rounded-full px-3 py-1.5 text-[11px] transition-colors'>
							RSS
						</a>
						<a
							href='https://github.com/InkStain258'
							target='_blank'
							rel='noreferrer'
							className='glass-1 hover:border-brand/40 text-secondary hover:text-brand-ink rounded-full px-3 py-1.5 text-[11px] transition-colors'>
							GitHub
						</a>
						<Link
							href='/about'
							className='glass-1 hover:border-brand/40 text-secondary hover:text-brand-ink rounded-full px-3 py-1.5 text-[11px] transition-colors'>
							关于本站
						</Link>
					</div>
				</div>
			</div>
		</div>
		</>
	)
}
