import type { MetadataRoute } from 'next'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'
import { SITE_URL } from '@/lib/site-url'

export const dynamic = 'force-static'

/**
 * 只认 src/lib/site-url.ts 里的规范域名。
 * 历史上这里回落到 VERCEL_URL，导致 26 条 loc 全指向每次部署都变的预览域名。
 */
export default function sitemap(): MetadataRoute.Sitemap {
	const posts = blogIndex as BlogIndexItem[]
	const staticPages = ['/blog', '/archive', '/series', '/about', '/projects', '/share', '/guestbook', '/starred', '/lab']
	const categories = [...new Set(posts.map(p => p.category).filter(Boolean))] as string[]
	// 只用过一次的标签：页面保留（老链接不 404），但不进 sitemap、也不让搜索引擎收录
	const tagCount = new Map<string, number>()
	for (const p of posts) for (const t of p.tags || []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
	const tags = [...tagCount.entries()].filter(([, n]) => n >= 2).map(([t]) => t)

	const entries: MetadataRoute.Sitemap = [
		{ url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1, lastModified: new Date() },
		...staticPages.map(path => ({
			url: `${SITE_URL}${path}`,
			changeFrequency: 'weekly' as const,
			priority: path === '/blog' ? 0.9 : 0.5,
			lastModified: new Date()
		})),
		...categories.map(slug => ({
			url: `${SITE_URL}/blog/category/${encodeURIComponent(slug)}`,
			changeFrequency: 'weekly' as const,
			priority: 0.6,
			lastModified: new Date()
		})),
		...tags.map(slug => ({
			url: `${SITE_URL}/blog/tag/${encodeURIComponent(slug)}`,
			changeFrequency: 'monthly' as const,
			priority: 0.4,
			lastModified: new Date()
		})),
		...posts
			.filter(p => !p.hidden)
			.map(p => ({
				url: `${SITE_URL}/blog/${p.slug}`,
				lastModified: p.date ? new Date(p.date) : new Date(),
				changeFrequency: 'monthly' as const,
				priority: 0.8
			}))
	]

	return entries
}
