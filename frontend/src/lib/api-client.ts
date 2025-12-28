import createClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'
import type { paths } from './api-types'
import { getToken, removeToken } from './auth'

export const client = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

client.use({
  async onRequest({ request }) {
    const token = getToken()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      await removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return response
  },
})

export const $api = createQueryClient(client)