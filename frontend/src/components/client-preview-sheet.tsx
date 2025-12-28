"use client"

import { Download, Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { $api, client } from "@/lib/api-client"
import type { components } from "@/lib/api-types"

type Client = components["schemas"]["ClientResponse"]
type Contract = components["schemas"]["ContractResponse"]

interface ClientPreviewSheetProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  ip: "ИП",
  ooo: "ООО",
  ao: "АО",
  pao: "ПАО",
  nko: "НКО",
  fl: "Физлицо",
}

export function ClientPreviewSheet({
  client: selectedClient,
  open,
  onOpenChange,
}: ClientPreviewSheetProps) {
  const { data: contracts, isLoading: contractsLoading } = $api.useQuery(
    "get",
    "/api/clients/{client_id}/contracts",
    {
      params: { path: { client_id: selectedClient?.id ?? 0 } },
    },
    {
      enabled: !!selectedClient?.id && open,
    }
  )

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
    window.URL.revokeObjectURL(url)
  }

  if (!selectedClient) return null

  const fullName = [
    selectedClient.last_name,
    selectedClient.first_name,
    selectedClient.patronymic,
  ].filter(Boolean).join(" ")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left">
            {selectedClient.name}
          </SheetTitle>
        </SheetHeader>

        {/* Client Details Section */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">
              Информация о клиенте
            </h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clients/${selectedClient.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </Link>
            </Button>
          </div>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Тип</dt>
              <dd className="text-sm font-medium">
                {CLIENT_TYPE_LABELS[selectedClient.client_type] || selectedClient.client_type}
              </dd>
            </div>
            {fullName && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">ФИО</dt>
                <dd className="text-sm font-medium">{fullName}</dd>
              </div>
            )}
            {selectedClient.inn && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">ИНН</dt>
                <dd className="text-sm font-medium">{selectedClient.inn}</dd>
              </div>
            )}
            {selectedClient.ogrn && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">ОГРН</dt>
                <dd className="text-sm font-medium">{selectedClient.ogrn}</dd>
              </div>
            )}
            {selectedClient.address && (
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-gray-500 shrink-0">Адрес</dt>
                <dd className="text-sm font-medium text-right">
                  {selectedClient.address}
                </dd>
              </div>
            )}
            {selectedClient.email && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium">{selectedClient.email}</dd>
              </div>
            )}
            {selectedClient.phone && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Телефон</dt>
                <dd className="text-sm font-medium">{selectedClient.phone}</dd>
              </div>
            )}
            {selectedClient.bank && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Банк</dt>
                <dd className="text-sm font-medium">{selectedClient.bank.name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contracts Section */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">
            Договоры клиента
          </h3>

          {contractsLoading ? (
            <div className="text-sm text-gray-500">Загрузка...</div>
          ) : contracts?.length === 0 ? (
            <div className="text-sm text-gray-500">Нет договоров</div>
          ) : (
            <div className="space-y-3">
              {contracts?.map((contract) => {
                const total = contract.services?.reduce(
                  (sum, s) => sum + parseFloat(s.price || "0"),
                  0
                ) ?? 0

                return (
                  <div
                    key={contract.id}
                    className="p-3 bg-gray-50 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{contract.number}</div>
                        <div className="text-xs text-gray-500">
                          от {new Date(contract.date).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/contracts/${contract.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(contract)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {contract.services && contract.services.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Услуги:</div>
                        <ul className="space-y-1">
                          {contract.services.map((service) => (
                            <li key={service.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">{service.name}</span>
                              <span className="font-medium">
                                {parseFloat(service.price).toLocaleString("ru-RU")} ₽
                              </span>
                            </li>
                          ))}
                        </ul>
                        {contract.services.length > 1 && (
                          <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-gray-200">
                            <span>Итого:</span>
                            <span>{total.toLocaleString("ru-RU")} ₽</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
