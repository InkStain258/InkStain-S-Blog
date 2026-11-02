import type { Metadata } from 'next'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'

/**
 * 标签页的 robots 策略。
 *
 * 站内 31 个标签有 29 个只用过一次，每个标签页只有一篇文章 —— 这类页面留在站里
 * 是为了老链接不 404，但让搜索引擎收录它们只会稀释抓取预算、还容易被判成低质页面。
 * 所以：出现 ≥2 次的标签正常收录，其余的 noindex,follow。
 */
const COUNTS = (() => {
	const m = new Map<string, number>()
	for (const p of blogIndex as BlogIndexItem[]) for (const t of p.tags || []) m.set(t, (m.get(t) ?? 0) + 1)
	return m
})()

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params
	const tag = decodeURIComponent(slug || '')
	const count = COUNTS.get(tag) ?? 0
	if (count >= 2) return { title: `标签：${tag}` }
	return {
		title: `标签：${tag}`,
		robots: { index: false, follow: true }
	}
}

/** layout 必须有默认导出；这里只做 robots 策略，不改动页面结构 */
export default function TagSlugLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
