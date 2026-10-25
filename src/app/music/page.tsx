'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, ExternalLink, Music2 } from 'lucide-react'
import { INIT_DELAY } from '@/consts'

type Track = {
	file: string
	title: string
	artist?: string
	license?: string
	source?: string
	duration?: number
	genre?: string
}

function fmt(sec?: number) {
	if (!sec) return '--:--'
	return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`
}

function licenseLabel(url?: string) {
	if (!url) return '未标注'
	if (url.includes('publicdomain/zero')) return 'CC0'
	if (url.includes('publicdomain')) return '公有领域'
	const m = url.match(/licenses\/([a-z-]+)\/([\d.]+)/)
	if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`
	return 'Creative Commons'
}

export default function MusicPage() {
	const [tracks, setTracks] = useState<Track[]>([])
	const [playing, setPlaying] = useState<number | null>(null)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		fetch('/music/bgm/playlist.json', { cache: 'no-cache' })
			.then(r => (r.ok ? r.json() : []))
			.then((d: Track[]) => setTracks(Array.isArray(d) ? d : []))
			.catch(() => {})
		return () => {
			audioRef.current?.pause()
		}
	}, [])

	const toggle = (index: number) => {
		const track = tracks[index]
		if (!track) return

		if (playing === index) {
			audioRef.current?.pause()
			setPlaying(null)
			return
		}

		if (!audioRef.current) audioRef.current = new Audio()
		const audio = audioRef.current
		audio.src = track.file
		audio.play().catch(() => setPlaying(null))
		audio.onended = () => setPlaying(null)
		setPlaying(index)
	}

	return (
		<div className='mx-auto max-w-[900px] px-6 pt-28 pb-12 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }}>
				<div className='flex items-center gap-3'>
					<span className='bg-brand/10 text-brand grid h-10 w-10 place-items-center rounded-xl'>
						<Music2 className='h-5 w-5' />
					</span>
					<div>
						<h1 className='text-lg font-semibold'>背景音乐</h1>
						<p className='text-secondary text-xs'>共 {tracks.length} 首 · 全部为 Creative Commons / 公有领域授权</p>
					</div>
				</div>

				<div className='mt-6 space-y-2'>
					{tracks.map((t, i) => (
						<div
							key={t.file}
							className={`bg-card flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
								playing === i ? 'border-brand/50' : 'hover:border-brand/25'
							}`}>
							<button
								onClick={() => toggle(i)}
								className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform active:scale-95 ${
									playing === i ? 'bg-brand text-white' : 'bg-brand/10 text-brand hover:bg-brand/20'
								}`}
								title={playing === i ? '暂停' : '播放'}>
								{playing === i ? <Pause className='h-3.5 w-3.5' /> : <Play className='ml-0.5 h-3.5 w-3.5' />}
							</button>

							<div className='min-w-0 flex-1'>
								<div className='truncate text-[13px] font-medium'>{t.title}</div>
								<div className='text-secondary mt-0.5 truncate text-[11px]'>
									{t.artist || '未知艺术家'}
									{t.genre ? ` · ${t.genre}` : ''}
								</div>
							</div>

							<span className='text-secondary shrink-0 text-[11px] tabular-nums'>{fmt(t.duration)}</span>
							<span className='border-brand/20 bg-brand/5 text-brand hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] sm:inline'>
								{licenseLabel(t.license)}
							</span>
							{t.source && (
								<a
									href={t.source}
									target='_blank'
									rel='noreferrer'
									className='text-secondary hover:text-brand shrink-0 transition-colors'
									title='查看来源与授权'>
									<ExternalLink className='h-3.5 w-3.5' />
								</a>
							)}
						</div>
					))}
				</div>

				<p className='text-secondary mt-6 text-[11px] leading-relaxed opacity-70'>
					所有曲目均来自 archive.org 的开放授权音频，作者信息与许可证见每行右侧链接。若你是权利人且不希望作品在此展示，请联系我删除。
				</p>
			</motion.div>
		</div>
	)
}
