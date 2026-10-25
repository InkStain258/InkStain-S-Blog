'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
	Bold,
	Italic,
	Strikethrough,
	Code,
	SquareCode,
	Heading1,
	Heading2,
	Heading3,
	Quote,
	List,
	ListOrdered,
	ListChecks,
	Minus,
	Link2,
	Table,
	ChevronDown,
	FileText,
	MousePointerClick
} from 'lucide-react'
import { MD_TEMPLATES, type MdTemplate } from '@/lib/md-templates'
import type { MdAction } from '@/lib/md-insert'

type Props = {
	onAction: (action: MdAction) => void
	onTemplate: (tpl: MdTemplate) => void
	words: number
	savedAt: string | null
}

type Btn = { action: MdAction; icon: React.ReactNode; title: string }

const GROUP_1: Btn[] = [
	{ action: 'h1', icon: <Heading1 className='h-4 w-4' />, title: '一级标题' },
	{ action: 'h2', icon: <Heading2 className='h-4 w-4' />, title: '二级标题' },
	{ action: 'h3', icon: <Heading3 className='h-4 w-4' />, title: '三级标题' }
]

const GROUP_2: Btn[] = [
	{ action: 'bold', icon: <Bold className='h-4 w-4' />, title: '加粗 (Ctrl+B)' },
	{ action: 'italic', icon: <Italic className='h-4 w-4' />, title: '斜体 (Ctrl+I)' },
	{ action: 'strike', icon: <Strikethrough className='h-4 w-4' />, title: '删除线' },
	{ action: 'code', icon: <Code className='h-4 w-4' />, title: '行内代码' },
	{ action: 'codeblock', icon: <SquareCode className='h-4 w-4' />, title: '代码块' }
]

const GROUP_3: Btn[] = [
	{ action: 'quote', icon: <Quote className='h-4 w-4' />, title: '引用' },
	{ action: 'ul', icon: <List className='h-4 w-4' />, title: '无序列表' },
	{ action: 'ol', icon: <ListOrdered className='h-4 w-4' />, title: '有序列表' },
	{ action: 'task', icon: <ListChecks className='h-4 w-4' />, title: '任务清单' }
]

const GROUP_4: Btn[] = [
	{ action: 'link', icon: <Link2 className='h-4 w-4' />, title: '链接 (Ctrl+K)' },
	{ action: 'table', icon: <Table className='h-4 w-4' />, title: '表格' },
	{ action: 'divider', icon: <Minus className='h-4 w-4' />, title: '分割线' }
]

const MENU_WIDTH = 288

export function EditorToolbar({ onAction, onTemplate, words, savedAt }: Props) {
	const [open, setOpen] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

	const triggerRef = useRef<HTMLButtonElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => setMounted(true), [])

	// 以触发器为基准算固定定位坐标：不被父级裁切，也不超出视口
	const measure = useCallback(() => {
		const btn = triggerRef.current
		if (!btn) return
		const r = btn.getBoundingClientRect()
		const gap = 6
		const margin = 12
		const h = menuRef.current?.offsetHeight || 300
		const vh = window.innerHeight
		const vw = window.innerWidth

		let top = r.bottom + gap
		// 下方放不下就翻到上方
		if (top + h > vh - margin) {
			const above = r.top - gap - h
			top = above >= margin ? above : Math.max(margin, vh - h - margin)
		}
		const left = Math.min(Math.max(margin, r.left), Math.max(margin, vw - MENU_WIDTH - margin))
		setPos({ top, left })
	}, [])

	useLayoutEffect(() => {
		if (open) measure()
		else setPos(null)
	}, [open, measure])

	// 拿到真实高度后再校正一次（向上翻转依赖实际高度）
	useEffect(() => {
		if (open && menuRef.current) measure()
	}, [open, measure])

	useEffect(() => {
		if (!open) return

		const onDown = (e: MouseEvent) => {
			const t = e.target as Node
			if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
			setOpen(false)
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		// fixed 浮层不随滚动移动，一旦滚动就收起
		const onScroll = () => setOpen(false)

		document.addEventListener('mousedown', onDown)
		document.addEventListener('keydown', onKey)
		window.addEventListener('scroll', onScroll, true)
		window.addEventListener('resize', onScroll)
		return () => {
			document.removeEventListener('mousedown', onDown)
			document.removeEventListener('keydown', onKey)
			window.removeEventListener('scroll', onScroll, true)
			window.removeEventListener('resize', onScroll)
		}
	}, [open])

	const renderGroup = (items: Btn[]) => (
		<div className='flex items-center gap-0.5'>
			{items.map(b => (
				<button
					key={b.action}
					type='button'
					title={b.title}
					onMouseDown={e => e.preventDefault()}
					onClick={() => onAction(b.action)}
					className='text-secondary hover:bg-brand/10 hover:text-brand grid h-8 w-8 place-items-center rounded-lg transition-colors'>
					{b.icon}
				</button>
			))}
		</div>
	)

	const menu = (
		<div
			ref={menuRef}
			role='menu'
			style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: MENU_WIDTH }}
			className='ink-menu fixed z-[9999] overflow-hidden rounded-xl border border-black/10 shadow-2xl ring-1 ring-black/5 dark:border-white/15 dark:ring-white/10'>
			<div className='text-secondary border-b border-black/5 px-3 py-1.5 text-[11px] font-medium tracking-wide dark:border-white/10'>预设模板</div>
			<div className='scrollbar-none max-h-[min(60vh,360px)] overflow-y-auto py-1'>
				{MD_TEMPLATES.map(tpl => (
					<button
						key={tpl.id}
						type='button'
						role='menuitem'
						onMouseDown={e => e.preventDefault()}
						onClick={() => {
							onTemplate(tpl)
							setOpen(false)
						}}
						className='hover:bg-brand/10 block w-full px-3 py-2 text-left transition-colors'>
						<div className='text-[13px] font-medium'>{tpl.name}</div>
						<div className='text-secondary mt-0.5 text-[11px] leading-relaxed opacity-80'>{tpl.hint}</div>
					</button>
				))}
			</div>
		</div>
	)

	return (
		<div className='mb-3 flex flex-wrap items-center gap-1 rounded-xl border bg-white/40 p-1.5 backdrop-blur-sm dark:bg-white/5'>
			{renderGroup(GROUP_1)}
			<span className='bg-secondary/20 mx-0.5 h-5 w-px' />
			{renderGroup(GROUP_2)}
			<span className='bg-secondary/20 mx-0.5 h-5 w-px' />
			{renderGroup(GROUP_3)}
			<span className='bg-secondary/20 mx-0.5 h-5 w-px' />
			{renderGroup(GROUP_4)}

			<span className='bg-secondary/20 mx-0.5 h-5 w-px' />

			{/* 预设模板 */}
			<button
				ref={triggerRef}
				type='button'
				aria-haspopup='menu'
				aria-expanded={open}
				onMouseDown={e => e.preventDefault()}
				onClick={() => setOpen(v => !v)}
				className={`flex h-8 items-center gap-1 rounded-lg px-2 text-xs transition-colors ${
					open ? 'bg-brand/15 text-brand' : 'text-secondary hover:bg-brand/10 hover:text-brand'
				}`}>
				<FileText className='h-4 w-4' />
				模板
				<ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
			</button>

			{mounted && open && createPortal(menu, document.body)}

			<div className='text-secondary ml-auto flex items-center gap-3 pr-1 text-[11px]'>
				<span className='flex items-center gap-1 opacity-70'>
					<MousePointerClick className='h-3 w-3' />
					拖拽图片到此处可插入
				</span>
				<span>{words} 字</span>
				{savedAt && <span className='text-brand/70'>草稿已存 {savedAt}</span>}
			</div>
		</div>
	)
}
