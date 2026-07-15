'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'
interface ThemeCtx { theme: Theme; toggle: () => void }

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('ink-theme') as Theme | null
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('ink-theme', next)
      if (next === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }, [])

  if (!mounted) return <ThemeContext value={{ theme: 'light', toggle }}>{children}</ThemeContext>

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}

export function useTheme() { return useContext(ThemeContext) }
