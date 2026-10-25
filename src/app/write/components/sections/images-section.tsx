'use client'

import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Copy, Trash2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWriteStore } from '../../stores/write-store'
import { formatBytes } from '@/lib/image-compress'
import Link from 'next/link'

type ImagesSectionProps = {
	delay?: number
}

export function ImagesSection({ delay = 0 }: ImagesSectionProps) {
	const { images, cover, addUrlImage, addFiles, deleteImage } = useWriteStore()
	const [urlInput, setUrlInput] = useState<string>('')
	const [busy, setBusy] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const coverId = cover?.id ?? null
	const fileImages = images.filter(i => i.type === 'file')
	const totalBytes = fileImages.reduce((sum, i) => sum + (i.type === 'file' ? i.file.size : 0), 0)

	const handleAddFiles = async (files: FileList | File[]) => {
		setBusy(true)
		try {
			const added = await addFiles(files)
			if (added.length) {
				const kb = added.reduce((s, i) => s + (i.type === 'file' ? i.file.size : 0), 0)
				toast.success(`已添加 ${added.length} 张，压缩后 ${formatBytes(kb)}`)
			}
		} finally {
			setBusy(false)
		}
	}

	const copyMd = async (md: string) => {
		try {
			await navigator.clipboard.writeText(md)
			toast.success('已复制 Markdown')
		} catch {
			toast.error('复制失败，请手动选择')
		}
	}

	return (
		<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }} className='card relative'>
			<div className='flex items-center justify-between'>
				<h2 className='text-sm'>
					图片管理
					{fileImages.length > 0 && <span className='text-secondary ml-2 text-[11px]'>共 {formatBytes(totalBytes)}</span>}
				</h2>
				<Link href='/image-toolbox' target='_blank' className='text-xs hover:underline'>
					压缩工具
				</Link>
			</div>

			<div className='mt-3 flex items-center gap-2'>
				<input
					type='text'
					placeholder='粘贴图片链接 https://...'
					className='bg-card flex-1 rounded-lg border px-3 py-2 text-sm'
					value={urlInput}
					onChange={e => setUrlInput(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter') {
							const v = urlInput.trim()
							if (v) {
								addUrlImage(v)
								setUrlInput('')
							}
						}
					}}
				/>
				<button
					className='flex items-center gap-1 rounded-lg border bg-white/70 px-3 py-2 text-sm transition-colors hover:bg-white dark:bg-white/10 dark:hover:bg-white/20'
					onClick={() => {
						const v = urlInput.trim()
						if (!v) return
						addUrlImage(v)
						setUrlInput('')
					}}>
					<Link2 className='h-3.5 w-3.5' />
					添加
				</button>
			</div>

			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				multiple
				className='hidden'
				onChange={e => {
					const files = e.target.files
					if (files && files.length > 0) handleAddFiles(files)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='mt-3 grid grid-cols-4 gap-2'>
				{/* 上传格子 */}
				<div
					className='group bg-card hover:border-brand/50 relative grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed transition-colors'
					onClick={() => !busy && fileInputRef.current?.click()}
					onDragOver={e => e.preventDefault()}
					onDrop={e => {
						e.preventDefault()
						const files = e.dataTransfer.files
						if (files && files.length) handleAddFiles(files)
					}}>
					{busy ? (
						<span className='text-secondary animate-pulse text-[10px]'>压缩中…</span>
					) : (
						<span className='text-2xl leading-none text-neutral-400 group-hover:text-brand transition-colors'>+</span>
					)}
				</div>

				{images.map(item => {
					const isUrl = item.type === 'url'
					const src = isUrl ? item.url : item.previewUrl
					const markdown = isUrl ? `![](${item.url})` : `![](local-image:${item.id})`
					const isCover = coverId === item.id
					const size = item.type === 'file' ? item.file.size : 0

					return (
						<div
							key={item.id}
							className={`group relative aspect-square overflow-hidden rounded-lg border bg-white/50 text-xs dark:bg-white/5 ${isCover ? 'ring-brand ring-2' : ''}`}>
							<img
								src={src}
								className='h-full w-full cursor-grab object-cover active:cursor-grabbing'
								draggable
								onDragStart={e => {
									e.dataTransfer.setData('text/plain', markdown)
									e.dataTransfer.setData('text/markdown', markdown)
								}}
								onClick={() => copyMd(markdown)}
								title='单击复制 Markdown，或拖入编辑器'
							/>
							{isCover && <div className='bg-brand absolute top-1 left-1 rounded-md px-1.5 py-0.5 text-[10px] text-white shadow'>封面</div>}
							{size > 0 && (
								<div className='pointer-events-none absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100'>
									{formatBytes(size)}
								</div>
							)}
							<div className='absolute top-1 right-1 hidden gap-1 group-hover:flex'>
								<button
									type='button'
									title='复制 Markdown'
									className='grid h-6 w-6 place-items-center rounded-md bg-white/85 shadow hover:bg-white dark:bg-black/50 dark:hover:bg-black/70'
									onClick={() => copyMd(markdown)}>
									<Copy className='h-3 w-3' />
								</button>
								<button
									type='button'
									title='删除'
									className='grid h-6 w-6 place-items-center rounded-md bg-white/85 text-red-500 shadow hover:bg-white dark:bg-black/50 dark:hover:bg-black/70'
									onClick={() => deleteImage(item.id)}>
									<Trash2 className='h-3 w-3' />
								</button>
							</div>
						</div>
					)
				})}
			</div>

			<p className='text-secondary mt-2 text-[10px] leading-relaxed opacity-70'>拖入图片自动压缩为 WebP；单击缩略图或拖到编辑器即可插入。</p>
		</motion.div>
	)
}
