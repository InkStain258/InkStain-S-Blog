import type { Metadata } from 'next'
import reposFallback from '@/generated/repos.json'
import manualProjects from './list.json'

export const revalidate = 3600

export const metadata: Metadata = {
	title: '我的项目',
	description: '做过的东西，大多是先有需求才动手。'
}

type Repo = {
	name: string
	url: string
	desc: string
	lang: string
	stars: number
	fork: boolean
	pushed: string
	homepage: string
	topics: string[]
}

type Manual = {
	name: string
	year: number
	description: string
	url: string
	github?: string
	tags?: string[]
}

const LANG_COLOR: Record<string, string> = {
	Python: '#3572A5',
	TypeScript: '#3178c6',
	JavaScript: '#f1e05a',
	Vue: '#41b883',
	'C++': '#f34b7d',
	C: '#555555',
	'C#': '#178600',
	HTML: '#e34c26',
	CSS: '#563d7c',
	Rust: '#dea584',
	Go: '#00ADD8',
	Java: '#b07219',
	'Jupyter Notebook': '#DA5B0B',
	Shell: '#89e051'
}

function fmtStars(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
}

/** GitHub 仓库 + 手写项目合并：手写的中文名与描述优先，GitHub 上没有的也补上 */
function merge(remote: Repo[]): (Repo & { displayName: string; isManual: boolean })[] {
	const byUrl = new Map(remote.map(r => [r.url.replace(/\/$/, '').toLowerCase(), r]))
	const out: (Repo & { displayName: string; isManual: boolean })[] = []
	const used = new Set<string>()

	for (const m of manualProjects as Manual[]) {
		const key = (m.github || m.url).replace(/\/$/, '').toLowerCase()
		const hit = byUrl.get(key)
		if (hit) {
			used.add(key)
			out.push({ ...hit, desc: m.description || hit.desc, displayName: m.name, isManual: true })
		} else {
			out.push({
				name: m.name, url: m.github || m.url, desc: m.description, lang: (m.tags || [])[0] || '',
				stars: 0, fork: false, pushed: '', homepage: '', topics: m.tags || [],
				displayName: m.name, isManual: true
			})
		}
	}

	for (const r of remote) {
		const key = r.url.replace(/\/$/, '').toLowerCase()
		if (used.has(key)) continue
		out.push({ ...r, displayName: r.name, isManual: false })
	}
	return out
}

async function getRepos(): Promise<Repo[]> {
	try {
		const res = await fetch('https://api.github.com/users/InkStain258/repos?per_page=100&sort=pushed&affiliation=owner', {
			headers: {
				Accept: 'application/vnd.github+json',
				...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
			},
			next: { revalidate: 3600 }
		})
		if (!res.ok) throw new Error(`github ${res.status}`)
		const raw = (await res.json()) as Record<string, unknown>[]
		return raw
			.map(r => ({
				name: String(r.name ?? ''),
				url: String(r.html_url ?? ''),
				desc: String(r.description ?? '').trim(),
				lang: String(r.language ?? ''),
				stars: Number(r.stargazers_count ?? 0),
				fork: Boolean(r.fork),
				pushed: String(r.pushed_at ?? '').slice(0, 10),
				homepage: String(r.homepage ?? ''),
				topics: (r.topics as string[]) ?? []
			}))
			.sort((a, b) => b.pushed.localeCompare(a.pushed))
	} catch {
		return (reposFallback as { items: Repo[] }).items
	}
}

export default async function Page() {
	const remote = await getRepos()
	const list = merge(remote)

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 pt-24 pb-24 max-sm:px-4 max-sm:pt-24 lg:pl-[330px]'>
			<header className='mb-9'>
				<div className='flex items-center justify-between'>
					<span className='text-brand-ink text-[10.5px] tracking-[0.3em] uppercase'>Projects</span>
					<span className='text-secondary text-[10.5px] tabular-nums max-sm:text-[11px]'>{list.length} 个</span>
				</div>
				<h1 className='mt-3 text-[27px] leading-[1.3] font-semibold tracking-[-0.01em] max-sm:text-[24px]'>我的项目</h1>
				<p className='text-secondary mt-2 max-w-[560px] text-[12.5px] leading-[1.85] max-sm:text-[13px]'>
					做过的东西，大多是先有需求才动手。能跑起来、自己天天在用，就算成了。纯粹瞎玩，AI伟力罢了，鄙人就是个臭提需求的
				</p>
			</header>

			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{list.map(p => (
					<a
						key={p.url}
						href={p.url}
						target='_blank'
						rel='noreferrer noopener'
						className='border-border/60 bg-card/60 hover:border-brand/40 flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]'>
						<div>
							<div className='flex items-start justify-between gap-3'>
								<span className='text-[14.5px] leading-[1.4] font-medium'>{p.displayName}</span>
								{p.fork && <span className='text-secondary border-border/70 shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] tracking-wide'>fork</span>}
							</div>
							{p.desc && <p className='text-secondary mt-2 line-clamp-2 text-[12.5px] leading-[1.75]'>{p.desc}</p>}
						</div>
						<div className='text-secondary flex items-center justify-between text-[10.5px] tabular-nums'>
							{p.lang ? (
								<span className='flex items-center gap-1.5'>
									<span className='h-2 w-2 rounded-full' style={{ background: LANG_COLOR[p.lang] ?? 'var(--color-secondary)' }} />
									{p.lang}
								</span>
							) : <span />}
							<span>{p.stars > 0 ? `★ ${fmtStars(p.stars)}` : p.pushed}</span>
						</div>
					</a>
				))}
			</div>
		</div>
	)
}
