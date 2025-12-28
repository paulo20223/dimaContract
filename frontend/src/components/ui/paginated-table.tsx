"use client"

import { useQueryState, parseAsInteger } from "nuqs"
import { Button } from "./button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  className?: string
}

interface PaginatedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pages: number
  renderActions?: (item: T) => React.ReactNode
  emptyMessage?: string
  onRowClick?: (item: T) => void
}

function Pagination({ page, pages, setPage }: { page: number; pages: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
      >
        ←
      </Button>
      {(() => {
        const maxButtons = 5
        let start = Math.max(1, page - Math.floor(maxButtons / 2))
        let end = Math.min(pages, start + maxButtons - 1)
        if (end - start + 1 < maxButtons) {
          start = Math.max(1, end - maxButtons + 1)
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => setPage(p)}
            className="min-w-[36px]"
          >
            {p}
          </Button>
        ))
      })()}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(page + 1)}
        disabled={page >= pages}
      >
        →
      </Button>
    </div>
  )
}

export function PaginatedTable<T extends { id: number }>({
  data,
  columns,
  pages,
  renderActions,
  emptyMessage = "Нет данных",
  onRowClick,
}: PaginatedTableProps<T>) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

  const colSpan = columns.length + (renderActions ? 1 : 0)

  const getValue = (item: T, col: Column<T>) => {
    return typeof col.accessor === "function"
      ? col.accessor(item)
      : String(item[col.accessor] ?? "")
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Mobile: Cards */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="divide-y">
            {data.map((item) => (
              <div
                key={item.id}
                className={`p-4 space-y-2 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-sm text-gray-500 shrink-0">{col.header}:</span>
                    <span className={`text-sm text-right ${col.className ?? ""}`}>
                      {getValue(item, col)}
                    </span>
                  </div>
                ))}
                {renderActions && (
                  <div
                    className="flex justify-end gap-1 pt-2 border-t mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderActions(item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pages={pages} setPage={setPage} />
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-gray-50">
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {renderActions && (
                <TableHead className="text-right">Действия</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, i) => (
                  <TableCell key={i} className={col.className}>
                    {getValue(item, col)}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    {renderActions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="h-24 text-center text-gray-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {pages > 1 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <Pagination page={page} pages={pages} setPage={setPage} />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
