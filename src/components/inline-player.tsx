'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward, Music2 } from 'lucide-react'

type Track = {
	file: string
	title: string
	artist?: string
}

const FALLBACK: Track[] = [{ file: '/music/close-to-you.mp3', title: 'Close To You', artist: 'Carpenters' }]
const LAST_INDEX_KEY = 'inkstain:inline-track'

/**
 * 首页的内联播放器。
 *
 * 和卡片版首页的 MusicCard 不同：那个是可拖拽卡片的私有组件，
 * 这里要的是「一进来就能看见、点了就响」的一条，所以：
 *   - 不预加载音频（preload=none），点播放才开始下
 *   - 记住上次听到第几首
 *   - 进度条可点，键盘也能操作
 */
export default function InlinePlayer() {
	const [tracks, setTracks] = useState<Track[]>(FALLBACK)
	const [index, setIndex] = useState(0)
	const [playing, setPlaying] = useState(false)
	const [progress, setProgress] = useState(0)
	const [duration, setDuration] = useState(0)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		let cancelled = false
		fetch('/music/bgm/playlist.json', { cache: 'no-cache' })
			.then(r => (r.ok ? r.json() : null))
			.then((data: Track[] | null) => {
				if (cancelled || !Array.isArray(data) || data.length === 0) return
				setTracks([...data, ...FALLBACK])
				try {
					const saved = Number(localStorage.getItem(LAST_INDEX_KEY))
					if (Number.isFinite(saved) && saved >= 0 && saved < data.length) setIndex(saved)
				} catch {}
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [])

	const track = tracks[index] ?? FALLBACK[0]

	useEffect(() => {
		const a = audioRef.current
		if (!a) return
		a.load()
		if (playing) a.play().catch(() => setPlaying(false))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index])

	const toggle = useCallback(() => {
		const a = audioRef.current
		if (!a) return
		if (playing) {
			a.pause()
			setPlaying(false)
		} else {
			a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
		}
	}, [playing])

	const step = useCallback(
		(dir: 1 | -1) => {
			setIndex(i => {
				const next = (i + dir + tracks.length) % tracks.length
				try {
					localStorage.setItem(LAST_INDEX_KEY, String(next))
				} catch {}
				return next
			})
		},
		[tracks.length]
	)

	const seek = (e: React.MouseEvent<HTMLDivElement>) => {
		const a = audioRef.current
		if (!a || !a.duration) return
		const rect = e.currentTarget.getBoundingClientRect()
		const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
		a.currentTime = ratio * a.duration
		setProgress(ratio * 100)
	}

	return (
		<div className='glass-1 flex items-center gap-2.5 rounded-2xl px-3 py-3 max-sm:gap-2 max-sm:px-2.5'>
			{/* 封面位：没有封面就用图标镇住，别留空洞 */}
			<span className='bg-brand/10 text-brand-ink grid h-9 w-9 shrink-0 place-items-center rounded-xl'>
				<Music2 className='h-4 w-4' />
			</span>

			<div className='min-w-0 flex-1'>
				<div className='flex items-baseline gap-2'>
					<span className='truncate text-[12.5px] font-medium'>{track.title}</span>
					{track.artist && <span className='text-secondary truncate text-[10.5px]'>{track.artist}</span>}
				</div>

				<div
					role='slider'
					aria-label='播放进度'
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(progress)}
					tabIndex={0}
					onClick={seek}
					onKeyDown={e => {
						const a = audioRef.current
						if (!a) return
						if (e.key === 'ChevronRight') a.currentTime = Math.min(a.duration || 0, a.currentTime + 5)
						if (e.key === 'ChevronLeft') a.currentTime = Math.max(0, a.currentTime - 5)
					}}
					className='group mt-1.5 cursor-pointer py-1'>
					<div className='bg-border/60 h-[3px] w-full overflow-hidden rounded-full'>
						<div className='bg-brand h-full rounded-full transition-[width] duration-150' style={{ width: `${progress}%` }} />
					</div>
				</div>

				<div className='text-secondary mt-0.5 flex items-center gap-1.5 text-[9.5px] tabular-nums'>
					<span>{fmt((progress / 100) * (duration || 0))}</span>
					<span className='opacity-40'>/</span>
					<span>{fmt(duration)}</span>
					<span className='ml-auto'>
						{index + 1} / {tracks.length}
					</span>
				</div>
			</div>

			<div className='flex shrink-0 items-center gap-0.5 max-sm:gap-0'>
				<button type='button' aria-label='上一首' onClick={() => step(-1)} className='text-secondary hover:text-brand-ink grid h-8 w-8 place-items-center rounded-lg transition-colors max-sm:hidden'>
					<SkipBack className='h-3.5 w-3.5' />
				</button>
				<button
					type='button'
					aria-label={playing ? '暂停' : '播放'}
					onClick={toggle}
					className='bg-brand grid h-9 w-9 place-items-center rounded-full text-white transition-transform hover:scale-105 active:scale-95 motion-reduce:transform-none'>
					{playing ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4 translate-x-[1px]' />}
				</button>
				<button type='button' aria-label='下一首' onClick={() => step(1)} className='text-secondary hover:text-brand-ink grid h-8 w-8 place-items-center rounded-lg transition-colors max-sm:hidden'>
					<SkipForward className='h-3.5 w-3.5' />
				</button>
			</div>

			<audio
				ref={audioRef}
				src={track.file}
				preload='none'
				onTimeUpdate={e => {
					const a = e.currentTarget
					if (a.duration) setProgress((a.currentTime / a.duration) * 100)
				}}
				onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
				onEnded={() => step(1)}
			/>
		</div>
	)
}

function fmt(s: number) {
	if (!Number.isFinite(s) || s <= 0) return '0:00'
	const m = Math.floor(s / 60)
	const r = Math.floor(s % 60)
	return `${m}:${String(r).padStart(2, '0')}`
}