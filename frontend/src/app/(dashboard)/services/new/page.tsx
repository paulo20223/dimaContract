"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { $api } from "@/lib/api-client"

export default function NewServicePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    price: "",
    payment_terms: "",
  })

  const createMutation = $api.useMutation("post", "/api/services", {
    onSuccess: () => router.push("/services"),
    onError: () => alert("Ошибка при создании услуги"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      body: {
        name: form.name,
        price: parseFloat(form.price),
        payment_terms: form.payment_terms,
      },
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Создать услугу</h1>

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
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создание..." : "Создать услугу"}
          </Button>
        </div>
      </form>
    </div>
  )
}
