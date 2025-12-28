"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClientCombobox } from "@/components/ui/client-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus } from "lucide-react"
import Link from "next/link"
import { $api } from "@/lib/api-client"

export default function NewContractPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    number: "",
    client_id: "",
    contract_date: new Date(),
    service_ids: [] as number[],
  })

  const { data: servicesData, isLoading: servicesLoading } = $api.useQuery("get", "/api/services")

  const services = servicesData?.items ?? []

  const createMutation = $api.useMutation("post", "/api/contracts", {
    onSuccess: () => router.push("/contracts"),
    onError: () => alert("Ошибка при создании договора"),
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
    const dateStr = form.contract_date.toISOString().split("T")[0]
    createMutation.mutate({
      body: {
        number: form.number,
        client_id: parseInt(form.client_id),
        contract_date: dateStr,
        service_ids: form.service_ids,
      },
    })
  }

  const selectedServices = services.filter((s) => form.service_ids.includes(s.id))
  const totalSum = selectedServices.reduce((sum, s) => sum + Number(s.price), 0)

  if (servicesLoading) return <div>Загрузка...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Создать договор</h1>

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
                value={form.contract_date}
                onChange={(date) => date && setForm({ ...form, contract_date: date })}
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
          <Button type="submit" disabled={createMutation.isPending || !form.client_id}>
            {createMutation.isPending ? "Создание..." : "Создать договор"}
          </Button>
        </div>
      </form>
    </div>
  )
}
