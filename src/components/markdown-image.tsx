'use client'

import { useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import { SmartImage } from '@/components/smart-image'

type MarkdownImageProps = {
	src: string
	alt?: string
	title?: string
}

export function MarkdownImage({ src, alt = '', title = '' }: MarkdownImageProps) {
	const [display, setDisplay] = useState(false)

	return (
		<>
			<SmartImage src={src} alt={alt} title={title} sizes='(max-width: 900px) 92vw, 760px' onClick={() => setDisplay(true)} className='cursor-pointer transition-opacity hover:opacity-80' />
			<DialogModal open={display} onClose={() => setDisplay(false)} className='max-w-none bg-transparent p-0'>
				<img src={src} alt={alt} loading='lazy' decoding='async' className='max-h-[90vh] max-w-full rounded-2xl object-contain' />
			</DialogModal>
		</>
	)
}
