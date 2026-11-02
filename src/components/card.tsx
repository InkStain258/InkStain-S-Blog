'use client'

import { ANIMATION_DELAY } from '@/consts'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useSize } from '@/hooks/use-size'

interface Props {
	className?: string
	order: number
	width: number
	height?: number
	x: number
	y: number
	children: React.ReactNode
	onMouseEnter?: () => void
	onMouseLeave?: () => void
}

export default function Card({ children, order, width, height, x, y, className, onMouseEnter, onMouseLeave }: Props) {
	const { maxSM, init } = useSize()
	let [show, setShow] = useState(false)
	if (maxSM && init) order = 0

	useEffect(() => {
		if (show) return
		if (x === 0 && y === 0) return
		setTimeout(
			() => {
				setShow(true)
			},
			order * ANIMATION_DELAY * 1000
		)
	}, [x, y, show])

	if (show)
		return (
			<div
				className={cn('card squircle ink-card-in', className)}
				style={{ left: x, top: y, width, height }}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}>
				{children}
			</div>
		)

	return null
}
