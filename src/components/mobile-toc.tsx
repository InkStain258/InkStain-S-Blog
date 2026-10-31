'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { List, X } from 'lucide-react'

type TocItem = { id: string; text: string; level: number }

/** 移动端目录：底部抽屉，替换掉桌面端的侧边 TOC */
export default function MobileToc({ toc }: { toc: TocItem[] }) {
	const [open, setOpen] = useState(false)
	if (!toc?.length) return null

	const jump = (id: string) => {
		const el = document.getElementById(id)
		el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		setOpen(false)
	}

	return (
		<div className='sm:hidden'>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='text-secondary border-border/60 fixed bottom-6 left-5 z-40 flex h-10 items-center gap-1.5 rounded-full border bg-white/75 px-3.5 text-[11.5px] backdrop-blur-md dark:bg-black/45'>
				<List className='h-3.5 w-3.5' />
				目录
				<span className='opacity-50'>{toc.length}</span>
			</button>

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
							className='bg-card fixed inset-x-0 bottom-0 z-[71] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t px-5 pt-4 pb-8'>
							<div className='mb-3 flex items-center justify-between'>
								<span className='text-[12.5px] font-medium'>目录</span>
								<button type='button' onClick={() => setOpen(false)} aria-label='关闭' className='text-secondary'>
									<X className='h-4 w-4' />
								</button>
							</div>
							<div className='space-y-1'>
								{toc.map(t => (
									<button
										key={t.id}
										type='button'
										onClick={() => jump(t.id)}
										style={{ paddingLeft: (t.level - 1) * 12 }}
										className='text-secondary hover:text-brand block w-full truncate py-1.5 text-left text-[12.5px] transition-colors'>
										{t.text}
									</button>
								))}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	)
}
