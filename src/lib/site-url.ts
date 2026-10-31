/**
 * 站点规范域名。
 *
 * 只认显式配置，绝不回落到 `VERCEL_URL`——那是每次部署都会变的预览域名，
 * 一旦泄漏进 sitemap / rss / canonical，搜索引擎会把每个预览域名当成独立站点收录。
 */
export const SITE_URL = (
	process.env.NEXT_PUBLIC_SITE_URL ||
	process.env.SITE_URL ||
	'https://inkstain.top'
).replace(/\/+$/, '')

/** 把站内路径转成绝对地址；已经是 http(s) 的原样返回 */
export function absUrl(pathname = '/'): string {
	if (!pathname) return SITE_URL
	if (/^https?:\/\//i.test(pathname)) return pathname
	return `${SITE_URL}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}
