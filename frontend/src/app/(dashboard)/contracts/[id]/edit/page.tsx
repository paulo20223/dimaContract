"use client"

import { useState, useEffect } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClientCombobox } from "@/components/ui/client-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus } from "lucide-react"
import Link from "next/link"
import { $api } from "@/lib/api-client"

export default function EditContractPage() {
  useSetPageTitle("Редактировать договор")
  const router = useRouter()
  const params = useParams()
  const contractId = Number(params.id)

  const [form, setForm] = useState({
    number: "",
    client_id: "",
    date: undefined as Date | undefined,
    service_ids: [] as number[],
  })

  const { data: contract, isLoading: contractLoading } = $api.useQuery(
    "get",
    "/api/contracts/{contract_id}",
    { params: { path: { contract_id: contractId } } }
  )

  const { data: servicesData, isLoading: servicesLoading } = $api.useQuery("get", "/api/services")

  const services = servicesData?.items ?? []

  useEffect(() => {
    if (contract) {
      setForm({
        number: contract.number,
        client_id: String(contract.client_id),
        date: contract.date ? new Date(contract.date + "T00:00:00") : undefined,
        service_ids: contract.services.map((s) => s.id),
      })
    }
  }, [contract])

  const updateMutation = $api.useMutation("put", "/api/contracts/{contract_id}", {
    onSuccess: () => router.push("/contracts"),
    onError: () => alert("Ошибка при обновлении договора"),
  })

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter((sid) => sid !== id)
        : [...prev.service_ids, id],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.service_ids.length === 0) {
      alert("Выберите хотя бы одну услугу")
      return
    }
    if (!form.date) {
      alert("Выберите дату")
      return
    }
    const dateStr = form.date.toISOString().split("T")[0]
    updateMutation.mutate({
      params: { path: { contract_id: contractId } },
      body: {
        number: form.number,
        client_id: parseInt(form.client_id),
        contract_date: dateStr as unknown as undefined,
        service_ids: form.service_ids,
      },
    })
  }

  const selectedServices = services.filter((s) => form.service_ids.includes(s.id))
  const totalSum = selectedServices.reduce((sum, s) => sum + Number(s.price), 0)

  if (contractLoading || servicesLoading) return <div>Загрузка...</div>

  if (!contract) return <div>Договор не найден</div>

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Номер договора <span className="text-red-500">*</span></Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="Например: 2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Дата <span className="text-red-500">*</span></Label>
              <DatePicker
                value={form.date}
                onChange={(date) => date && setForm({ ...form, date })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Клиент <span className="text-red-500">*</span></Label>
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link href="/clients/new">
                    <Plus className="mr-1 h-4 w-4" />
                    Создать клиента
                  </Link>
                </Button>
              </div>
              <ClientCombobox
                value={form.client_id}
                onChange={(value) => setForm({ ...form, client_id: value })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <Label className="text-lg font-medium">Услуги <span className="text-red-500">*</span></Label>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/services/new">
                <Plus className="mr-1 h-4 w-4" />
                Создать услугу
              </Link>
            </Button>
          </div>
          {services.length === 0 ? (
            <p className="text-gray-500">Нет доступных услуг</p>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                    form.service_ids.includes(service.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.service_ids.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.payment_terms}</div>
                    </div>
                  </div>
                  <div className="font-medium">
                    {Number(service.price).toLocaleString("ru-RU")} руб.
                  </div>
                </label>
              ))}
            </div>
          )}

          {selectedServices.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-lg font-medium">
                <span>Итого:</span>
                <span>{totalSum.toLocaleString("ru-RU")} руб.</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/contracts")}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={updateMutation.isPending || !form.client_id || !form.date}>
            {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </form>
    </div>
  )
}
