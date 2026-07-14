'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('splash-seen')) return
    setShow(true)
    const t = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('splash-seen', 'true')
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-slate-950">
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 opacity-50 blur-sm" />
              <div className="relative w-full h-full rounded-full p-1 bg-white shadow-lg">
                <img src="/images/avatar.png" alt="InkStain" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-widest mb-2">InkStain</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.4em] mb-8">LOADING BLOG</p>
            <div className="w-36 h-[2px] bg-slate-200 rounded-full overflow-hidden">
              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(47,203,231,0.8)]" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
