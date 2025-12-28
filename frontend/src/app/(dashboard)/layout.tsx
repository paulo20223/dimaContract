"use client"

import { useState } from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Menu } from "lucide-react"
import { Sidebar, SidebarContent } from "@/components/layout/sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Mobile header with hamburger menu */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b bg-white px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col bg-gray-900 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="ml-2 text-lg font-semibold">Договоры</h1>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
          <NuqsAdapter>{children}</NuqsAdapter>
        </main>
      </div>
    </div>
  )
}
