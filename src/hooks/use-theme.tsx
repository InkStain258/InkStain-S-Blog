'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'sepia' | 'dark'
const ORDER: Theme[] = ['light', 'sepia', 'dark']
interface ThemeCtx { theme: Theme; toggle: () => void }

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('ink-theme') as Theme | null
    const initial: Theme = saved && ORDER.includes(saved)
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
    document.documentElement.classList.toggle('sepia', initial === 'sepia')
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]
      localStorage.setItem('ink-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.documentElement.classList.toggle('sepia', next === 'sepia')
      return next
    })
  }, [])

  if (!mounted) return <ThemeContext value={{ theme: 'light', toggle }}>{children}</ThemeContext>

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}

export function useTheme() { return useContext(ThemeContext) }
