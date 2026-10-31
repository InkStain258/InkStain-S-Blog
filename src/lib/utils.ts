import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function thousandsSeparator(n: string | number | any, sign: string = ',') {
	if (typeof n === 'string' || typeof n === 'number') {
		n = String(n)
		const reg = /\B(?=(\d{3})+($|\.))/g

		if (n.includes('.')) {
			const nArr = n.split('.')
			nArr[0] = nArr[0].replace(reg, `$&${sign}`)

			return nArr.join('.')
		}

		return n.replace(reg, `$&${sign}`)
	} else return 0
}

export function getFileExt(filename: string): string {
	const lower = filename.toLowerCase()
	if (lower.endsWith('.jpg')) return '.jpg'
	if (lower.endsWith('.jpeg')) return '.jpeg'
	if (lower.endsWith('.webp')) return '.webp'
	if (lower.endsWith('.png')) return '.png'
	if (lower.endsWith('.svg')) return '.svg'
	return '.png'
}

export function rand(a: number, b: number) {
	return a + Math.random() * (b - a)
}

/**
 * 摘要/列表里展示的是纯文本，作者手写的行内 Markdown 标记会原样漏出来。
 * 去掉强调、行内代码、链接语法，其余照抄。
 */
export function plainInline(source?: string | null) {
	if (!source) return ''
	return String(source)
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/`([^`]*)`/g, '$1')
		.replace(/(\*\*|__)(.+?)\1/g, '$2')
		.replace(/(^|\s)[*_](\S.*?\S)[*_](?=\s|$)/g, '$1$2')
		.replace(/~~(.+?)~~/g, '$1')
		.trim()
}
