'use client'

import useSWR from 'swr'
import type { CategoryNode } from '@/lib/categories'

export type CategoriesConfig = {
	categories: string[]
	tree: CategoryNode[]
}

const fetcher = async (url: string): Promise<CategoriesConfig> => {
	let res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) res = await fetch(url)
	if (!res.ok) return { categories: [], tree: [] }
	const data = await res.json()

	// 新格式：{ tree: [{ name, children: [...] }], categories: [...] }
	if (Array.isArray(data?.tree)) {
		const tree: CategoryNode[] = data.tree
			.filter((n: unknown) => !!n && typeof (n as CategoryNode).name === 'string')
			.map((n: CategoryNode) => ({
				name: n.name,
				children: Array.isArray(n.children)
					? n.children.filter(c => !!c && typeof c.name === 'string').map(c => ({ name: c.name }))
					: undefined
			}))
		const leaves = Array.isArray(data.categories)
			? data.categories.filter((x: unknown): x is string => typeof x === 'string')
			: tree.flatMap(n => (n.children?.length ? n.children.map(c => c.name) : [n.name]))
		return { categories: leaves, tree }
	}

	// 旧格式：字符串数组
	if (Array.isArray(data)) {
		const list = data.filter((item): item is string => typeof item === 'string')
		return { categories: list, tree: list.map(name => ({ name })) }
	}
	if (Array.isArray(data?.categories)) {
		const list = data.categories.filter((item: unknown): item is string => typeof item === 'string')
		return { categories: list, tree: list.map((name: string) => ({ name })) }
	}
	return { categories: [], tree: [] }
}

export function useCategories() {
	const { data, error, isLoading } = useSWR<CategoriesConfig>('/blogs/categories.json', fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	return {
		categories: data?.categories ?? [],
		tree: data?.tree ?? [],
		loading: isLoading,
		error
	}
}
