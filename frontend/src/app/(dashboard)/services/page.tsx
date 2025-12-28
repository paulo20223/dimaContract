"use client"

import { useCallback } from "react"
import { useQueryState, parseAsInteger } from "nuqs"
import { Plus, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { SearchInput } from "@/components/ui/search-input"
import { $api } from "@/lib/api-client"

export default function ServicesPage() {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

  const handleSearchChange = useCallback(async (value: string) => {
    await setSearch(value)
    await setPage(1)
  }, [setSearch, setPage])

  const { data, isLoading, refetch } = $api.useQuery("get", "/api/services", {
    params: { query: { page, search } },
  })

  const services = data?.items ?? []
  const pages = data?.pages ?? 1

  const deleteMutation = $api.useMutation("delete", "/api/services/{service_id}", {
    onSuccess: () => refetch(),
  })

  const handleDelete = (id: number) => {
    if (confirm("Удалить услугу?")) {
      deleteMutation.mutate({ params: { path: { service_id: id } } })
    }
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Услуги</h1>
        <Button asChild>
          <Link href="/services/new">
            <Plus className="mr-2 h-4 w-4" /> Добавить
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Поиск по названию или порядку оплаты..."
        />
      </div>

      <PaginatedTable
        data={services}
        pages={pages}
        columns={[
          { header: "Название", accessor: "name" },
          {
            header: "Стоимость",
            accessor: (service) =>
              `${Number(service.price).toLocaleString("ru-RU")} руб.`,
          },
          {
            header: "Порядок оплаты",
            accessor: "payment_terms",
            className: "max-w-xs truncate",
          },
        ]}
        renderActions={(service) => (
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href={`/services/${service.id}/edit`}>
                <Pencil className="h-6 w-6" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(service.id)}>
              <Trash2 className="h-6 w-6 text-red-500" />
            </Button>
          </div>
        )}
      />
    </div>
  )
}
