"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface PageTitleContextType {
  title: string
  setTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined)

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState("Договоры")

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle)
  }, [])

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  const context = useContext(PageTitleContext)
  if (!context) {
    throw new Error("usePageTitle must be used within PageTitleProvider")
  }
  return context
}
