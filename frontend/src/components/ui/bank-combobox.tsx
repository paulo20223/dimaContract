"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, ChevronDown, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { $api } from "@/lib/api-client"
import type { components } from "@/lib/api-types"

type Bank = components["schemas"]["BankResponse"]

interface BankComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function BankCombobox({ value, onChange, placeholder = "Выберите банк" }: BankComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<Bank[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setAllItems([])
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = $api.useQuery(
    "get",
    "/api/banks",
    { params: { query: { page, search: debouncedSearch, per_page: 20 } } },
    { enabled: open }
  )

  // Accumulate items for infinite scroll
  useEffect(() => {
    if (data?.items) {
      if (page === 1) {
        setAllItems(data.items)
      } else {
        setAllItems(prev => [...prev, ...data.items])
      }
    }
  }, [data?.items, page])

  // Fetch selected bank name
  const { data: selectedBankData } = $api.useQuery(
    "get",
    "/api/banks/{bank_id}",
    { params: { path: { bank_id: Number(value) } } },
    { enabled: !!value && !allItems.find(b => String(b.id) === value) }
  )

  const selectedBank = allItems.find(b => String(b.id) === value) || selectedBankData

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = useCallback((bank: Bank) => {
    onChange(String(bank.id))
    setOpen(false)
    setSearch("")
  }, [onChange])

  const handleLoadMore = () => {
    if (data && page < data.pages) {
      setPage(prev => prev + 1)
    }
  }

  const hasMore = data ? page < data.pages : false

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={selectedBank ? "text-foreground" : "text-muted-foreground"}>
          {selectedBank ? `${selectedBank.name} (${selectedBank.bik})` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по названию или БИК..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isLoading && allItems.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : allItems.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                Ничего не найдено
              </div>
            ) : (
              <>
                {allItems.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelect(bank)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                      String(bank.id) === value ? "bg-accent" : ""
                    }`}
                  >
                    <div className="font-medium">{bank.name}</div>
                    <div className="text-xs text-gray-500">БИК: {bank.bik}</div>
                  </button>
                ))}

                {hasMore && (
                  <div className="p-2 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Загрузить ещё
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
