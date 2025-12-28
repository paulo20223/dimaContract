"use client"

import { usePageTitle } from "@/contexts/page-title-context"

export function PageHeader() {
  const { title } = usePageTitle()
  return <h1 className="mb-6 hidden text-2xl font-bold md:block">{title}</h1>
}
