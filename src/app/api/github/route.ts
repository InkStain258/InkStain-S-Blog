import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const bodyText = await req.text()
    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'Accept': 'application/json',
      },
      body: bodyText,
    })
    const data = await githubRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('GitHub OAuth proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
