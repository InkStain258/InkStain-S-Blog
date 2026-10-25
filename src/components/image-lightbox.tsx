'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'

const MIN_SCALE = 1
const MAX_SCALE = 6

/**
 * 图片灯箱：点击正文中的图片全屏放大。
 * 支持滚轮缩放、拖拽平移、双击复位、键盘 +/-/0、Esc 关闭。
 * 只作用于 .prose 内的图片，不影响头像、封面等装饰图。
 */
export default function ImageLightbox() {
	const [src, setSrc] = useState<string | null>(null)
	const [scale, setScale] = useState(1)
	const [offset, setOffset] = useState({ x: 0, y: 0 })
	const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

	const reset = () => {
		setScale(1)
		setOffset({ x: 0, y: 0 })
	}

	const close = () => {
		setSrc(null)
		reset()
	}

	const zoomBy = (factor: number) => {
		setScale(s => {
			const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor))
			if (next === 1) setOffset({ x: 0, y: 0 })
			return next
		})
	}

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null
			if (!target || target.tagName !== 'IMG') return
			if (!target.closest('.prose')) return
			const img = target as HTMLImageElement
			// 内容图才放大，图标/表情/加载失败图跳过
			if (img.naturalWidth < 120) return
			e.preventDefault()
			setSrc(img.currentSrc || img.src)
		}
		document.addEventListener('click', onClick)
		return () => document.removeEventListener('click', onClick)
	}, [])

	useEffect(() => {
		if (!src) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close()
			else if (e.key === '+' || e.key === '=') zoomBy(1.25)
			else if (e.key === '-' || e.key === '_') zoomBy(0.8)
			else if (e.key === '0') reset()
		}
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		window.addEventListener('keydown', onKey)
		return () => {
			document.body.style.overflow = prevOverflow
			window.removeEventListener('keydown', onKey)
		}
	}, [src])

	// 缩放时用 wheel 需要 passive: false 才能阻止页面滚动
	useEffect(() => {
		if (!src) return
		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			zoomBy(e.deltaY < 0 ? 1.12 : 0.89)
		}
		window.addEventListener('wheel', onWheel, { passive: false })
		return () => window.removeEventListener('wheel', onWheel)
	}, [src])

	if (!src) return null

	const dragging = !!dragRef.current

	return (
		<div
			className='fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/85 p-6 backdrop-blur-md'
			style={{ animation: 'lb-fade 220ms ease-out', cursor: dragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in' }}
			onClick={close}
			onPointerMove={e => {
				const d = dragRef.current
				if (!d) return
				setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) })
			}}
			onPointerUp={() => {
				dragRef.current = null
			}}
			onPointerLeave={() => {
				dragRef.current = null
			}}>
			<img
				src={src}
				alt=''
				draggable={false}
				className='max-h-full max-w-full rounded-xl shadow-2xl select-none'
				style={{
					animation: 'lb-zoom 280ms cubic-bezier(0.2, 0.9, 0.3, 1)',
					transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
					transition: dragRef.current ? 'none' : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'
				}}
				onClick={e => e.stopPropagation()}
				onDoubleClick={e => {
					e.stopPropagation()
					if (scale > 1) reset()
					else setScale(2.2)
				}}
				onPointerDown={e => {
					if (scale <= 1) return
					e.stopPropagation()
					dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
				}}
			/>

			<button
				type='button'
				onClick={e => {
					e.stopPropagation()
					close()
				}}
				aria-label='关闭'
				className='absolute top-6 right-6 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25'>
				<X className='h-5 w-5' />
			</button>

			{/* 缩放控件 */}
			<div
				className='absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 px-2 py-1.5 text-white/85 backdrop-blur'
				onClick={e => e.stopPropagation()}>
				<button type='button' onClick={() => zoomBy(0.8)} aria-label='缩小' className='grid h-8 w-8 place-items-center rounded-full hover:bg-white/15'>
					<Minus className='h-4 w-4' />
				</button>
				<span className='w-12 text-center text-[11px] tabular-nums'>{Math.round(scale * 100)}%</span>
				<button type='button' onClick={() => zoomBy(1.25)} aria-label='放大' className='grid h-8 w-8 place-items-center rounded-full hover:bg-white/15'>
					<Plus className='h-4 w-4' />
				</button>
				<button
					type='button'
					onClick={reset}
					aria-label='复位'
					className='grid h-8 w-8 place-items-center rounded-full hover:bg-white/15 disabled:opacity-30'
					disabled={scale === 1 && offset.x === 0 && offset.y === 0}>
					<RotateCcw className='h-3.5 w-3.5' />
				</button>
			</div>

			<div className='pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-center text-xs whitespace-nowrap text-white/70 backdrop-blur'>
				滚轮缩放 · 放大后拖拽移动 · 双击复位 · Esc 关闭
			</div>
		</div>
	)
}
