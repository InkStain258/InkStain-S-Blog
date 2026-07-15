import { NextResponse } from 'next/server'

const CLIENT_SECRET = '59c9013436b6f405749760cb85b8168201ec4f4d'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const returnUrl = url.searchParams.get('state') || 'https://ink-stain-s-blog.vercel.app/'

  if (!code) {
    return NextResponse.redirect(new URL(returnUrl))
  }

  try {
    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: 'Ov23lixBE1JBA4I67AMe',
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: url.origin + '/api/github/callback',
      }).toString(),
    })
    const data = await githubRes.json()

    if (data.access_token) {
      const dest = new URL(returnUrl)
      dest.hash = `gitalk_token=${data.access_token}`
      return NextResponse.redirect(dest.toString())
    }

    // Fallback: redirect back without token
    return NextResponse.redirect(new URL(returnUrl))
  } catch {
    return NextResponse.redirect(new URL(returnUrl))
  }
}
