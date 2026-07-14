'use client'
import { useEffect, useState } from 'react'

interface Fly { id: number; top: string; left: string; size: number; breatheD: number; breatheDelay: number; floatD: number; floatDelay: number; floatPath: string }

export default function Fireflies() {
  const [flies, setFlies] = useState<Fly[]>([])

  useEffect(() => {
    setFlies(Array.from({ length: 35 }).map((_, i) => ({
      id: i, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 4,
      breatheD: 3 + Math.random() * 5, breatheDelay: Math.random() * -10,
      floatD: 15 + Math.random() * 20, floatDelay: Math.random() * -20,
      floatPath: `float${Math.floor(Math.random() * 4) + 1}`,
    })))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes fireflyBreathe { 0%,100% { opacity:0; transform:scale(0.3) } 50% { opacity:1; transform:scale(1.2); box-shadow:0 0 10px 3px rgba(200,255,150,0.8),0 0 20px 6px rgba(150,255,100,0.4) } }
        @keyframes float1 { 0%,100% { transform:translate(0,0) } 33% { transform:translate(8vw,-12vh) } 66% { transform:translate(-4vw,-16vh) } }
        @keyframes float2 { 0%,100% { transform:translate(0,0) } 33% { transform:translate(-10vw,8vh) } 66% { transform:translate(6vw,12vh) } }
        @keyframes float3 { 0%,100% { transform:translate(0,0) } 33% { transform:translate(12vw,12vh) } 66% { transform:translate(-8vw,4vh) } }
        @keyframes float4 { 0%,100% { transform:translate(0,0) } 33% { transform:translate(-12vw,-8vh) } 66% { transform:translate(8vw,-12vh) } }
      `}</style>
      {flies.map(f => (
        <div key={f.id} className="absolute" style={{ top: f.top, left: f.left, animation: `${f.floatPath} ${f.floatD}s ease-in-out infinite`, animationDelay: `${f.floatDelay}s` }}>
          <div className="rounded-full" style={{ width: f.size, height: f.size, backgroundColor: 'rgba(200,255,200,0.9)', animation: `fireflyBreathe ${f.breatheD}s ease-in-out infinite`, animationDelay: `${f.breatheDelay}s` }} />
        </div>
      ))}
    </div>
  )
}
