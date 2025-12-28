"use client"

import { useEffect } from "react"
import { usePageTitle } from "@/contexts/page-title-context"

export function useSetPageTitle(title: string) {
  const { setTitle } = usePageTitle()

  useEffect(() => {
    setTitle(title)
  }, [title, setTitle])
}
