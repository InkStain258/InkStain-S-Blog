import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.QWEATHER_KEY
  const locId = '101270101' // 绵阳 (closest to Mianyang)
  if (!key) {
    return NextResponse.json({ code: '500', message: 'No API key' }, { status: 500 })
  }
  try {
    const res = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${locId}`, {
      headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'Blog-Weather/1.0' },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ code: '500' }, { status: 500 })
  }
}
