'use client'

import { useEffect, useRef, useState } from 'react'
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

export function EditorToolbar({ onAction, onTemplate, words, savedAt }: Props) {
	const [open, setOpen] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const onDown = (e: MouseEvent) => {
			if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', onDown)
		return () => document.removeEventListener('mousedown', onDown)
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
			<div className='relative' ref={boxRef}>
				<button
					type='button'
					onMouseDown={e => e.preventDefault()}
					onClick={() => setOpen(v => !v)}
					className='text-secondary hover:bg-brand/10 hover:text-brand flex h-8 items-center gap-1 rounded-lg px-2 text-xs transition-colors'>
					<FileText className='h-4 w-4' />
					模板
					<ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
				</button>

				{open && (
					<div className='bg-card absolute top-full left-0 z-30 mt-1 w-64 overflow-hidden rounded-xl border shadow-xl backdrop-blur-md'>
						{MD_TEMPLATES.map(tpl => (
							<button
								key={tpl.id}
								type='button'
								onClick={() => {
									onTemplate(tpl)
									setOpen(false)
								}}
								className='hover:bg-brand/10 block w-full px-3 py-2 text-left transition-colors'>
								<div className='text-[13px] font-medium'>{tpl.name}</div>
								<div className='text-secondary mt-0.5 text-[11px]'>{tpl.hint}</div>
							</button>
						))}
					</div>
				)}
			</div>

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
