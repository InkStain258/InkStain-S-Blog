'use client'

import { useWriteStore } from './stores/write-store'
import { usePreviewStore } from './stores/preview-store'
import { WriteEditor } from './components/editor'
import { WriteSidebar } from './components/sidebar'
import { WriteActions } from './components/actions'
import { WritePreview } from './components/preview'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { loadDraft, clearDraft } from '@/lib/draft'

export default function WritePage() {
	const { form, cover, reset, setForm } = useWriteStore()
	const { isPreview, closePreview } = usePreviewStore()
	const restored = useRef(false)

	// 进入新建页：先重置，再尝试恢复本地草稿
	useEffect(() => {
		reset()
		if (restored.current) return
		restored.current = true

		const draft = loadDraft()
		if (!draft) return

		setForm({
			slug: draft.slug || '',
			title: draft.title || '',
			md: draft.md || '',
			tags: draft.tags || [],
			date: draft.date || '',
			summary: draft.summary || '',
			hidden: draft.hidden || false,
			category: draft.category || ''
		})

		toast('已恢复上次未发布的草稿', {
			action: {
				label: '丢弃',
				onClick: () => {
					clearDraft()
					reset()
					toast.success('草稿已清除')
				}
			},
			duration: 8000
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	return isPreview ? (
		<WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} />
	) : (
		<>
			<div className='flex h-full justify-center gap-6 px-6 pt-24 pb-12'>
				<WriteEditor />
				<WriteSidebar />
			</div>

			<WriteActions />
		</>
	)
}
