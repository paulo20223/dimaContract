"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { $api } from "@/lib/api-client"
import { setToken } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const loginMutation = $api.useMutation("post", "/api/auth/login", {
    onSuccess: async (data) => {
      await setToken(data.access_token)
      router.push("/contracts")
    },
    onError: () => {
      setError("Неверный пароль")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    loginMutation.mutate({ body: { password } })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-3xl font-bold" style={{ color: '#4056a1' }}>
          LEXAUDIT
        </h1>
        <p className="mb-6 text-center text-gray-500">Вход в систему</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Вход..." : "Войти"}
          </Button>
        </form>
      </div>
    </div>
  )
}
