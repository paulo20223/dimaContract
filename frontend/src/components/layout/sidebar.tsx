"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Building2, FileText, Users, Wrench, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { removeToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Договоры", href: "/contracts", icon: FileText },
  { name: "Клиенты", href: "/clients", icon: Users },
  { name: "Услуги", href: "/services", icon: Wrench },
  { name: "Банки", href: "/banks", icon: Building2 },
]

interface SidebarContentProps {
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await removeToken()
    router.push("/login")
  }

  return (
    <>
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">LEXAUDIT</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Выйти
        </Button>
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-[#4056a1]">
      <SidebarContent />
    </div>
  )
}
