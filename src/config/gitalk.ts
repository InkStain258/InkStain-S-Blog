/**
 * Gitalk / GitHub OAuth 配置
 *
 * GitHub 的 OAuth App 只能登记**一个**回调地址，所以登录统一走下面这个
 * 规范域名：不管用户是从 vercel.app、CF Tunnel 还是自定义域名进来，
 * 都会先到 CANONICAL_ORIGIN/gitalk-callback 换 token，再跳回原页面。
 */
export const GITALK_CLIENT_ID = 'Ov23lixBE1JBA4I67AMe'

export const GITALK_CANONICAL_ORIGIN = process.env.NEXT_PUBLIC_GITALK_CANONICAL || 'https://inkstain.top'

export const GITALK_CALLBACK_PATH = '/gitalk-callback'

/** 拼出授权地址：state 里带当前页面，回来后原样跳回去 */
export function buildAuthorizeUrl(currentHref: string): string {
	const redirect = `${GITALK_CANONICAL_ORIGIN}${GITALK_CALLBACK_PATH}`
	const q = new URLSearchParams({
		client_id: GITALK_CLIENT_ID,
		redirect_uri: redirect,
		scope: 'public_repo',
		state: currentHref
	})
	return `https://github.com/login/oauth/authorize?${q.toString()}`
}
