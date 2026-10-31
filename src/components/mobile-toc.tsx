'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls } from 'motion/react'
import clsx from 'clsx'
import { List, X, Bookmark } from 'lucide-react'

type TocItem = { id: string; text: string; level: number }

type MobileTocProps = {
	toc: TocItem[]
	activeId?: string
	progress?: number
	resume?: { id: string; text: string } | null
	onResume?: () => void
}

/**
 * 移动端目录：底部抽屉，替换掉桌面端的侧边 TOC；与侧边栏共用同一份进度与当前章节。
 *
 * 抽屉必须走 Portal 挂到 body：
 * 组件所在的那层容器有 transform/层叠上下文，抽屉写在原地时 z-[71] 也压不住
 * z-40 的「阅读设置」「回到顶部」浮动按钮（实测 elementFromPoint 命中按钮）。
 */
export default function MobileToc({ toc, activeId = '', progress = 0, resume, onResume }: MobileTocProps) {
	const [open, setOpen] = useState(false)
	const [mounted, setMounted] = useState(false)
	const dragControls = useDragControls()
	const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
	const triggerRef = useRef<HTMLButtonElement>(null)
	const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100)

	useEffect(() => setMounted(true), [])

	// 打开抽屉时把当前章节带进可视区，长目录不用手滑
	useEffect(() => {
		if (!open || !activeId) return
		const t = setTimeout(() => itemRefs.current[activeId]?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 140)
		return () => clearTimeout(t)
	}, [open, activeId])

	// Esc 关闭，关掉后焦点回到触发按钮（键盘用户不会掉到页面顶部）
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				setOpen(false)
			}
		}
		window.addEventListener('keydown', onKey)
		return () => {
			window.removeEventListener('keydown', onKey)
			triggerRef.current?.focus({ preventScroll: true })
		}
	}, [open])

	if (!toc?.length) return null

	const jump = (id: string) => {
		const el = document.getElementById(id)
		el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		setOpen(false)
	}

	const drawer = (
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setOpen(false)}
						className='fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]'
					/>
					<motion.div
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={{ type: 'spring', stiffness: 320, damping: 34 }}
						// 只有抓头部才能拖动：列表本身还要正常滚动
						drag='y'
						dragListener={false}
						dragControls={dragControls}
						// 允许向下拖 320px，超出用弹性收住；只有头部能起拖
						dragConstraints={{ top: 0, bottom: 320 }}
						dragElastic={{ top: 0, bottom: 0.4 }}
						// 手势没到阈值就弹回原位；到阈值由 onDragEnd 关闭
						dragSnapToOrigin
						onDragEnd={(_, info) => {
							if (info.offset.y > 96 || info.velocity.y > 520) setOpen(false)
						}}
						// bg-card 自带 alpha，单用会透出背后的正文；先垫一层不透明的 --color-bg
						style={{ background: 'linear-gradient(var(--color-card), var(--color-card)), var(--color-bg)' }}
						className='fixed inset-x-0 bottom-0 z-[71] flex max-h-[70vh] flex-col rounded-t-2xl border-t px-5 pt-4 pb-8 backdrop-blur-xl'>
						<div
							onPointerDown={e => dragControls.start(e)}
							className='mb-2 flex shrink-0 cursor-grab touch-none items-center justify-between active:cursor-grabbing'>
							<span aria-hidden className='bg-border absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full opacity-70' />
							<span className='text-[12.5px] font-medium'>目录</span>
							<span className='text-secondary flex items-center gap-2 text-[10.5px] tabular-nums'>
								{percent}%
								<button type='button' onClick={() => setOpen(false)} aria-label='关闭' className='text-secondary'>
									<X className='h-4 w-4' />
								</button>
							</span>
						</div>

						<div className='bg-border/60 relative mb-3 h-[2px] w-full shrink-0 overflow-hidden rounded-full'>
							<div
								className='from-brand to-brand-secondary h-full bg-gradient-to-r'
								style={{ width: `${percent}%`, transition: 'width 150ms linear' }}
							/>
						</div>

						{resume && resume.id !== activeId && (
							<button
								type='button'
								onClick={() => {
									jump(resume.id)
									onResume?.()
								}}
								className='text-secondary hover:text-brand mb-2 flex w-full shrink-0 items-center gap-1.5 rounded-lg border border-dashed px-2 py-1.5 text-left text-[11px] transition-colors'>
								<Bookmark className='h-3 w-3 shrink-0' />
								<span className='truncate'>上次读到 · {resume.text}</span>
							</button>
						)}

						{/* 列表单独滚动：自动定位当前章节时不会把标题栏和进度条一起卷走 */}
						<div className='min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain'>
							{toc.map(t => {
								const active = t.id === activeId
								return (
									<button
										key={t.id}
										type='button'
										ref={node => {
											itemRefs.current[t.id] = node
										}}
										onClick={() => jump(t.id)}
										aria-current={active ? 'location' : undefined}
										style={{ paddingLeft: (t.level - 1) * 12 }}
										className={clsx(
											'block w-full truncate py-1.5 text-left text-[12.5px] transition-colors',
											active ? 'text-brand font-medium' : 'text-secondary hover:text-brand'
										)}>
										{t.text}
									</button>
								)
							})}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)

	return (
		<div className='sm:hidden'>
			<button
				type='button'
				ref={triggerRef}
				onClick={() => setOpen(true)}
				aria-expanded={open}
				aria-haspopup='dialog'
				className='glass-2 text-secondary fixed bottom-6 left-5 z-40 flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[11.5px]'>
				<List className='h-3.5 w-3.5' />
				目录
				<span className='text-brand tabular-nums opacity-80'>{percent}%</span>
			</button>

			{mounted && createPortal(drawer, document.body)}
		</div>
	)
}
