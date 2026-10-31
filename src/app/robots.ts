import type { MetadataRoute } from 'next'
import { absUrl } from '@/lib/site-url'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				// 后台与 OAuth 回调对爬虫无意义，且回调页带一次性 code
				disallow: ['/admin/', '/guestbook/manage', '/gitalk-callback', '/api/', '/write']
			}
		],
		sitemap: absUrl('/sitemap.xml'),
		host: absUrl('/')
	}
}
