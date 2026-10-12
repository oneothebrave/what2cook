import React, { useEffect } from 'react'
import { useMenuStore } from './store/menuStore'

// 全局样式
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const initFamily = useMenuStore((s) => s.initFamily)

  useEffect(() => {
    initFamily()
  }, [])

  return <>{children}</>
}

export default App
