'use client'
import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Loader2 } from 'lucide-react'

export default function WeatherWidget() {
  const [w, setW] = useState<{ temp: string; text: string; icon: string; mock: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(d => {
        if (d.code === '200' && d.now) {
          setW({ temp: d.now.temp, text: d.now.text, icon: d.now.icon, mock: false })
        } else {
          setW({ temp: '22', text: '晴', icon: '100', mock: true })
        }
      })
      .catch(() => setW({ temp: '22', text: '晴', icon: '100', mock: true }))
      .finally(() => setLoading(false))
  }, [])

  const icon = (code: string) => {
    const n = parseInt(code)
    if (n === 100) return <Sun className="text-amber-400" size={32} />
    if (n >= 101 && n <= 104) return <Cloud className="text-slate-300" size={32} />
    if (n >= 300 && n <= 399) return <CloudRain className="text-blue-400" size={32} />
    if (n >= 400 && n <= 499) return <Snowflake className="text-indigo-200" size={32} />
    if (n === 302 || n === 304) return <CloudLightning className="text-yellow-400" size={32} />
    return <Cloud className="text-slate-400" size={32} />
  }

  return (
    <div className="h-full rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 shadow-md p-4 flex flex-col items-center justify-center gap-1">
      {loading ? (
        <Loader2 className="animate-spin text-slate-400" size={24} />
      ) : w ? (
        <>
          <div className="flex items-center gap-3">
            {icon(w.icon)}
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-800 leading-none">{w.temp}°</span>
              <span className="text-[11px] text-slate-500">{w.text}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">绵阳涪城{w.mock ? ' (模拟)' : ''}</span>
        </>
      ) : null}
    </div>
  )
}
