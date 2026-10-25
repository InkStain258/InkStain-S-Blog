'use client'
import { PropsWithChildren } from 'react'
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
import MusicCard from '@/components/music-card'
import SplashScreen from '@/components/splash-screen'
import PageTransition from '@/components/page-transition'
import ClickEffect from '@/components/click-effect'
import Fireflies from '@/components/fireflies'
import SakuraPetals from '@/components/sakura-petals'
import DanmakuBackground from '@/components/danmaku-bg'
import WeatherWidget from '@/components/weather-widget'
import ThemeToggle from '@/components/theme-toggle'
import ReadingProgress from '@/components/reading-progress'
import CursorGlow from '@/components/cursor-glow'
import ImageLightbox from '@/components/image-lightbox'
import SiteFooter from './site-footer'
import { useTheme } from '@/hooks/use-theme'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useSizeInit()
	const { cardStyles, siteContent, regenerateKey } = useConfigStore()
	const { maxSM } = useSize()
	const { theme } = useTheme()
	const isDark = theme === 'dark'
	const pathname = usePathname()
	const isHome = pathname === '/'

	const backgroundImages = (siteContent.backgroundImages ?? []) as Array<{ id: string; url: string }>
	const currentBackgroundImageId = siteContent.currentBackgroundImageId
	const currentBackgroundImage =
		currentBackgroundImageId && currentBackgroundImageId.trim() ? backgroundImages.find(item => item.id === currentBackgroundImageId) : null

	return (
		<>
			<SplashScreen />
			<ClickEffect />
			<ThemeToggle />
			<ReadingProgress />
			<ImageLightbox />
			<CursorGlow />

			{/* Sakura only in light mode; Fireflies only in dark mode */}
			{!isDark && <SakuraPetals />}
			{isDark && <Fireflies />}

			<DanmakuBackground />

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
