"use client"

import { useState, useEffect } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { $api } from "@/lib/api-client"

export default function EditServicePage() {
  useSetPageTitle("Редактировать услугу")
  const router = useRouter()
  const params = useParams()
  const serviceId = Number(params.id)

  const [form, setForm] = useState({
    name: "",
    price: "",
    payment_terms: "",
  })

  const { data: service, isLoading } = $api.useQuery("get", "/api/services/{service_id}", {
    params: { path: { service_id: serviceId } },
  })

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        price: String(service.price),
        payment_terms: service.payment_terms,
      })
    }
  }, [service])

  const updateMutation = $api.useMutation("put", "/api/services/{service_id}", {
    onSuccess: () => router.push("/services"),
    onError: () => alert("Ошибка при обновлении услуги"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      params: { path: { service_id: serviceId } },
      body: {
        name: form.name,
        price: parseFloat(form.price),
        payment_terms: form.payment_terms,
      },
    })
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">
                Название
              </Label>
              <Textarea
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Например: Разработка сайта"
                required
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">
                Стоимость (руб.)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="50000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">
                Порядок оплаты
              </Label>
              <Textarea
                value={form.payment_terms}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                placeholder="Например: Оплата в течение 5 рабочих дней после подписания акта"
                required
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/services")}>
            Отмена
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </form>
    </div>
  )
}
