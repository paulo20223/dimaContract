"use client"

import * as React from "react"
import { format, setMonth, setYear, addYears } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

type ViewMode = "days" | "months" | "years"

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр",
  "Май", "Июн", "Июл", "Авг",
  "Сен", "Окт", "Ноя", "Дек"
]

export function DatePicker({
  value,
  onChange,
  placeholder = "Выберите дату",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("days")
  const [displayDate, setDisplayDate] = React.useState<Date>(value || new Date())
  const [yearRangeStart, setYearRangeStart] = React.useState(() => {
    const currentYear = (value || new Date()).getFullYear()
    return Math.floor(currentYear / 12) * 12
  })

  React.useEffect(() => {
    if (open) {
      setViewMode("days")
      setDisplayDate(value || new Date())
      const currentYear = (value || new Date()).getFullYear()
      setYearRangeStart(Math.floor(currentYear / 12) * 12)
    }
  }, [open, value])

  const handleDateSelect = (date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
  }

  const handleMonthSelect = (monthIndex: number) => {
    setDisplayDate(setMonth(displayDate, monthIndex))
    setViewMode("days")
  }

  const handleYearSelect = (year: number) => {
    setDisplayDate(setYear(displayDate, year))
    setViewMode("months")
  }

  const handleHeaderClick = () => {
    if (viewMode === "days") {
      setViewMode("months")
    } else if (viewMode === "months") {
      setViewMode("years")
    }
  }

  const handlePrev = () => {
    if (viewMode === "days") {
      setDisplayDate(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() - 1)
        return newDate
      })
    } else if (viewMode === "months") {
      setDisplayDate(prev => addYears(prev, -1))
    } else {
      setYearRangeStart(prev => prev - 12)
    }
  }

  const handleNext = () => {
    if (viewMode === "days") {
      setDisplayDate(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() + 1)
        return newDate
      })
    } else if (viewMode === "months") {
      setDisplayDate(prev => addYears(prev, 1))
    } else {
      setYearRangeStart(prev => prev + 12)
    }
  }

  const getHeaderLabel = () => {
    if (viewMode === "days") {
      return format(displayDate, "LLLL yyyy", { locale: ru })
    } else if (viewMode === "months") {
      return displayDate.getFullYear().toString()
    } else {
      return `${yearRangeStart} - ${yearRangeStart + 11}`
    }
  }

  const years = React.useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i < 12; i++) {
      arr.push(yearRangeStart + i)
    }
    return arr
  }, [yearRangeStart])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "d MMMM yyyy", { locale: ru }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-sm font-medium capitalize hover:bg-accent"
              onClick={viewMode !== "years" ? handleHeaderClick : undefined}
              disabled={viewMode === "years"}
            >
              {getHeaderLabel()}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {viewMode === "days" ? (
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              month={displayDate}
              onMonthChange={setDisplayDate}
              initialFocus
              className="p-0"
              classNames={{
                month_caption: "hidden",
                nav: "hidden",
              }}
            />
          ) : (
            <div className="grid grid-cols-4 gap-2 w-[252px]">
              {viewMode === "months"
                ? MONTHS.map((month, index) => (
                    <Button
                      key={month}
                      variant={displayDate.getMonth() === index ? "default" : "ghost"}
                      className="h-9"
                      onClick={() => handleMonthSelect(index)}
                    >
                      {month}
                    </Button>
                  ))
                : years.map((year) => (
                    <Button
                      key={year}
                      variant={displayDate.getFullYear() === year ? "default" : "ghost"}
                      className="h-9"
                      onClick={() => handleYearSelect(year)}
                    >
                      {year}
                    </Button>
                  ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
