import type { BlogConfig } from '@/app/blog/types'

export type { BlogConfig } from '@/app/blog/types'

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

/* nginx proxies /blogs/ to GitHub raw */

export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) {
		throw new Error('Slug is required')
	}

	// Load config.json
	let config: BlogConfig = {}
	let configRes = await fetch(`/blogs/${encodeURIComponent(slug)}/config.json`).catch(() => null)
	if (!configRes || !configRes.ok) {
		configRes = await fetch(`/blogs/${encodeURIComponent(slug)}/config.json`)
	}
	if (configRes.ok) {
		try {
			config = await configRes.json()
		} catch {
			config = {}
		}
	}

	// Load index.md
	let mdRes = await fetch(`/blogs/${encodeURIComponent(slug)}/index.md`).catch(() => null)
	if (!mdRes || !mdRes.ok) {
		mdRes = await fetch(`/blogs/${encodeURIComponent(slug)}/index.md`)
	}
	if (!mdRes.ok) {
		throw new Error('Blog not found')
	}
	const markdown = await mdRes.text()

	return {
		slug,
		config,
		markdown,
		cover: config.cover
	}
}
