'use client'

import { useState } from 'react'

import { type LogoItem } from './components/logo-upload-dialog'
import { ShareCard, type Share } from './components/share-card'

interface GridViewProps {
	shares: Share[]
	isEditMode?: boolean
	onUpdate?: (share: Share, oldShare: Share, logoItem?: LogoItem) => void
	onDelete?: (share: Share) => void
}

export default function GridView({ shares, isEditMode = false, onUpdate, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')

	const allTags = Array.from(new Set(shares.flatMap(share => share.tags)))

	const filteredShares = shares.filter(share => {
		const matchesSearch = share.name.toLowerCase().includes(searchTerm.toLowerCase()) || share.description.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesTag = selectedTag === 'all' || share.tags.includes(selectedTag)
		return matchesSearch && matchesTag
	})

	return (
		<div className='mx-auto w-full max-w-7xl px-6 pt-24 pb-12'>
			<header className='mb-8'>
				<div className='border-border/60 flex items-center justify-between border-b pb-3'>
					<span className='text-brand-ink text-[10.5px] tracking-[0.3em] uppercase'>Links</span>
					<span className='text-secondary text-[10.5px] tabular-nums'>{shares.length} 个</span>
				</div>
				<h1 className='mt-5 text-[27px] leading-[1.3] font-semibold tracking-[-0.015em] max-sm:text-[23px]'>友链</h1>
				<p className='text-secondary mt-2 max-w-[520px] text-[12.5px] leading-[1.9]'>
					大家走个面儿，多看看这些，比我的垃圾更有趣
				</p>
			</header>

			<div className='mb-8 space-y-4'>
				<input
					type='text'
					placeholder='搜索资源...'
					aria-label='搜索友链'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='focus:ring-brand block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none'
				/>

				<div className='flex flex-wrap justify-start gap-2'>
					<button
						onClick={() => setSelectedTag('all')}
						className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
							selectedTag === 'all' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}>
						全部
					</button>
					{allTags.map(tag => (
						<button
							key={tag}
							onClick={() => setSelectedTag(tag)}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedTag === tag ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							{tag}
						</button>
					))}
				</div>
			</div>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{filteredShares.map(share => (
					<ShareCard key={share.url} share={share} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(share)} />
				))}
			</div>

			{filteredShares.length === 0 && (
				<div className='mt-12 text-center text-gray-500'>
					<p>没有找到相关资源</p>
				</div>
			)}
		</div>
	)
}
