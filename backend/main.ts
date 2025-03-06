import { Hono } from 'hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/', (c: Context) => {
  return c.text('This is template project for Hono')
})

Deno.serve(app.fetch)
