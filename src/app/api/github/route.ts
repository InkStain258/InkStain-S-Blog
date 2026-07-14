import { NextResponse } from 'next/server'

async function handler(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let code = ''
    let clientId = ''
    let redirectUri = ''

    if (contentType.includes('application/json')) {
      const json = await req.json()
      code = json.code || ''
      clientId = json.client_id || ''
      redirectUri = json.redirect_uri || ''
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      code = params.get('code') || ''
      clientId = params.get('client_id') || ''
      redirectUri = params.get('redirect_uri') || ''
    }

    if (!code || !clientId) {
      return NextResponse.json({ error: 'Missing code or client_id' }, { status: 400 })
    }

    // Use the origin as redirect_uri base if not provided or if it's a trycloudflare URL
    const origin = req.headers.get('origin') || 'https://ink-stain-s-blog.vercel.app'
    if (!redirectUri || redirectUri.includes('trycloudflare.com')) {
      redirectUri = origin + '/'
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: '59c9013436b6f405749760cb85b8168201ec4f4d',
      code: code,
      redirect_uri: redirectUri,
    })

    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    })

    const data = await githubRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('GitHub OAuth proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export { handler as POST }
