"use client"

import { useCallback, useState } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useQueryState, parseAsInteger } from "nuqs"
import Link from "next/link"
import { Plus, Pencil, Download } from "lucide-react"

const WordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="18" height="20" rx="2" fill="#2B579A" />
    <path d="M7 7L9.5 17L12 10L14.5 17L17 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PdfIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="18" height="20" rx="2" fill="#E53935" />
    <text x="12" y="14" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">PDF</text>
  </svg>
)

const ExcelIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="18" height="20" rx="2" fill="#217346" />
    <path d="M8 8L12 12M12 12L16 16M12 12L16 8M12 12L8 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
import { Button } from "@/components/ui/button"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { SearchInput } from "@/components/ui/search-input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { $api, client } from "@/lib/api-client"
import type { components } from "@/lib/api-types"

type Contract = components["schemas"]["ContractResponse"]

export default function ContractsPage() {
  useSetPageTitle("Договоры")
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [downloadContract, setDownloadContract] = useState<Contract | null>(null)

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

  const handleDownloadPdf = async (contract: Contract) => {
    const { data, error } = await client.GET("/api/contracts/{contract_id}/download-pdf", {
      params: { path: { contract_id: contract.id } },
      parseAs: "blob",
    })

    if (error || !data) {
      alert("Ошибка при скачивании PDF")
      return
    }

    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `contract_${contract.number}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleDownloadInvoice = async (contract: Contract) => {
    const { data, error } = await client.GET("/api/contracts/{contract_id}/invoice", {
      params: { path: { contract_id: contract.id } },
      parseAs: "blob",
    })

    if (error || !data) {
      alert("Ошибка при скачивании счёта")
      return
    }

    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `invoice_${contract.number}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleDownloadInvoicePdf = async (contract: Contract) => {
    const { data, error } = await client.GET("/api/contracts/{contract_id}/invoice-pdf", {
      params: { path: { contract_id: contract.id } },
      parseAs: "blob",
    })

    if (error || !data) {
      alert("Ошибка при скачивании счёта PDF")
      return
    }

    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `invoice_${contract.number}.pdf`)
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
          <div className="flex gap-1">
            <Link href={`/contracts/${contract.id}/edit`}>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Pencil className="h-5 w-5" />
              </Button>
            </Link>

            <Button
              size="icon"
              className="h-9 w-9"
              onClick={() => setDownloadContract(contract)}
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        )}
      />

      <Dialog open={!!downloadContract} onOpenChange={(open) => !open && setDownloadContract(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Скачать документы</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Договор</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (downloadContract) {
                      handleDownload(downloadContract)
                      setDownloadContract(null)
                    }
                  }}
                >
                  <WordIcon className="h-5 w-5" />
                  DOCX
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (downloadContract) {
                      handleDownloadPdf(downloadContract)
                      setDownloadContract(null)
                    }
                  }}
                >
                  <PdfIcon className="h-5 w-5" />
                  PDF
                </Button>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Счёт</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (downloadContract) {
                      handleDownloadInvoice(downloadContract)
                      setDownloadContract(null)
                    }
                  }}
                >
                  <ExcelIcon className="h-5 w-5" />
                  XLSX
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (downloadContract) {
                      handleDownloadInvoicePdf(downloadContract)
                      setDownloadContract(null)
                    }
                  }}
                >
                  <PdfIcon className="h-5 w-5" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
