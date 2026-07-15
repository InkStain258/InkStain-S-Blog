import { NextResponse } from 'next/server'

// 绵阳涪城区坐标: 31.47°N, 104.76°E
const LAT = 31.47
const LON = 104.76

export async function GET() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia/Shanghai`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()

    if (!data.current) throw new Error('No data')

    const weatherCode = data.current.weather_code
    const codeMap: Record<number, { text: string; icon: string }> = {
      0: { text: '晴', icon: '100' },
      1: { text: '少云', icon: '101' },
      2: { text: '多云', icon: '102' },
      3: { text: '阴', icon: '104' },
      45: { text: '雾', icon: '501' },
      48: { text: '霜雾', icon: '501' },
      51: { text: '小雨', icon: '305' },
      53: { text: '中雨', icon: '306' },
      55: { text: '大雨', icon: '307' },
      56: { text: '冻雨', icon: '404' },
      57: { text: '冻雨', icon: '404' },
      61: { text: '小雨', icon: '305' },
      63: { text: '中雨', icon: '306' },
      65: { text: '大雨', icon: '307' },
      66: { text: '冻雨', icon: '404' },
      67: { text: '冻雨', icon: '404' },
      71: { text: '小雪', icon: '400' },
      73: { text: '中雪', icon: '401' },
      75: { text: '大雪', icon: '402' },
      77: { text: '阵雪', icon: '400' },
      80: { text: '阵雨', icon: '305' },
      81: { text: '中阵雨', icon: '306' },
      82: { text: '大阵雨', icon: '307' },
      85: { text: '阵雪', icon: '400' },
      86: { text: '阵雪', icon: '400' },
      95: { text: '雷暴', icon: '302' },
      96: { text: '雷暴+冰雹', icon: '304' },
      99: { text: '雷暴+冰雹', icon: '304' },
    }
    const w = codeMap[weatherCode] || { text: '未知', icon: '999' }

    return NextResponse.json({
      code: '200',
      now: {
        temp: `${data.current.temperature_2m}`,
        text: w.text,
        icon: w.icon,
        windSpeed: `${data.current.wind_speed_10m}`,
      },
    })
  } catch {
    return NextResponse.json({ code: '500' }, { status: 500 })
  }
}
