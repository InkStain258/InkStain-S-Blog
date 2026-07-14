'use client'
import { useEffect, useState } from 'react'

interface Petal { id: number; left: string; size: number; duration: number; delay: number }

export default function SakuraPetals() {
  const [petals, setPetals] = useState<Petal[]>([])

  useEffect(() => {
    setPetals(Array.from({ length: 30 }).map((_, i) => ({
      id: i, left: `${Math.random() * 100}%`,
      size: 8 + Math.random() * 10,
      duration: 8 + Math.random() * 6,
      delay: Math.random() * -15,
    })))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes sakuraFall { 0% { transform:translate(0,-10vh) rotate(0deg); opacity:0 } 10% { opacity:0.6 } 80% { opacity:0.4 } 100% { transform:translate(12vw,110vh) rotate(360deg); opacity:0 } }
      `}</style>
      {petals.map(p => (
        <div key={p.id} className="absolute top-0"
          style={{ left: p.left, width: p.size, height: p.size * 1.2,
            borderRadius: '100% 0 100% 0',
            backgroundColor: 'rgba(255,182,193,0.5)',
            boxShadow: '0 0 4px rgba(255,182,193,0.4)',
            animation: `sakuraFall ${p.duration}s linear infinite`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  )
}
