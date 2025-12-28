"use client"

import { useCallback, useState } from "react"
import { useQueryState, parseAsInteger } from "nuqs"
import { Plus, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { SearchInput } from "@/components/ui/search-input"
import { ClientPreviewSheet } from "@/components/client-preview-sheet"
import { $api } from "@/lib/api-client"
import type { components } from "@/lib/api-types"

type Client = components["schemas"]["ClientResponse"]

const CLIENT_TYPE_LABELS: Record<string, string> = {
  ip: "ИП",
  ooo: "ООО",
  ao: "АО",
  pao: "ПАО",
  nko: "НКО",
  fl: "Физлицо",
}

export default function ClientsPage() {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleSearchChange = useCallback(async (value: string) => {
    await setSearch(value)
    await setPage(1)
  }, [setSearch, setPage])

  const handleRowClick = (client: Client) => {
    setSelectedClient(client)
    setPreviewOpen(true)
  }

  const { data, isLoading, refetch } = $api.useQuery("get", "/api/clients", {
    params: { query: { page, search } },
  })

  const clients = data?.items ?? []
  const pages = data?.pages ?? 1

  const deleteMutation = $api.useMutation("delete", "/api/clients/{client_id}", {
    onSuccess: () => refetch(),
  })

  const handleDelete = (id: number) => {
    if (confirm("Удалить клиента?")) {
      deleteMutation.mutate({ params: { path: { client_id: id } } })
    }
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" /> Добавить
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Поиск по названию, ИНН, ФИО, телефону, email..."
        />
      </div>

      <PaginatedTable
        data={clients}
        pages={pages}
        onRowClick={handleRowClick}
        columns={[
          {
            header: "Тип",
            accessor: (client) => CLIENT_TYPE_LABELS[client.client_type] || client.client_type
          },
          { header: "Наименование", accessor: "name" },
          {
            header: "ФИО",
            accessor: (client) =>
              [client.last_name, client.first_name, client.patronymic].filter(Boolean).join(" "),
          },
          { header: "ИНН", accessor: "inn" },
          { header: "Телефон", accessor: "phone" },
          { header: "Банк", accessor: (client) => client.bank?.name ?? "" },
        ]}
        renderActions={(client) => (
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href={`/clients/${client.id}/edit`}>
                <Pencil className="h-6 w-6" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(client.id)}>
              <Trash2 className="h-6 w-6 text-red-500" />
            </Button>
          </div>
        )}
      />

      <ClientPreviewSheet
        client={selectedClient}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}
