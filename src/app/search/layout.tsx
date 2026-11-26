import type { ReactNode } from 'react'

// 搜索结果页不该进索引：每次查询都是一个新 URL，收录进去全是重复的薄页面
export const metadata = {
	title: '搜索',
	description: '在全站文章里按关键词检索',
	robots: { index: false, follow: true }
}

export default function SearchLayout({ children }: { children: ReactNode }) {
	return children
}
