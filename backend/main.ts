import { Hono } from 'hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/', (c: Context) => {
  return c.text('This is template project for Hono')
})

// ヘルスチェック用エンドポイント
app.get('/health', (c: Context) => {
  return c.json({ status: 'ok' })
})

// 環境変数からポート番号を取得
const port = parseInt(Deno.env.get('PORT') || '3000')

console.log(`Starting server on port ${port}...`)
Deno.serve({ port }, app.fetch)
