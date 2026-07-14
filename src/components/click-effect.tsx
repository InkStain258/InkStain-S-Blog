'use client'
import { useEffect, useRef } from 'react'

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let ripples: { x: number; y: number; r: number; opacity: number; velocity: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const handleClick = (e: MouseEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, opacity: 0.5, velocity: 2.5 })
    }
    window.addEventListener('click', handleClick)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.shadowBlur = 12
      ctx.shadowColor = 'rgba(47,203,231,0.4)'
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.r += r.velocity
        r.velocity *= 0.96
        r.opacity -= 0.012
        if (r.opacity <= 0) { ripples.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(47,203,231,${r.opacity})`
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(47,203,231,${r.opacity * 0.3})`
        ctx.fill()
      }
      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />
}
