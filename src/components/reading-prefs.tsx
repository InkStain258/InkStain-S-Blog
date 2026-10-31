'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Type, X } from 'lucide-react'

type Prefs = { size: number; leading: number; font: 'sans' | 'serif' | 'system'; width: number }

const DEFAULT: Prefs = { size: 16, leading: 1.92, font: 'system', width: 760 }
const KEY = 'inkstain:reading-prefs'

const FONTS: { id: Prefs['font']; label: string; css: string }[] = [
	{ id: 'system', label: '默认', css: '' },
	{ id: 'serif', label: '宋体', css: '"Songti SC", "SimSun", "Noto Serif SC", ui-serif, Georgia, serif' },
	{ id: 'sans', label: '黑体', css: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", ui-sans-serif, system-ui' }
]

function apply(p: Prefs) {
	const root = document.documentElement
	root.style.setProperty('--reading-size', `${p.size}px`)
	root.style.setProperty('--reading-leading', String(p.leading))
	root.style.setProperty('--reading-width', `${p.width}px`)
	root.style.setProperty('--reading-font', FONTS.find(f => f.id === p.font)?.css || '')
}

export default function ReadingPrefs() {
	const [open, setOpen] = useState(false)
	const [hasProse, setHasProse] = useState(false)
	const [p, setP] = useState<Prefs>(DEFAULT)

	// 只在有正文的页面出现，并读回上次设置
	useEffect(() => {
		const t = setTimeout(() => setHasProse(!!document.querySelector('.prose')), 800)
		try {
			const raw = localStorage.getItem(KEY)
			if (raw) {
				const saved = { ...DEFAULT, ...JSON.parse(raw) } as Prefs
				setP(saved)
				apply(saved)
			} else {
				apply(DEFAULT)
			}
		} catch {
			apply(DEFAULT)
		}
		return () => clearTimeout(t)
	}, [])

	const update = (patch: Partial<Prefs>) => {
		const next = { ...p, ...patch }
		setP(next)
		apply(next)
		try {
			localStorage.setItem(KEY, JSON.stringify(next))
		} catch {}
	}

	if (!hasProse) return null

	const Row = ({ label }: { label: string }) => <div className='text-secondary mb-1.5 text-[10.5px] tracking-wider opacity-60'>{label}</div>

	return (
		<>
			<motion.button
				type='button'
				onClick={() => setOpen(v => !v)}
				aria-label='阅读设置'
				whileHover={{ scale: 1.06 }}
				whileTap={{ scale: 0.94 }}
				className='glass-2 text-secondary hover:text-brand fixed right-6 bottom-[8.75rem] z-40 grid h-11 w-11 place-items-center rounded-full'>
				<Type className='h-4 w-4' />
			</motion.button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.97 }}
						transition={{ type: 'spring', stiffness: 380, damping: 30 }}
						className='glass-overlay fixed right-4 bottom-[12.5rem] z-40 max-h-[calc(100vh-230px)] w-[228px] overflow-y-auto rounded-2xl p-3.5'>
						<div className='mb-3 flex items-center justify-between'>
							<span className='text-[12px] font-medium'>阅读设置</span>
							<button type='button' onClick={() => setOpen(false)} aria-label='收起' className='text-secondary hover:text-primary'>
								<X className='h-3.5 w-3.5' />
							</button>
						</div>

						<Row label='字号' />
						<div className='mb-3 flex items-center gap-1'>
							{[
								{ v: 15, l: '小' },
								{ v: 16, l: '标准' },
								{ v: 17, l: '较大' },
								{ v: 18, l: '大' },
								{ v: 20, l: '特大' }
							].map(o => (
								<button
									key={o.v}
									type='button'
									onClick={() => update({ size: o.v })}
									className={`flex-1 rounded-lg py-1.5 text-[10.5px] transition-colors ${p.size === o.v ? 'bg-brand text-white' : 'text-secondary border hover:text-brand'}`}>
									{o.l}
								</button>
							))}
						</div>

						<Row label='行距' />
						<div className='mb-3 flex items-center gap-1'>
							{[
								{ v: 1.7, l: '紧' },
								{ v: 1.85, l: '适中' },
								{ v: 1.92, l: '松' },
								{ v: 2.1, l: '很松' }
							].map(o => (
								<button
									key={o.v}
									type='button'
									onClick={() => update({ leading: o.v })}
									className={`flex-1 rounded-lg py-1.5 text-[10.5px] transition-colors ${p.leading === o.v ? 'bg-brand text-white' : 'text-secondary border hover:text-brand'}`}>
									{o.l}
								</button>
							))}
						</div>

						<Row label='字体' />
						<div className='mb-3 flex items-center gap-1'>
							{FONTS.map(f => (
								<button
									key={f.id}
									type='button'
									onClick={() => update({ font: f.id })}
									style={{ fontFamily: f.css || undefined }}
									className={`flex-1 rounded-lg py-1.5 text-[11px] transition-colors ${p.font === f.id ? 'bg-brand text-white' : 'text-secondary border hover:text-brand'}`}>
									{f.label}
								</button>
							))}
						</div>

						<Row label='版心宽度' />
						<div className='flex items-center gap-1'>
							{[
								{ v: 640, l: '窄' },
								{ v: 760, l: '标准' },
								{ v: 900, l: '宽' }
							].map(o => (
								<button
									key={o.v}
									type='button'
									onClick={() => update({ width: o.v })}
									className={`flex-1 rounded-lg py-1.5 text-[10.5px] transition-colors ${p.width === o.v ? 'bg-brand text-white' : 'text-secondary border hover:text-brand'}`}>
									{o.l}
								</button>
							))}
						</div>

						<p className='text-secondary mt-3 text-[10px] leading-relaxed opacity-50'>设置存在本地，只影响你的浏览器。</p>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
