"use client"

import { useCallback } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useQueryState, parseAsInteger } from "nuqs"
import Link from "next/link"
import { Plus, Download, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { SearchInput } from "@/components/ui/search-input"
import { $api, client } from "@/lib/api-client"
import type { components } from "@/lib/api-types"

type Contract = components["schemas"]["ContractResponse"]

export default function ContractsPage() {
  useSetPageTitle("Договоры")
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

  const handleSearchChange = useCallback(async (value: string) => {
    await setSearch(value)
    await setPage(1)
  }, [setSearch, setPage])

  const { data, isLoading } = $api.useQuery("get", "/api/contracts", {
    params: { query: { page, search } },
  })

  const contracts = data?.items ?? []
  const pages = data?.pages ?? 1

  const handleDownload = async (contract: Contract) => {
    const { data, error } = await client.GET("/api/contracts/{contract_id}/download", {
      params: { path: { contract_id: contract.id } },
      parseAs: "blob",
    })

    if (error || !data) {
      alert("Ошибка при скачивании")
      return
    }

    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `contract_${contract.number}.docx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Link href="/contracts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Создать договор
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Поиск по номеру или клиенту..."
        />
      </div>

      <PaginatedTable
        data={contracts}
        pages={pages}
        columns={[
          { header: "Номер", accessor: "number", className: "font-medium" },
          { header: "Клиент", accessor: (contract) => contract.client?.name ?? "" },
          {
            header: "Дата",
            accessor: (contract) =>
              new Date(contract.date).toLocaleDateString("ru-RU"),
          },
          {
            header: "Услуги",
            accessor: (contract) => `${contract.services.length} услуг(а)`,
          },
        ]}
        renderActions={(contract) => (
          <div className="flex gap-1.5">
            <Link href={`/contracts/${contract.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Pencil className="h-6 w-6" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleDownload(contract)}
            >
              <Download className="h-6 w-6" />
            </Button>
          </div>
        )}
      />
    </div>
  )
}
