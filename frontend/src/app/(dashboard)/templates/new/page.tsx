"use client"

import { useState, useEffect } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { $api } from "@/lib/api-client"

interface Section {
  number: number | null
  title: string
  paragraphs: string[]
}

export default function NewTemplatePage() {
  useSetPageTitle("Создать шаблон")
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_default: false,
  })
  const [sections, setSections] = useState<Section[]>([
    { number: null, title: "Предмет договора", paragraphs: [""] },
  ])

  // Загружаем шаблон по умолчанию для автозаполнения
  const { data: defaultTemplate, isLoading: isLoadingDefault } = $api.useQuery(
    "get",
    "/api/templates/default"
  )

  // Автозаполнение секций из шаблона по умолчанию
  useEffect(() => {
    if (defaultTemplate?.sections && defaultTemplate.sections.length > 0) {
      setSections(
        defaultTemplate.sections.map((s) => ({
          number: s.number ?? null,
          title: s.title,
          paragraphs: [...s.paragraphs],
        }))
      )
    }
  }, [defaultTemplate])

  const createMutation = $api.useMutation("post", "/api/templates", {
    onSuccess: () => router.push("/templates"),
    onError: () => alert("Ошибка при создании шаблона"),
  })

  const addSection = () => {
    setSections([
      ...sections,
      { number: sections.length + 1, title: "", paragraphs: [""] },
    ])
  }

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return
    const newSections = [...sections]
    ;[newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]
    setSections(newSections)
  }

  const updateSection = (index: number, field: keyof Section, value: unknown) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setSections(newSections)
  }

  const addParagraph = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].paragraphs.push("")
    setSections(newSections)
  }

  const removeParagraph = (sectionIndex: number, paragraphIndex: number) => {
    const newSections = [...sections]
    if (newSections[sectionIndex].paragraphs.length > 1) {
      newSections[sectionIndex].paragraphs = newSections[sectionIndex].paragraphs.filter(
        (_, i) => i !== paragraphIndex
      )
      setSections(newSections)
    }
  }

  const updateParagraph = (sectionIndex: number, paragraphIndex: number, value: string) => {
    const newSections = [...sections]
    newSections[sectionIndex].paragraphs[paragraphIndex] = value
    setSections(newSections)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const filteredSections = sections
      .filter((s) => s.title.trim() !== "")
      .map((s) => ({
        ...s,
        paragraphs: s.paragraphs.filter((p) => p.trim() !== ""),
      }))

    if (filteredSections.length === 0) {
      alert("Добавьте хотя бы одну секцию")
      return
    }

    createMutation.mutate({
      body: {
        name: form.name,
        description: form.description || null,
        is_default: form.is_default,
        sections: filteredSections,
      },
    })
  }

  if (isLoadingDefault) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Загрузка шаблона...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium">Основные данные</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">
                Название шаблона
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Например: Договор на разработку ПО"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Краткое описание шаблона..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={form.is_default}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_default: checked === true })
                }
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Использовать по умолчанию
              </Label>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Секции договора</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="mr-1 h-4 w-4" />
              Добавить секцию
            </Button>
          </div>

          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Номер</Label>
                      <Input
                        type="number"
                        value={section.number ?? ""}
                        onChange={(e) =>
                          updateSection(
                            sectionIndex,
                            "number",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        placeholder="Авто"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">
                        Заголовок
                      </Label>
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(sectionIndex, "title", e.target.value)
                        }
                        placeholder="Например: Предмет договора"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(sectionIndex, "up")}
                      disabled={sectionIndex === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(sectionIndex, "down")}
                      disabled={sectionIndex === sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(sectionIndex)}
                      disabled={sections.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Пункты</Label>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <div key={paragraphIndex} className="flex gap-2">
                      <Textarea
                        value={paragraph}
                        onChange={(e) =>
                          updateParagraph(sectionIndex, paragraphIndex, e.target.value)
                        }
                        placeholder={`Пункт ${paragraphIndex + 1}...`}
                        className="min-h-[60px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParagraph(sectionIndex, paragraphIndex)}
                        disabled={section.paragraphs.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addParagraph(sectionIndex)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Добавить пункт
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/templates")}>
            Отмена
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создание..." : "Создать шаблон"}
          </Button>
        </div>
      </form>
    </div>
  )
}
