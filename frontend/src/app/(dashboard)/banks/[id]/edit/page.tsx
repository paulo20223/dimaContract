"use client"

import { useEffect, useState } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { $api } from "@/lib/api-client"

export default function EditBankPage() {
  useSetPageTitle("Редактировать банк")
  const router = useRouter()
  const params = useParams()
  const bankId = Number(params.id)

  const [form, setForm] = useState({
    name: "",
    bik: "",
    correspondent_account: "",
  })

  const { data: bank, isLoading, isError } = $api.useQuery("get", "/api/banks/{bank_id}", {
    params: { path: { bank_id: bankId } },
  })

  const updateMutation = $api.useMutation("put", "/api/banks/{bank_id}", {
    onSuccess: () => router.back(),
    onError: () => alert("Ошибка при сохранении банка"),
  })

  useEffect(() => {
    if (bank) {
      setForm({
        name: bank.name,
        bik: bank.bik,
        correspondent_account: bank.correspondent_account,
      })
    }
  }, [bank])

  useEffect(() => {
    if (isError) {
      alert("Ошибка при загрузке данных")
      router.back()
    }
  }, [isError, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      params: { path: { bank_id: bankId } },
      body: form,
    })
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="space-y-4">
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
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
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
