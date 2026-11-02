'use client'

import Link from 'next/link'
import { ArrowUpRight, FlaskConical, Clock, Image as ImageIcon, Images, Music, Shapes, Code2, Sparkles, Gamepad2 } from 'lucide-react'
import { LAB_TOOLS } from '@/lib/lab-tools'

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
 * 实验室：把散落在站点各处、以前没有任何入口的小工具集中到一页。
 * 清单在 src/lib/lab-tools.ts，首页磁贴读的是同一份。
 */
export default function LabPage() {
	return (
		<div className='mx-auto w-full max-w-[980px] px-6 pt-28 pb-24 max-sm:px-4'>
			<header className='ink-fade-up'>
				<div className='text-secondary mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase opacity-70'>
					<FlaskConical className='h-3.5 w-3.5' />
					Lab
				</div>
				<h1 className='text-2xl font-semibold tracking-tight sm:text-[28px]'>实验室</h1>
				<p className='text-secondary mt-2 max-w-[620px] text-[13px] leading-[1.9] opacity-80'>
					不符合实验室规范的废品回收站，也许可以淘宝
				</p>
			</header>

			<div className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{LAB_TOOLS.map((t, i) => {
					const Icon = LAB_ICONS[t.icon]
					return (
						<Link
							key={t.href}
							href={t.href}
							className='ink-fade-up glass-2 group flex h-full flex-col gap-2 rounded-2xl border p-4 transition-colors hover:border-brand/40'
							style={{ animationDelay: `${0.04 * i}s` }}>
							<div className='flex items-center gap-2.5'>
								<span className='bg-brand/10 text-brand-ink grid h-8 w-8 place-items-center rounded-xl'>
									<Icon className='h-4 w-4' />
								</span>
								<span className='text-[14px] font-medium'>{t.title}</span>
								<span className='text-secondary ml-auto text-[10px] tracking-wider opacity-60'>{t.tag}</span>
								<ArrowUpRight className='text-secondary h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70' />
							</div>
							<p className='text-secondary text-[12px] leading-relaxed opacity-75'>{t.desc}</p>
						</Link>
					)
				})}
			</div>
		</div>
	)
}
