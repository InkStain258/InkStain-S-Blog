import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

/**
 * 站点配置自检：只回布尔/枚举，不回任何密钥内容。
 * 用在 /admin/health，方便一眼看出「规范域名是不是回落到预览域名」「Gitalk 密钥有没有配上」。
 */
export function GET() {
	const gitalkSecret: 'env' | 'none' = process.env.GITALK_CLIENT_SECRET?.trim() ? 'env' : 'none'
	const likeEndpoint = process.env.NEXT_PUBLIC_LIKE_ENDPOINT?.trim() || ''

	return NextResponse.json({
		siteUrl: SITE_URL,
		siteUrlSource: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL ? 'env' : 'default',
		gitalkSecret,
		likeEndpoint: likeEndpoint || 'local-only',
		nodeEnv: process.env.NODE_ENV,
		checkedAt: new Date().toISOString()
	})
}
