'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useCenterStore } from '@/hooks/use-center'
import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import Link from 'next/link'

type Greeting = { en: string; zh: string; icon: string }

function getGreeting(): Greeting {
	const hour = new Date().getHours()

	if (hour >= 5 && hour < 9) return { en: 'Good Morning', zh: '清晨好', icon: '🌅' }
	if (hour >= 9 && hour < 12) return { en: 'Good Morning', zh: '上午好', icon: '☀️' }
	if (hour >= 12 && hour < 14) return { en: 'Good Noon', zh: '午间好', icon: '🍚' }
	if (hour >= 14 && hour < 18) return { en: 'Good Afternoon', zh: '下午好', icon: '🌤️' }
	if (hour >= 18 && hour < 22) return { en: 'Good Evening', zh: '晚上好', icon: '🌆' }
	if (hour >= 22 && hour < 24) return { en: 'Good Night', zh: '夜深了', icon: '🌙' }
	return { en: 'Late Night', zh: '还没睡？', icon: '✨' }
}

export default function HiCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const greeting = getGreeting()
	const styles = cardStyles.hiCard
	const username = siteContent.meta.username || 'InkStain'

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - styles.height / 2

	// 3D 倾斜：鼠标位置映射成轻微旋转，移出后回弹
	const ref = useRef<HTMLDivElement>(null)
	const px = useMotionValue(0)
	const py = useMotionValue(0)
	const rx = useSpring(useTransform(py, [-1, 1], [7, -7]), { stiffness: 220, damping: 22 })
	const ry = useSpring(useTransform(px, [-1, 1], [-9, 9]), { stiffness: 220, damping: 22 })
	const [hovering, setHovering] = useState(false)

	const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const el = ref.current
		if (!el) return
		const r = el.getBoundingClientRect()
		px.set(((e.clientX - r.left) / r.width - 0.5) * 2)
		py.set(((e.clientY - r.top) / r.height - 0.5) * 2)
	}

	const reset = () => {
		px.set(0)
		py.set(0)
		setHovering(false)
	}

	return (
		<HomeDraggableLayer cardKey='hiCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='relative text-center max-sm:static max-sm:translate-0'>
				<div
					ref={ref}
					onMouseMove={onMove}
					onMouseEnter={() => setHovering(true)}
					onMouseLeave={reset}
					className='relative h-full w-full'
					style={{ perspective: 900 }}>
					{siteContent.enableChristmas && (
						<>
							<img
								src='/images/christmas/snow-1.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 180, left: -20, top: -25, opacity: 0.9 }}
							/>
							<img
								src='/images/christmas/snow-2.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 160, bottom: -12, right: -8, opacity: 0.9 }}
							/>
						</>
					)}

					<motion.div
						style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
						animate={{ y: hovering ? -3 : 0 }}
						transition={{ type: 'spring', stiffness: 260, damping: 24 }}
						className='flex h-full w-full flex-col items-center justify-center'>
						<Link href='/live2d' style={{ transform: 'translateZ(38px)' }}>
							<img
								src='/images/avatar.png'
								className='mx-auto rounded-full transition-shadow duration-300'
								style={{ width: 120, height: 120, boxShadow: hovering ? '0 24px 46px -10px #E2D9CE' : '0 16px 32px -5px #E2D9CE' }}
							/>
						</Link>

						<h1 className='font-averia mt-3 text-2xl' style={{ transform: 'translateZ(18px)' }}>
							<span className='text-secondary/80 mr-1 align-middle text-lg'>{greeting.icon}</span>
							{greeting.en} <br /> I'm <span className='text-linear text-[32px]'>{username}</span> , Nice to <br /> meet you!
						</h1>

						<motion.p
							className='text-secondary mt-2 text-[11px] tracking-wide'
							style={{ transform: 'translateZ(10px)' }}
							animate={{ opacity: hovering ? 1 : 0.45 }}
							transition={{ duration: 0.3 }}>
							{greeting.zh} · 现在 {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
						</motion.p>
					</motion.div>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
