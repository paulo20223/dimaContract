"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BankCombobox } from "@/components/ui/bank-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { PresetSelect, POSITION_PRESETS, ACTING_BASIS_PRESETS } from "@/components/ui/preset-select"
import { format, parseISO } from "date-fns"
import { $api } from "@/lib/api-client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CLIENT_TYPES = {
  ip: "ИП",
  ooo: "ООО",
  ao: "АО",
  pao: "ПАО",
  nko: "НКО",
  fl: "Физлицо",
} as const

type ClientType = keyof typeof CLIENT_TYPES

const emptyForm = {
  client_type: "ip" as ClientType,
  company_name: "",  // Название организации для юрлиц (без типа и кавычек)
  ogrn: "",
  inn: "",
  kpp: "",
  address: "",
  email: "",
  phone: "",
  settlement_account: "",
  bank_id: "",
  last_name: "",
  first_name: "",
  patronymic: "",
  position: "",
  acting_basis: "",
  passport_series: "",
  passport_number: "",
  passport_issued_by: "",
  passport_issued_date: "",
}

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)

  const isLegalEntity = ["ooo", "ao", "pao", "nko"].includes(form.client_type)
  const isIndividual = form.client_type === "fl"
  const isIP = form.client_type === "ip"

  // Превью автогенерируемого наименования
  const getGeneratedName = () => {
    const fio = [form.last_name, form.first_name, form.patronymic]
      .filter(Boolean)
      .join(" ")

    if (form.client_type === "ip") return fio ? `ИП ${fio}` : ""
    if (form.client_type === "fl") return fio

    const orgForms: Record<string, string> = { ooo: "ООО", ao: "АО", pao: "ПАО", nko: "НКО" }
    const orgForm = orgForms[form.client_type] || ""
    return form.company_name ? `${orgForm} «${form.company_name}»` : ""
  }

  const createMutation = $api.useMutation("post", "/api/clients", {
    onSuccess: () => router.back(),
    onError: () => alert("Ошибка при создании клиента"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      ...form,
      bank_id: form.bank_id ? parseInt(form.bank_id) : null,
      passport_issued_date: form.passport_issued_date || null,
    }
    createMutation.mutate({ body })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Создать клиента</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Тип клиента */}
            <div className="col-span-1 space-y-2 md:col-span-2">
              <Label>Тип клиента <span className="text-red-500">*</span></Label>
              <Select
                value={form.client_type}
                onValueChange={(value: ClientType) => setForm({ ...form, client_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Название организации для юрлиц */}
            {isLegalEntity && (
              <div className="col-span-1 space-y-2 md:col-span-2">
                <Label>Название организации <span className="text-red-500">*</span></Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Рога и копыта"
                  required
                />
                <p className="text-sm text-gray-500">
                  Полное наименование: {getGeneratedName() || "—"}
                </p>
              </div>
            )}

            {/* ФИО */}
            <div className="space-y-2">
              <Label>Фамилия <span className="text-red-500">*</span></Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Имя <span className="text-red-500">*</span></Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Отчество</Label>
              <Input
                value={form.patronymic}
                onChange={(e) => setForm({ ...form, patronymic: e.target.value })}
              />
            </div>

            {/* Превью наименования для ИП и Физлица */}
            {(isIP || isIndividual) && getGeneratedName() && (
              <div className="col-span-1 space-y-2 md:col-span-2">
                <p className="text-sm text-gray-500">
                  Наименование: <span className="font-medium text-gray-900">{getGeneratedName()}</span>
                </p>
              </div>
            )}

            {/* Должность и основание для юрлиц */}
            {isLegalEntity && (
              <>
                <div className="space-y-2">
                  <Label>Должность</Label>
                  <PresetSelect
                    presets={POSITION_PRESETS}
                    value={form.position}
                    onChange={(v) => setForm({ ...form, position: v })}
                    placeholder="Введите должность"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Действует на основании</Label>
                  <PresetSelect
                    presets={ACTING_BASIS_PRESETS}
                    value={form.acting_basis}
                    onChange={(v) => setForm({ ...form, acting_basis: v })}
                    placeholder="Введите основание"
                  />
                </div>
              </>
            )}

            {/* ИНН */}
            <div className="space-y-2">
              <Label>ИНН</Label>
              <Input
                value={form.inn}
                onChange={(e) => setForm({ ...form, inn: e.target.value })}
                maxLength={isLegalEntity ? 10 : 12}
                placeholder={isLegalEntity ? "10 цифр" : "12 цифр"}
              />
            </div>

            {/* ОГРН/ОГРНИП */}
            {!isIndividual && (
              <div className="space-y-2">
                <Label>{isIP ? "ОГРНИП" : "ОГРН"}</Label>
                <Input
                  value={form.ogrn}
                  onChange={(e) => setForm({ ...form, ogrn: e.target.value })}
                  maxLength={isIP ? 15 : 13}
                  placeholder={isIP ? "15 цифр" : "13 цифр"}
                />
              </div>
            )}

            {/* КПП для юрлиц */}
            {isLegalEntity && (
              <div className="space-y-2">
                <Label>КПП</Label>
                <Input
                  value={form.kpp}
                  onChange={(e) => setForm({ ...form, kpp: e.target.value })}
                  maxLength={9}
                  placeholder="9 цифр"
                />
              </div>
            )}

            {/* Паспортные данные для физлиц */}
            {isIndividual && (
              <>
                <div className="space-y-2">
                  <Label>Серия паспорта</Label>
                  <Input
                    value={form.passport_series}
                    onChange={(e) => setForm({ ...form, passport_series: e.target.value })}
                    maxLength={4}
                    placeholder="4 цифры"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Номер паспорта</Label>
                  <Input
                    value={form.passport_number}
                    onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
                    maxLength={6}
                    placeholder="6 цифр"
                  />
                </div>
                <div className="col-span-1 space-y-2 md:col-span-2">
                  <Label>Кем выдан</Label>
                  <Textarea
                    value={form.passport_issued_by}
                    onChange={(e) => setForm({ ...form, passport_issued_by: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата выдачи</Label>
                  <DatePicker
                    value={form.passport_issued_date ? parseISO(form.passport_issued_date) : undefined}
                    onChange={(date) => setForm({ ...form, passport_issued_date: date ? format(date, "yyyy-MM-dd") : "" })}
                  />
                </div>
              </>
            )}

            {/* Адрес */}
            <div className="col-span-1 space-y-2 md:col-span-2">
              <Label>Адрес регистрации <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>

            {/* Контакты */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Банковские реквизиты */}
            <div className="space-y-2">
              <Label>Расчётный счёт</Label>
              <Input
                value={form.settlement_account}
                onChange={(e) => setForm({ ...form, settlement_account: e.target.value })}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label>Банк</Label>
              <BankCombobox
                value={form.bank_id}
                onChange={(value) => setForm({ ...form, bank_id: value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создание..." : "Создать клиента"}
          </Button>
        </div>
      </form>
    </div>
  )
}
