import { motion } from 'motion/react'
import { useWriteStore } from '../stores/write-store'
import { INIT_DELAY } from '@/consts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { runMdAction, type MdAction } from '@/lib/md-insert'
import type { MdTemplate } from '@/lib/md-templates'
import { DRAFT_KEY } from '@/lib/draft'
import { EditorToolbar } from './editor-toolbar'

export function WriteEditor() {
	const { form, updateForm, images, addFiles } = useWriteStore()
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [savedAt, setSavedAt] = useState<string | null>(null)
	const [dragging, setDragging] = useState(false)

	/** 统一的写回入口：更新文本并在下一帧恢复选区 */
	const apply = (next: string, selStart: number, selEnd: number) => {
		const ta = textareaRef.current
		updateForm({ md: next })
		if (!ta) return
		requestAnimationFrame(() => {
			ta.focus()
			ta.setSelectionRange(selStart, selEnd)
		})
	}

	const handleAction = (action: MdAction) => {
		const ta = textareaRef.current
		if (!ta) return
		runMdAction(action, ta, apply)
	}

	const handleTemplate = (tpl: MdTemplate) => {
		const ta = textareaRef.current
		const current = form.md || ''
		const prefix = current && !current.endsWith('\n\n') ? (current.endsWith('\n') ? '\n' : '\n\n') : ''
		const next = current + prefix + tpl.body
		updateForm({ md: next })
		requestAnimationFrame(() => {
			ta?.focus()
			ta?.setSelectionRange(next.length, next.length)
		})
	}

	// 字数统计（去掉代码块与标记符）
	const words = useMemo(() => {
		const plain = (form.md || '')
			.replace(/```[\s\S]*?```/g, '')
			.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
			.replace(/[#>*_`~\-\[\]()]/g, '')
			.replace(/\s/g, '')
		return plain.length
	}, [form.md])

	// 草稿自动保存
	useEffect(() => {
		if (!form.md && !form.title) return
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, _savedAt: Date.now() }))
				const now = new Date()
				setSavedAt(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
			} catch {
				/* 隐私模式下忽略 */
			}
		}, 1200)
		return () => clearTimeout(timer)
	}, [form])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const textarea = textareaRef.current
		if (!textarea) return

		if (e.ctrlKey || e.metaKey) {
			if (e.key === 'b') {
				e.preventDefault()
				runMdAction('bold', textarea, apply)
				return
			}
			if (e.key === 'i') {
				e.preventDefault()
				runMdAction('italic', textarea, apply)
				return
			}
			if (e.key === 'k') {
				e.preventDefault()
				runMdAction('link', textarea, apply)
				return
			}
			if (e.key === 's') {
				e.preventDefault()
				return
			}
		}

		// Tab / Shift+Tab 缩进
		if (e.key === 'Tab') {
			e.preventDefault()
			const { selectionStart, selectionEnd, value } = textarea
			if (!e.shiftKey) {
				apply(value.slice(0, selectionStart) + '\t' + value.slice(selectionEnd), selectionStart + 1, selectionStart + 1)
			} else {
				const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
				if (value.startsWith('\t', lineStart)) {
					apply(value.slice(0, lineStart) + value.slice(lineStart + 1), Math.max(lineStart, selectionStart - 1), Math.max(lineStart, selectionEnd - 1))
				}
			}
			return
		}

		// Enter 自动延续列表
		if (e.key === 'Enter' && !e.shiftKey) {
			const { selectionStart, value } = textarea
			const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
			const line = value.slice(lineStart, selectionStart)
			const m = line.match(/^(\s*)(- \[[ xX]\] |[-*+] |\d+\. )/)
			if (m) {
				const [, indent, marker] = m
				// 空列表项回车则结束列表
				if (line.trim() === marker.trim()) {
					e.preventDefault()
					apply(value.slice(0, lineStart) + '\n' + value.slice(selectionStart), lineStart + 1, lineStart + 1)
					return
				}
				e.preventDefault()
				const nextMarker = /^\d+\. $/.test(marker) ? `${parseInt(marker) + 1}. ` : marker
				const insert = `\n${indent}${nextMarker}`
				apply(value.slice(0, selectionStart) + insert + value.slice(selectionStart), selectionStart + insert.length, selectionStart + insert.length)
			}
		}
	}

	const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const items = e.clipboardData.items
		if (!items) return

		const imageFiles: File[] = []
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile()
				if (file) imageFiles.push(file)
			}
		}

		if (imageFiles.length > 0) {
			e.preventDefault()
			await insertImages(imageFiles)
		}
	}

	const insertImages = async (files: File[]) => {
		const ta = textareaRef.current
		const resultImages = await addFiles(files).catch(() => [])
		if (!resultImages?.length || !ta) return
		const markdowns = resultImages.map(item => (item.type === 'url' ? `![](${item.url})` : `![](local-image:${item.id})`)).join('\n')
		const { selectionStart, selectionEnd, value } = ta
		const prefix = value && !value.endsWith('\n') ? '\n' : ''
		const text = prefix + markdowns + '\n'
		apply(value.slice(0, selectionStart) + text + value.slice(selectionEnd), selectionStart + text.length, selectionStart + text.length)
	}

	const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
		const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
		if (!files.length) return
		e.preventDefault()
		setDragging(false)
		await insertImages(files)
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: INIT_DELAY }}
			className='bg-card flex min-h-[800px] w-[800px] flex-col rounded-[40px] border p-6 shadow'>
			<div className='mb-3 flex gap-3'>
				<input
					type='text'
					placeholder='标题'
					className='bg-card flex-1 rounded-lg border px-3 py-2 text-sm'
					value={form.title}
					onChange={e => updateForm({ title: e.target.value })}
				/>
				<input
					type='text'
					placeholder='slug（xx-xx）'
					className='bg-card w-[200px] rounded-lg border px-3 py-2 text-sm'
					value={form.slug}
					onChange={e => updateForm({ slug: e.target.value })}
				/>
			</div>

			<EditorToolbar onAction={handleAction} onTemplate={handleTemplate} words={words} savedAt={savedAt} />

			<div className='relative flex-1'>
				<textarea
					ref={textareaRef}
					placeholder='Markdown 内容'
					className={`bg-card h-[600px] w-full resize-none rounded-xl border p-4 text-sm transition-shadow ${
						dragging ? 'ring-brand/60 ring-2' : ''
					}`}
					value={form.md}
					onChange={e => updateForm({ md: e.target.value })}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					onDragOver={e => {
						if (Array.from(e.dataTransfer.items || []).some(i => i.kind === 'file')) {
							e.preventDefault()
							setDragging(true)
						}
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={handleDrop}
				/>
				{dragging && (
					<div className='border-brand/60 bg-brand/5 text-brand pointer-events-none absolute inset-0 grid place-items-center rounded-xl border-2 border-dashed text-sm'>
						松开即可插入图片
					</div>
				)}
			</div>
		</motion.div>
	)
}
