'use client'

import Card from '@/components/card'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { MessageSquareText } from 'lucide-react'
import { useCenterStore } from '@/hooks/use-center'
import { CARD_SPACING } from '@/consts'
import ScrollOutlineSVG from '@/svgs/scroll-outline.svg'
import ScrollFilledSVG from '@/svgs/scroll-filled.svg'
import ProjectsFilledSVG from '@/svgs/projects-filled.svg'
import ProjectsOutlineSVG from '@/svgs/projects-outline.svg'
import AboutFilledSVG from '@/svgs/about-filled.svg'
import AboutOutlineSVG from '@/svgs/about-outline.svg'
import ShareFilledSVG from '@/svgs/share-filled.svg'
import ShareOutlineSVG from '@/svgs/share-outline.svg'
import WebsiteFilledSVG from '@/svgs/website-filled.svg'
import WebsiteOutlineSVG from '@/svgs/website-outline.svg'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { useSize } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { HomeDraggableLayer } from '@/app/(home)/home-draggable-layer'

const GuestbookOutline = ({ className }: { className?: string }) => <MessageSquareText className={className} strokeWidth={1.7} />
const GuestbookFilled = ({ className }: { className?: string }) => (
	<MessageSquareText className={className} strokeWidth={1.7} fill='currentColor' fillOpacity={0.16} />
)

const list = [
	{
		icon: ScrollOutlineSVG,
		iconActive: ScrollFilledSVG,
		label: '近期文章',
		href: '/blog'
	},
	{
		icon: ProjectsOutlineSVG,
		iconActive: ProjectsFilledSVG,
		label: '我的项目',
		href: '/projects'
	},
	{
		icon: AboutOutlineSVG,
		iconActive: AboutFilledSVG,
		label: '关于网站',
		href: '/about'
	},
	{
		icon: ShareOutlineSVG,
		iconActive: ShareFilledSVG,
		label: '友链',
		href: '/share'
	},
	{
		icon: WebsiteOutlineSVG,
		iconActive: WebsiteFilledSVG,
		label: '近期关注项目',
		href: '/bloggers'
	},
	{
		icon: GuestbookOutline,
		iconActive: GuestbookFilled,
		label: '留言板',
		href: '/guestbook'
	}
]

const extraSize = 8
const COLLAPSED = 64

export default function NavCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const [show, setShow] = useState(false)
	const { maxSM } = useSize()
	const [hoveredIndex, setHoveredIndex] = useState<number>(0)
	const [expanded, setExpanded] = useState(false)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const { siteContent, cardStyles } = useConfigStore()
	const styles = cardStyles.navCard
	const hiCardStyles = cardStyles.hiCard

	const activeIndex = useMemo(() => {
		const index = list.findIndex(item => pathname === item.href)
		return index >= 0 ? index : undefined
	}, [pathname])

	useEffect(() => {
		setShow(true)
		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current)
		}
	}, [])

	let form = useMemo(() => {
		if (pathname == '/') return 'full'
		else if (pathname == '/write') return 'mini'
		else return 'icons'
	}, [pathname])
	if (maxSM) form = 'icons'

	// 触屏没有 hover，直接常驻展开
	const collapsed = !maxSM && form !== 'mini' && !expanded

	const itemHeight = form === 'full' ? 44 : 28
	const rowGap = form === 'full' ? 4 : 8

	let position = useMemo(() => {
		if (form === 'full') {
			const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - hiCardStyles.width / 2 - styles.width - CARD_SPACING
			const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 - styles.height
			return { x, y }
		}

		return {
			x: 24,
			y: 16
		}
	}, [form, center, styles, hiCardStyles])

	const size = useMemo(() => {
		if (form === 'mini') return { width: COLLAPSED, height: COLLAPSED }
		if (collapsed) return { width: COLLAPSED, height: COLLAPSED }
		else if (form === 'icons') return { width: 340, height: 64 }
		else return { width: styles.width, height: styles.height }
	}, [form, collapsed, styles])

	useEffect(() => {
		if (form === 'icons' && activeIndex !== undefined && hoveredIndex !== activeIndex) {
			const timer = setTimeout(() => {
				setHoveredIndex(activeIndex)
			}, 1500)
			return () => clearTimeout(timer)
		}
	}, [hoveredIndex, activeIndex, form])

	const open = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current)
		setExpanded(true)
	}

	const close = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current)
		// 留一点缓冲，避免手抖/斜着移出时闪回
		closeTimer.current = setTimeout(() => setExpanded(false), 260)
	}

	if (maxSM) position = { x: center.x - size.width / 2, y: 16 }

	if (show)
		return (
			<HomeDraggableLayer cardKey='navCard' x={position.x} y={position.y} width={size.width} height={size.height}>
				<Card
					order={styles.order}
					width={size.width}
					height={size.height}
					x={position.x}
					y={position.y}
					onMouseEnter={open}
					onMouseLeave={close}
					className={clsx(
						(form != 'full' || collapsed) && 'overflow-hidden',
						form === 'mini' && 'p-3',
						collapsed && '!p-0',
						!collapsed && form === 'icons' && 'flex items-center gap-6 p-3'
					)}>
					{form === 'full' && siteContent.enableChristmas && !collapsed && (
						<>
							<img
								src='/images/christmas/snow-4.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 160, left: -18, top: -20, opacity: 0.9 }}
							/>
						</>
					)}

					{/* 折叠态：只留一个头像胶囊，鼠标移入展开 */}
					{collapsed ? (
						<Link href='/' className='grid h-full w-full place-items-center' title={siteContent.meta.title}>
							<Image
								src='/images/avatar.png'
								alt='avatar'
								width={36}
								height={36}
								style={{ boxShadow: '0 10px 18px -6px #E2D9CE' }}
								className='rounded-full transition-transform duration-300 hover:scale-110'
							/>
						</Link>
					) : (
						<>
							<Link className='flex flex-wrap items-center gap-x-2 gap-y-1' href='/'>
								<Image
									src='/images/avatar.png'
									alt='avatar'
									width={form === 'icons' ? 32 : 40}
									height={form === 'icons' ? 32 : 40}
									style={{ boxShadow: ' 0 12px 20px -5px #E2D9CE' }}
									className='rounded-full'
								/>
								{form === 'full' && (
									<span className='font-averia text-xl leading-none font-medium whitespace-nowrap'>{siteContent.meta.title}</span>
								)}
								{form === 'full' && <span className='text-brand text-[11px] font-medium'>(开发中)</span>}
							</Link>

							{(form === 'full' || form === 'icons') && (
								<>
									{form !== 'icons' && <div className='text-secondary mt-4 text-xs uppercase tracking-wider'>General</div>}

									<div className={cn('relative mt-2 space-y-1', form === 'icons' && 'mt-0 flex items-center gap-6 space-y-0')}>
										<motion.div
											className='absolute max-w-[230px] rounded-full border'
											layoutId='nav-hover'
											initial={false}
											animate={
												form === 'icons'
													? {
															left: hoveredIndex * (itemHeight + 24) - extraSize,
															top: -extraSize,
															width: itemHeight + extraSize * 2,
															height: itemHeight + extraSize * 2
														}
													: { top: hoveredIndex * (itemHeight + rowGap), left: 0, width: '100%', height: itemHeight }
											}
											transition={{
												type: 'spring',
												stiffness: 400,
												damping: 30
											}}
											style={{ backgroundImage: 'linear-gradient(to right bottom, var(--color-border) 60%, var(--color-card) 100%)' }}
										/>

										{list.map((item, index) => (
											<Link
												key={item.href}
												href={item.href}
												className={cn('text-secondary text-md relative z-10 flex items-center gap-3 rounded-full px-5 py-2', form === 'icons' && 'p-0')}
												onMouseEnter={() => setHoveredIndex(index)}>
												<div className='flex h-7 w-7 items-center justify-center'>
													{hoveredIndex == index ? <item.iconActive className='text-brand absolute h-7 w-7' /> : <item.icon className='absolute h-7 w-7' />}
												</div>
												{form !== 'icons' && <span className={clsx(index == hoveredIndex && 'text-primary font-medium')}>{item.label}</span>}
											</Link>
										))}
									</div>
								</>
							)}
						</>
					)}
				</Card>
			</HomeDraggableLayer>
		)
}
