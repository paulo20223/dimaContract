"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface PresetSelectProps {
  presets: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function PresetSelect({
  presets,
  value,
  onChange,
  placeholder = "Введите значение",
}: PresetSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Закрываем при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (preset: string) => {
    onChange(preset)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white p-1 shadow-md">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(preset)}
              className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const POSITION_PRESETS = [
  "Генеральный директор",
  "Директор",
  "Президент",
  "Председатель",
  "Управляющий",
]

export const ACTING_BASIS_PRESETS = [
  "Устава",
  "Доверенности",
  "Положения",
]
