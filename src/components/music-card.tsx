'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from '../app/(home)/stores/config-store'
import { CARD_SPACING } from '@/consts'
import { HomeDraggableLayer } from '../app/(home)/home-draggable-layer'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

type Track = {
	file: string
	title: string
	artist?: string
	license?: string
	source?: string
	duration?: number
}

const FALLBACK: Track[] = [{ file: '/music/close-to-you.mp3', title: 'Close To You', artist: 'Carpenters' }]
const LAST_INDEX_KEY = 'ink-music-index'

export default function MusicCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.musicCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard
	const calendarCardStyles = cardStyles.calendarCard

	const [tracks, setTracks] = useState<Track[]>(FALLBACK)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [progress, setProgress] = useState(0)

	const audioRef = useRef<HTMLAudioElement | null>(null)
	const currentIndexRef = useRef(0)
	const barsRef = useRef<Array<HTMLSpanElement | null>>([])
	const audioCtxRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const rafRef = useRef(0)

	const isHomePage = pathname === '/'

	// 加载播放列表
	useEffect(() => {
		let cancelled = false
		fetch('/music/bgm/playlist.json', { cache: 'no-cache' })
			.then(r => (r.ok ? r.json() : null))
			.then((data: Track[] | null) => {
				if (cancelled || !Array.isArray(data) || data.length === 0) return
				const list = [...data, ...FALLBACK]
				setTracks(list)
				try {
					const saved = Number(localStorage.getItem(LAST_INDEX_KEY))
					if (Number.isFinite(saved) && saved > 0 && saved < list.length) {
						currentIndexRef.current = saved
						setCurrentIndex(saved)
					}
				} catch {}
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [])

	const position = useMemo(() => {
		if (!isHomePage) {
			return {
				x: center.width - styles.width - 16,
				y: center.height - styles.height - 16
			}
		}
		return {
			x: styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2 - styles.offset,
			y: styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset + CARD_SPACING + calendarCardStyles.height + CARD_SPACING
		}
	}, [isPlaying, isHomePage, center, styles, hiCardStyles, clockCardStyles, calendarCardStyles])

	const { x, y } = position

	// 频谱可视化
	const startVisualizer = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return

		if (!audioCtxRef.current) {
			try {
				const AC = window.AudioContext || (window as any).webkitAudioContext
				const ctx = new AC()
				const source = ctx.createMediaElementSource(audio)
				const analyser = ctx.createAnalyser()
				analyser.fftSize = 64
				analyser.smoothingTimeConstant = 0.75
				source.connect(analyser)
				analyser.connect(ctx.destination)
				audioCtxRef.current = ctx
				analyserRef.current = analyser
			} catch {
				return
			}
		}

		audioCtxRef.current?.resume().catch(() => {})
		const analyser = analyserRef.current
		if (!analyser) return

		const buffer = new Uint8Array(analyser.frequencyBinCount)
		const loop = () => {
			analyser.getByteFrequencyData(buffer)
			for (let i = 0; i < barsRef.current.length; i++) {
				const bar = barsRef.current[i]
				if (!bar) continue
				const v = buffer[i * 2] || 0
				bar.style.height = `${(18 + (v / 255) * 82).toFixed(0)}%`
				bar.style.opacity = `${(0.45 + (v / 255) * 0.55).toFixed(2)}`
			}
			rafRef.current = requestAnimationFrame(loop)
		}
		cancelAnimationFrame(rafRef.current)
		rafRef.current = requestAnimationFrame(loop)
	}, [])

	const stopVisualizer = useCallback(() => {
		cancelAnimationFrame(rafRef.current)
		for (const bar of barsRef.current) {
			if (bar) {
				bar.style.height = '22%'
				bar.style.opacity = '0.35'
			}
		}
	}, [])

	// 初始化音频事件
	useEffect(() => {
		if (!audioRef.current) audioRef.current = new Audio()
		const audio = audioRef.current
		audio.preload = 'metadata'

		const onTime = () => {
			if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
		}
		const onEnded = () => {
			const nextIndex = (currentIndexRef.current + 1) % (currentIndexRef.current >= 0 ? tracks.length : 1)
			currentIndexRef.current = nextIndex
			setCurrentIndex(nextIndex)
			setProgress(0)
		}
		const onLoaded = () => onTime()

		audio.addEventListener('timeupdate', onTime)
		audio.addEventListener('ended', onEnded)
		audio.addEventListener('loadedmetadata', onLoaded)
		return () => {
			audio.removeEventListener('timeupdate', onTime)
			audio.removeEventListener('ended', onEnded)
			audio.removeEventListener('loadedmetadata', onLoaded)
		}
	}, [tracks.length])

	// 切歌
	useEffect(() => {
		currentIndexRef.current = currentIndex
		const audio = audioRef.current
		if (!audio) return
		const wasPlaying = !audio.paused
		audio.pause()
		audio.src = tracks[currentIndex]?.file || ''
		setProgress(0)
		try {
			localStorage.setItem(LAST_INDEX_KEY, String(currentIndex))
		} catch {}
		if (wasPlaying) audio.play().catch(() => {})
	}, [currentIndex, tracks])

	// 播放 / 暂停
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		if (isPlaying) {
			audio.play().catch(() => setIsPlaying(false))
			startVisualizer()
		} else {
			audio.pause()
			stopVisualizer()
		}
	}, [isPlaying, startVisualizer, stopVisualizer])

	// 卸载清理
	useEffect(() => {
		return () => {
			cancelAnimationFrame(rafRef.current)
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.src = ''
			}
			audioCtxRef.current?.close().catch(() => {})
		}
	}, [])

	const next = () => {
		setCurrentIndex(i => (i + 1) % tracks.length)
		if (!isPlaying) setIsPlaying(true)
	}

	const prev = () => {
		const audio = audioRef.current
		if (audio && audio.currentTime > 3) {
			audio.currentTime = 0
			return
		}
		setCurrentIndex(i => (i - 1 + tracks.length) % tracks.length)
		if (!isPlaying) setIsPlaying(true)
	}

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		const audio = audioRef.current
		if (!audio || !audio.duration) return
		const rect = e.currentTarget.getBoundingClientRect()
		const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
		audio.currentTime = ratio * audio.duration
		setProgress(ratio * 100)
	}

	const track = tracks[currentIndex] || FALLBACK[0]

	if (!isHomePage && !isPlaying) return null

	return (
		<HomeDraggableLayer cardKey='musicCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card
				order={styles.order}
				width={styles.width}
				height={styles.height}
				x={x}
				y={y}
				className={clsx('flex items-center gap-2 !p-3', !isHomePage && 'fixed')}>
				{siteContent.enableChristmas && (
					<>
						<img
							src='/images/christmas/snow-10.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 120, left: -8, top: -12, opacity: 0.8 }}
						/>
						<img
							src='/images/christmas/snow-11.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 80, right: -10, top: -12, opacity: 0.8 }}
						/>
					</>
				)}

				{/* 频谱条 */}
				<div className='flex h-8 w-7 shrink-0 items-end justify-center gap-[2px]'>
					{[0, 1, 2, 3, 4].map(i => (
						<span
							key={i}
							ref={el => {
								barsRef.current[i] = el
							}}
							className='bg-brand w-[3px] rounded-full transition-[height] duration-100 ease-out'
							style={{ height: '22%', opacity: 0.35 }}
						/>
					))}
				</div>

				<div className='min-w-0 flex-1'>
					<div className='truncate text-[12px] leading-tight font-medium' title={`${track.title}${track.artist ? ' — ' + track.artist : ''}`}>
						{track.title}
					</div>
					<div className='text-secondary mt-0.5 truncate text-[10px] leading-tight'>{track.artist || '未知艺术家'}</div>
					<div className='mt-1.5 h-1.5 cursor-pointer rounded-full bg-white/60 dark:bg-white/10' onClick={handleSeek} title='点击跳转'>
						<div className='bg-linear h-full rounded-full transition-[width] duration-200' style={{ width: `${progress}%` }} />
					</div>
				</div>

				<div className='flex shrink-0 items-center gap-0.5'>
					<button onClick={prev} className='text-secondary hover:text-brand grid h-6 w-6 place-items-center rounded-full transition-colors' title='上一首'>
						<SkipBack className='h-3.5 w-3.5' />
					</button>
					<button
						onClick={() => setIsPlaying(v => !v)}
						className='bg-brand/90 hover:bg-brand grid h-8 w-8 place-items-center rounded-full text-white shadow-sm transition-transform active:scale-95'
						title={isPlaying ? '暂停' : '播放'}>
						{isPlaying ? <Pause className='h-3.5 w-3.5' /> : <Play className='ml-0.5 h-3.5 w-3.5' />}
					</button>
					<button onClick={next} className='text-secondary hover:text-brand grid h-6 w-6 place-items-center rounded-full transition-colors' title='下一首'>
						<SkipForward className='h-3.5 w-3.5' />
					</button>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
