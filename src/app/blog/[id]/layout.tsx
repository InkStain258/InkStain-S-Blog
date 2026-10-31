import type { Metadata } from 'next'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'
import { SITE_URL, absUrl } from '@/lib/site-url'

/**
 * 文章页的 SEO 外壳。
 *
 * page.tsx 是客户端组件（要读 md、要挂 Gitalk），导不出 generateMetadata，
 * 所以标题 / 摘要 / canonical / og:image / JSON-LD 全放在这层 layout 里，
 * 由服务端渲染——爬虫不执行 JS 也能拿到。
 */
const posts = blogIndex as BlogIndexItem[]

const plain = (s?: string) =>
	(s || '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[*_`#>~]/g, '')
		.replace(/\s+/g, ' ')
		.trim()

function findPost(slug?: string) {
	return posts.find(p => p.slug === slug)
}

/**
 * 封面优先走站内路径：config.json 里存的是 raw.githubusercontent 的外链，
 * 国内访问不稳，而 public/blogs/<slug>/<文件> 本来就在仓库里。
 */
function coverUrl(slug: string, cover?: string): string {
	if (!cover) return absUrl('/images/avatar.png')
	const file = cover.split('/').pop() || ''
	if (!file) return absUrl(cover)
	return absUrl(`/blogs/${slug}/${file}`)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params
	const post = findPost(id)
	const title = post?.title || id
	const description = plain(post?.summary).slice(0, 150)
	const cover = coverUrl(id, post?.cover)
	const url = absUrl(`/blog/${id}`)

	return {
		title,
		description,
		keywords: post?.tags,
		alternates: { canonical: url },
		openGraph: {
			type: 'article',
			title,
			description,
			url,
			siteName: 'InkStain',
			locale: 'zh_CN',
			publishedTime: post?.date,
			tags: post?.tags,
			images: [{ url: cover, alt: title }]
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [cover]
		}
	}
}

export default async function BlogPostLayout({
	children,
	params
}: {
	children: React.ReactNode
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const post = findPost(id)

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post?.title || id,
		description: plain(post?.summary).slice(0, 200),
		image: coverUrl(id, post?.cover),
		datePublished: post?.date,
		dateModified: post?.date,
		inLanguage: 'zh-CN',
		keywords: (post?.tags || []).join(', '),
		articleSection: post?.category,
		author: { '@type': 'Person', name: 'InkStain', url: SITE_URL },
		publisher: { '@type': 'Organization', name: 'InkStain', url: SITE_URL },
		mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(`/blog/${id}`) },
		url: absUrl(`/blog/${id}`)
	}

	// JSON.stringify 不转义 <，正文里若出现 </script> 会截断标签
	const jsonLdText = JSON.stringify(jsonLd).replace(/</g, '\\u003c')

	return (
		<>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: jsonLdText }} />
			{children}
		</>
	)
}
