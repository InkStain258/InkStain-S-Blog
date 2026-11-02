import type { BlogIndexItem } from '@/app/blog/types'

export type CategoryNode = { name: string; children?: CategoryNode[] }

/** 一篇文章的分类路径；老数据没有 categoryPath 时退化成单级 */
export function pathOf(item: BlogIndexItem): string[] {
	const p = item.categoryPath
	if (Array.isArray(p) && p.length) return p.filter(Boolean)
	const leaf = (item.category || '').trim()
	return leaf ? [leaf] : []
}

/** 文章是否落在 prefix 这个（大类/子类）之下 */
export function itemUnder(item: BlogIndexItem, prefix: string[]): boolean {
	if (!prefix.length) return true
	const p = pathOf(item)
	return prefix.every((seg, i) => p[i] === seg)
}

/** 在树里按路径找节点 */
export function findNode(tree: CategoryNode[], prefix: string[]): CategoryNode | null {
	let level = tree
	let node: CategoryNode | null = null
	for (const seg of prefix) {
		const hit = level.find(n => n.name === seg)
		if (!hit) return null
		node = hit
		level = hit.children || []
	}
	return node
}

/** 一级分类列表（大类） */
export function roots(tree: CategoryNode[]): CategoryNode[] {
	return tree
}

/** 所有叶子的完整路径，用于旧链接与统计 */
export function allPaths(tree: CategoryNode[], prefix: string[] = []): string[][] {
	const out: string[][] = []
	for (const n of tree) {
		const p = [...prefix, n.name]
		if (n.children?.length) out.push(...allPaths(n.children, p))
		else out.push(p)
	}
	return out
}


/** 树 → 完整路径字符串数组（`大类/子类`），用于编辑弹窗与保存 */
export function pathsFromTree(tree: CategoryNode[]): string[] {
	const out: string[] = []
	const walk = (nodes: CategoryNode[], prefix: string[]) => {
		for (const n of nodes) {
			const p = [...prefix, n.name]
			if (n.children?.length) walk(n.children, p)
			else out.push(p.join('/'))
		}
	}
	walk(tree, [])
	return out
}

/** 路径字符串数组 → 树（最多三级，多余层级直接忽略） */
export function buildTree(paths: string[]): CategoryNode[] {
	const roots: CategoryNode[] = []
	for (const raw of paths) {
		const segs = raw
			.split('/')
			.map(x => x.trim())
			.filter(Boolean)
			.slice(0, 3)
		if (!segs.length) continue
		let level = roots
		for (const seg of segs) {
			let node = level.find(n => n.name === seg)
			if (!node) {
				node = { name: seg }
				level.push(node)
			}
			if (!node.children) node.children = []
			level = node.children
		}
	}
	const prune = (nodes: CategoryNode[]): CategoryNode[] =>
		nodes.map(n => {
			const kids = n.children ? prune(n.children) : []
			return kids.length ? { name: n.name, children: kids } : { name: n.name }
		})
	return prune(roots)
}

/** 从路径里取叶子名 */
export function leafOf(path: string): string {
	const segs = path.split('/').filter(Boolean)
	return segs[segs.length - 1] || path
}
