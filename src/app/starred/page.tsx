import type { Metadata } from 'next'
import starredFallback from '@/generated/starred.json'

export const revalidate = 3600

export const metadata: Metadata = {
	title: '我 star 的项目',
	description: 'GitHub 上收藏过的仓库，随手点星，慢慢看。'
}

type Repo = {
	name: string
	url: string
	desc: string
	lang: string
	stars: number
	pushed: string
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
	Shell: '#89e051',
	Dockerfile: '#384d54'
}

function fmtStars(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
}

async function getStarred(): Promise<Repo[]> {
	try {
		const res = await fetch('https://api.github.com/users/InkStain258/starred?per_page=100&sort=created', {
			headers: {
				Accept: 'application/vnd.github+json',
				...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
			},
			next: { revalidate: 3600 }
		})
		if (!res.ok) throw new Error(`github ${res.status}`)
		const raw = (await res.json()) as Record<string, unknown>[]
		const list: Repo[] = raw.map(r => ({
			name: String(r.full_name ?? ''),
			url: String(r.html_url ?? ''),
			desc: String(r.description ?? '').trim(),
			lang: String(r.language ?? ''),
			stars: Number(r.stargazers_count ?? 0),
			pushed: String(r.pushed_at ?? '').slice(0, 10)
		}))
		return list.sort((a, b) => b.pushed.localeCompare(a.pushed))
	} catch {
		// GitHub 挂了或者被限流时，用仓库里预生成的一份，页面不会空
		return (starredFallback as { items: Repo[] }).items
	}
}

export default async function Page() {
	const repos = await getStarred()

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 pt-24 pb-24 max-sm:px-4 max-sm:pt-24 lg:pl-[330px]'>
			<header className='mb-9'>
				<div className='flex items-center justify-between'>
					<span className='text-brand-ink text-[10.5px] tracking-[0.3em] uppercase'>Starred</span>
					<span className='text-secondary text-[10.5px] tabular-nums max-sm:text-[11px]'>{repos.length} 个</span>
				</div>
				<h1 className='mt-3 text-[27px] leading-[1.3] font-semibold tracking-[-0.01em] max-sm:text-[24px]'>我 star 的项目</h1>
				<p className='text-secondary mt-2 max-w-[540px] text-[12.5px] leading-[1.85] max-sm:text-[13px]'>
					多看多学，闭门造车不可取
				</p>
			</header>

			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{repos.map(repo => (
					<a
						key={repo.name}
						href={repo.url}
						target='_blank'
						rel='noreferrer noopener'
						className='border-border/60 bg-card/60 hover:border-brand/40 flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]'>
						<div>
							<div className='flex items-start justify-between gap-3'>
								<span className='text-[14.5px] leading-[1.4] font-medium'>{repo.name.split('/')[1] ?? repo.name}</span>
								<span className='text-secondary shrink-0 text-[10.5px] tabular-nums'>★ {fmtStars(repo.stars)}</span>
							</div>
							<div className='text-secondary mt-0.5 truncate text-[10.5px]'>{repo.name.split('/')[0]}</div>
							{repo.desc && <p className='text-secondary mt-2 line-clamp-2 text-[12.5px] leading-[1.75]'>{repo.desc}</p>}
						</div>
						<div className='text-secondary flex items-center justify-between text-[10.5px] tabular-nums'>
							{repo.lang ? (
								<span className='flex items-center gap-1.5'>
									<span className='h-2 w-2 rounded-full' style={{ background: LANG_COLOR[repo.lang] ?? 'var(--color-secondary)' }} />
									{repo.lang}
								</span>
							) : <span />}
							<span>{repo.pushed}</span>
						</div>
					</a>
				))}
			</div>
		</div>
	)
}
