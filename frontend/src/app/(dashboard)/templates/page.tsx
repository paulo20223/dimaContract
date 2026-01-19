"use client"

import { useCallback } from "react"
import { useSetPageTitle } from "@/hooks/use-set-page-title"
import { useQueryState, parseAsInteger } from "nuqs"
import { Plus, Pencil, Trash2, Copy, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { $api } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"

export default function TemplatesPage() {
  useSetPageTitle("Шаблоны договоров")
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

  const { data, isLoading, refetch } = $api.useQuery("get", "/api/templates", {
    params: { query: { page } },
  })

  const templates = data?.items ?? []
  const pages = data?.pages ?? 1

  const deleteMutation = $api.useMutation("delete", "/api/templates/{template_id}", {
    onSuccess: () => refetch(),
    onError: () => {
      alert("Ошибка при удалении шаблона")
    },
  })

  const duplicateMutation = $api.useMutation("post", "/api/templates/{template_id}/duplicate", {
    onSuccess: () => refetch(),
    onError: () => alert("Ошибка при дублировании шаблона"),
  })

  const setDefaultMutation = $api.useMutation("put", "/api/templates/{template_id}/set-default", {
    onSuccess: () => refetch(),
    onError: () => alert("Ошибка при установке шаблона по умолчанию"),
  })

  const handleDelete = (id: number, isDefault: boolean) => {
    if (isDefault) {
      alert("Невозможно удалить шаблон по умолчанию")
      return
    }
    if (confirm("Удалить шаблон?")) {
      deleteMutation.mutate({ params: { path: { template_id: id } } })
    }
  }

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ params: { path: { template_id: id } } })
  }

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate({ params: { path: { template_id: id } } })
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" /> Добавить
          </Link>
        </Button>
      </div>

      <PaginatedTable
        data={templates}
        pages={pages}
        columns={[
          {
            header: "Название",
            accessor: (template) => (
              <div className="flex items-center gap-2">
                {template.name}
                {template.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    По умолчанию
                  </Badge>
                )}
              </div>
            ),
          },
          {
            header: "Описание",
            accessor: "description",
            className: "max-w-xs truncate text-gray-500",
          },
          {
            header: "Секций",
            accessor: (template) => template.sections?.length || 0,
            className: "text-center w-24",
          },
          {
            header: "Создан",
            accessor: (template) =>
              new Date(template.created_at).toLocaleDateString("ru-RU"),
            className: "w-32",
          },
        ]}
        renderActions={(template) => (
          <div className="flex gap-1.5">
            {!template.is_default && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleSetDefault(template.id)}
                title="Установить по умолчанию"
              >
                <Star className="h-5 w-5 text-yellow-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleDuplicate(template.id)}
              title="Дублировать"
            >
              <Copy className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href={`/templates/${template.id}/edit`}>
                <Pencil className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleDelete(template.id, template.is_default)}
              disabled={template.is_default}
            >
              <Trash2 className={`h-5 w-5 ${template.is_default ? "text-gray-300" : "text-red-500"}`} />
            </Button>
          </div>
        )}
      />
    </div>
  )
}
