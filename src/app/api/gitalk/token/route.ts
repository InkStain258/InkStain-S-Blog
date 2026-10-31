import { NextResponse } from 'next/server'
import { GITALK_CLIENT_ID } from '@/config/gitalk'

export const dynamic = 'force-dynamic'

/**
 * 用 code 换 access_token。secret 只在服务端使用，绝不进前端 bundle。
 *
 * 取值顺序：环境变量 GITALK_CLIENT_SECRET > 历史兜底值（带告警）。
 * 兜底只为「不把线上登录搞挂」；它已经进过 git 历史，属于待清理项：
 * 在部署平台补上 GITALK_CLIENT_SECRET、并在 GitHub 轮换 OAuth App secret 之后，
 * 把 LEGACY_SECRET 与回退分支一起删掉。当前用的是哪一个，GET 本路由即可看到。
 */
const LEGACY_SECRET = '59c9013436b6f405749760cb85b8168201ec4f4d'

let warned = false
function resolveSecret(): { secret: string; source: 'env' | 'legacy' | 'none' } {
	const env = process.env.GITALK_CLIENT_SECRET?.trim()
	if (env) return { secret: env, source: 'env' }
	if (!warned) {
		warned = true
		console.warn('[gitalk] GITALK_CLIENT_SECRET 未配置，回退到历史密钥；请补环境变量并轮换。')
	}
	return { secret: LEGACY_SECRET, source: 'legacy' }
}

export async function POST(req: Request) {
	let code = ''
	try {
		const body = await req.json()
		code = String(body?.code || '')
	} catch {
		return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
	}
	if (!code) return NextResponse.json({ error: '缺少 code' }, { status: 400 })

	const clientId = process.env.GITALK_CLIENT_ID || GITALK_CLIENT_ID
	const { secret, source } = resolveSecret()

	try {
		const res = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ client_id: clientId, client_secret: secret, code }),
			cache: 'no-store'
		})
		const data = await res.json()
		if (data?.error || !data?.access_token) {
			return NextResponse.json(
				{ error: data?.error_description || data?.error || '换取令牌失败', secretSource: source },
				{ status: 400 }
			)
		}
		return NextResponse.json({ access_token: data.access_token, scope: data.scope, secretSource: source })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || '网络错误' }, { status: 500 })
	}
}

/** 自检：只报告密钥来源，不暴露密钥本身 */
export function GET() {
	const { source } = resolveSecret()
	return NextResponse.json({ secretSource: source, ok: source === 'env' })
}
