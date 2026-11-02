'use client'

import Card from '@/components/card'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Home as HomeIcon, MessageSquareText } from 'lucide-react'
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

const HomeOutline = ({ className }: { className?: string }) => <HomeIcon className={className} strokeWidth={1.7} />
const HomeFilled = ({ className }: { className?: string }) => <HomeIcon className={className} strokeWidth={1.7} fill='currentColor' fillOpacity={0.16} />

const list = [
	{
		icon: HomeOutline,
		iconActive: HomeFilled,
		label: '首页',
		href: '/'
	},
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
		href: '/starred'
	},
	{
		icon: GuestbookOutline,
		iconActive: GuestbookFilled,
		label: '留言板',
		href: '/guestbook'
	},
	{
		icon: FlaskConical,
		iconActive: FlaskConical,
		label: '实验室',
		href: '/lab'
	}
]

const extraSize = 8

export default function NavCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const [show, setShow] = useState(false)
	const { maxSM, maxLG, width: viewportW } = useSize()
	const [hoveredIndex, setHoveredIndex] = useState<number>(0)
	const { siteContent, cardStyles } = useConfigStore()
	const styles = cardStyles.navCard
	const hiCardStyles = cardStyles.hiCard

	const activeIndex = useMemo(() => {
		const index = list.findIndex(item => pathname === item.href)
		return index >= 0 ? index : undefined
	}, [pathname])

	useEffect(() => {
		setShow(true)
	}, [])

	// 杂志式首页：导航改成左侧固定停靠，不再跟拼贴中心浮动
	// （浏览器缩放会改 innerWidth，中心驱动的定位会整体漂移，撞进正文里）
	const magazine = pathname === '/' && siteContent.homeLayout === 'magazine'

	let form = useMemo(() => {
		if (pathname == '/') return 'full'
		else if (pathname == '/write') return 'mini'
		else return 'icons'
	}, [pathname])
	if (maxSM) form = 'icons'
	if (magazine && maxLG) form = 'icons'

	const itemHeight = form === 'full' ? 44 : 28
	const rowGap = form === 'full' ? 4 : 8

	let position = useMemo(() => {
		if (magazine) {
			// 与杂志首页内容容器同一套公式：宽屏时整组居中（1460 为其最大宽），窄屏贴左 24
			const outer = Math.max(0, center.x * 2 - 1460) / 2
			return { x: Math.round(outer + 24 + (styles.offsetX ?? 0)), y: 16 }
		}
		if (form === 'full') {
			const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - hiCardStyles.width / 2 - styles.width - CARD_SPACING
			const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 - styles.height
			return { x, y }
		}

		return {
			x: 24,
			y: 16
		}
	}, [form, center, styles, hiCardStyles, magazine])

	const size = useMemo<{ width: number; height?: number }>(() => {
		if (form === 'mini') return { width: 64, height: 64 }
		else if (form === 'icons') {
			// 竖屏时 8 个图标放不进 404；而且右上角有固定的主题切换按钮，
			// 宽度要给它留出位置，否则最后一个图标会被盖住。
			const avail = viewportW ? Math.min(404, viewportW - 76) : 404
			return { width: Math.max(268, avail), height: 60 }
		}
		// 竖向导航的高度交给内容自己决定：
		// 列表项会变（这一轮加了「首页」），写死高度就会让最后一项掉到玻璃底板外面。
		return { width: styles.width }
	}, [form, styles, viewportW])

	useEffect(() => {
		if (form === 'icons' && activeIndex !== undefined && hoveredIndex !== activeIndex) {
			const timer = setTimeout(() => {
				setHoveredIndex(activeIndex)
			}, 1500)
			return () => clearTimeout(timer)
		}
	}, [hoveredIndex, activeIndex, form])

	// center.x 是初始化那一刻的窗口中心，旋转屏幕或改窗口宽度后就不准了，
	// 移动端直接用实时视口宽度算，避免导航左侧跑出屏幕（cardLeft 变成负数）。
	if (maxSM) position = { x: 12, y: 10 }

	if (show)
		return (
			<HomeDraggableLayer cardKey='navCard' x={position.x} y={position.y} width={size.width} height={size.height}>
				<Card
					order={styles.order}
					width={size.width}
					height={size.height}
					x={position.x}
					y={position.y}
					className={clsx(
						'z-[70]',
						form != 'full' && 'overflow-hidden',
						form === 'mini' && 'p-3',
						form === 'icons' && 'flex items-center gap-6 p-3'
					)}>
					{form === 'full' && siteContent.enableChristmas && (
						<>
							<img
								src='/images/christmas/snow-4.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 160, left: -18, top: -20, opacity: 0.9 }}
							/>
						</>
					)}

					<Link className='flex flex-wrap items-center gap-x-2 gap-y-1' href='/' aria-label='回到首页'>
						<Image
							src='/images/avatar.png'
							alt='avatar'
							width={form === 'icons' ? 32 : 40}
							height={form === 'icons' ? 32 : 40}
							style={{ boxShadow: ' 0 12px 20px -5px #E2D9CE' }}
							className='rounded-full'
						/>
						{form === 'full' && <span className='font-averia text-xl leading-none font-medium whitespace-nowrap'>{siteContent.meta.title}</span>}
						{form === 'full' && <span className='text-brand-ink text-[11px] font-medium'>(开发中)</span>}
					</Link>

					{(form === 'full' || form === 'icons') && (
						<>
							{form !== 'icons' && <div className='text-secondary mt-4 pl-5 text-xs tracking-wider uppercase'>General</div>}

							<div className={cn('relative mt-2 space-y-1', form === 'icons' && 'mt-0 flex items-center gap-3 space-y-0 max-sm:gap-1.5')}>
								{/* 悬停高亮：原来用 motion 的 spring 滑块，改成 CSS 过渡的绝对定位块。
								    竖直列表是等高的，translate 到 hoveredIndex × 行高即可，观感一致但不下载动画库。 */}
								<div
									aria-hidden='true'
									className='pointer-events-none absolute max-w-[230px] rounded-full border transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
									style={
										form === 'icons'
											? {
													left: hoveredIndex * (itemHeight + 24) - extraSize,
													top: -extraSize,
													width: itemHeight + extraSize * 2,
													height: itemHeight + extraSize * 2,
													backgroundImage: 'linear-gradient(to right bottom, var(--color-border) 60%, var(--color-card) 100%)'
												}
											: {
													top: hoveredIndex * (itemHeight + rowGap),
													left: 0,
													width: '100%',
													height: itemHeight,
													backgroundImage: 'linear-gradient(to right bottom, var(--color-border) 60%, var(--color-card) 100%)'
												}
									}
								/>

								{list.map((item, index) => (
									<Link
												key={item.href}
												aria-current={pathname === item.href ? 'page' : undefined}
												aria-label={item.label}
												href={item.href}
										className={cn('text-secondary text-md relative z-10 flex items-center gap-3 rounded-full px-5 py-2', form === 'icons' && 'nav-icon-hit p-0')}
										onMouseEnter={() => setHoveredIndex(index)}>
										<div className='flex h-7 w-7 items-center justify-center'>
											{hoveredIndex == index ? <item.iconActive className='text-brand-ink absolute h-7 w-7' /> : <item.icon className='absolute h-7 w-7' />}
										</div>
										{form !== 'icons' && <span className={clsx(index == hoveredIndex && 'text-primary font-medium')}>{item.label}</span>}
									</Link>
								))}
							</div>
						</>
					)}
				</Card>
			</HomeDraggableLayer>
		)
}
