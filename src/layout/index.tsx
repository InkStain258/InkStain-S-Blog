'use client'
import { PropsWithChildren, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useCenterInit } from '@/hooks/use-center'
import BlurredBubblesBackground from './backgrounds/blurred-bubbles'
import NavCard from '@/components/nav-card'
import { Toaster } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useSize, useSizeInit } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import BackToTop from '@/components/back-to-top'
import ProseImageEnhancer from '@/components/prose-image-enhancer'
import CodeBlockEnhancer from '@/components/code-block-enhancer'
import RandomRoam from '@/components/random-roam'
import MusicCard from '@/components/music-card'
import SplashScreen from '@/components/splash-screen'
import PageTransition from '@/components/page-transition'
import WeatherWidget from '@/components/weather-widget'
import ThemeToggle from '@/components/theme-toggle'
import ReadingProgress from '@/components/reading-progress'
import ImageLightbox from '@/components/image-lightbox'
import SiteFooter from './site-footer'
import { useTheme } from '@/hooks/use-theme'
import { usePathname } from 'next/navigation'

// 纯氛围装饰：拆成独立 chunk，等浏览器空闲再挂载，不占首屏
const ClickEffect = dynamic(() => import('@/components/click-effect'), { ssr: false })
const Fireflies = dynamic(() => import('@/components/fireflies'), { ssr: false })
const SakuraPetals = dynamic(() => import('@/components/sakura-petals'), { ssr: false })
const DanmakuBackground = dynamic(() => import('@/components/danmaku-bg'), { ssr: false })
const CursorGlow = dynamic(() => import('@/components/cursor-glow'), { ssr: false })

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useSizeInit()
	const { cardStyles, siteContent, regenerateKey } = useConfigStore()
	const { maxSM } = useSize()
	const { theme } = useTheme()
	const isDark = theme === 'dark'
	const pathname = usePathname()
	const isHome = pathname === '/'

	// 浏览器空闲后再启动装饰层，首屏只渲染内容
	const [idle, setIdle] = useState(false)
	useEffect(() => {
		const w = window as any
		if (typeof w.requestIdleCallback === 'function') {
			const id = w.requestIdleCallback(() => setIdle(true), { timeout: 2500 })
			return () => w.cancelIdleCallback?.(id)
		}
		const t = setTimeout(() => setIdle(true), 1200)
		return () => clearTimeout(t)
	}, [])

	const backgroundImages = (siteContent.backgroundImages ?? []) as Array<{ id: string; url: string }>
	const currentBackgroundImageId = siteContent.currentBackgroundImageId
	const currentBackgroundImage =
		currentBackgroundImageId && currentBackgroundImageId.trim() ? backgroundImages.find(item => item.id === currentBackgroundImageId) : null

	return (
		<>
			<SplashScreen />
			{idle && <ClickEffect />}
			<ThemeToggle />
			<ReadingProgress />
			<ImageLightbox />
			{idle && <CursorGlow />}

			{/* Sakura only in light mode; Fireflies only in dark mode */}
			{idle && !isDark && <SakuraPetals />}
			{idle && isDark && <Fireflies />}

			{idle && <DanmakuBackground />}

			<Toaster
				position='bottom-right'
				richColors
				icons={{
					success: <CircleCheckIcon className='size-4' />,
					info: <InfoIcon className='size-4' />,
					warning: <TriangleAlertIcon className='size-4' />,
					error: <OctagonXIcon className='size-4' />,
					loading: <Loader2Icon className='size-4 animate-spin' />
				}}
				style={{ '--border-radius': '12px' } as React.CSSProperties}
			/>
			{currentBackgroundImage && (
				<div
					className='fixed inset-0 z-0 overflow-hidden'
					style={{
						backgroundImage: `url(${currentBackgroundImage.url})`,
						backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
					}}
				/>
			)}
			<BlurredBubblesBackground colors={siteContent.backgroundColors} regenerateKey={regenerateKey} />

			<main className='relative z-10 h-full'>
				<ProseImageEnhancer />
				<CodeBlockEnhancer />
				<RandomRoam />
				<PageTransition>{children}</PageTransition>
				<SiteFooter />
				<NavCard />
				{!maxSM && cardStyles.musicCard?.enabled !== false && <MusicCard />}
				{!maxSM && isHome && (
					<div className="fixed bottom-6 left-6 z-40 w-36">
						<WeatherWidget />
					</div>
				)}
			</main>

			<BackToTop />
		</>
	)
}
