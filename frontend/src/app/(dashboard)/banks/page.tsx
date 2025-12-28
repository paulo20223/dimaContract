"use client"

import { useState, useCallback } from "react"
import { useQueryState, parseAsInteger } from "nuqs"
import { Plus, Pencil, Trash2, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { SearchInput } from "@/components/ui/search-input"
import { $api } from "@/lib/api-client"
import type { components } from "@/lib/api-types"

type CBRImportResult = components["schemas"]["CBRImportResult"]

export default function BanksPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", bik: "", correspondent_account: "" })
  const [importResult, setImportResult] = useState<CBRImportResult | null>(null)
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

  const handleSearchChange = useCallback(async (value: string) => {
    await setSearch(value)
    await setPage(1)
  }, [setSearch, setPage])

  const { data, isLoading, refetch } = $api.useQuery("get", "/api/banks", {
    params: { query: { page, search } },
  })

  const banks = data?.items ?? []
  const pages = data?.pages ?? 1

  const createMutation = $api.useMutation("post", "/api/banks", {
    onSuccess: () => {
      setDialogOpen(false)
      refetch()
    },
  })

  const deleteMutation = $api.useMutation("delete", "/api/banks/{bank_id}", {
    onSuccess: () => refetch(),
  })

  const importMutation = $api.useMutation("post", "/api/banks/import-cbr", {
    onSuccess: (data) => {
      setImportResult(data)
      refetch()
    },
    onError: (error) => {
      setImportResult({
        success: false,
        total_processed: 0,
        created: 0,
        updated: 0,
        errors: 1,
        error_messages: [(error as Error).message || "Ошибка импорта"],
        import_date: new Date().toISOString(),
      })
    },
  })

  const openCreate = () => {
    setForm({ name: "", bik: "", correspondent_account: "" })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ body: form })
  }

  const handleDelete = (id: number) => {
    if (confirm("Удалить банк?")) {
      deleteMutation.mutate({ params: { path: { bank_id: id } } })
    }
  }

  const handleImportFromCbr = () => {
    if (!confirm("Загрузить справочник банков из ЦБ РФ? Существующие записи будут обновлены.")) {
      return
    }
    setImportResult(null)
    importMutation.mutate({})
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Банки</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportFromCbr} disabled={importMutation.isPending}>
            {importMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Загрузить из ЦБ РФ
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Добавить
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Поиск по названию или БИК..."
        />
      </div>

      {importResult && (
        <div className={`mb-4 p-4 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p>
            {importResult.success
              ? `Импорт завершён: ${importResult.total_processed} банков обработано, ${importResult.created} добавлено, ${importResult.updated} обновлено`
              : `Ошибка: ${importResult.error_messages.join(', ')}`
            }
          </p>
        </div>
      )}

      <PaginatedTable
        data={banks}
        pages={pages}
        columns={[
          { header: "Наименование", accessor: "name" },
          { header: "БИК", accessor: "bik" },
          { header: "Кор. счёт", accessor: "correspondent_account" },
        ]}
        renderActions={(bank) => (
          <>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/banks/${bank.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(bank.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить банк</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Наименование</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>БИК</Label>
              <Input
                value={form.bik}
                onChange={(e) => setForm({ ...form, bik: e.target.value })}
                maxLength={9}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Корреспондентский счёт</Label>
              <Input
                value={form.correspondent_account}
                onChange={(e) => setForm({ ...form, correspondent_account: e.target.value })}
                maxLength={20}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
