import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { authRoutes } from './routes/auth.js'
import { recipeRoutes } from './routes/recipes.js'
import { menuRoutes } from './routes/menus.js'
import { shoppingRoutes } from './routes/shopping.js'
import { pantryRoutes } from './routes/pantry.js'
import { familyRoutes } from './routes/family.js'

const app = Fastify({ logger: true })

// ─── Plugins ───────────────────────────────────────────────────────────────

await app.register(cors, {
  origin: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
})

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// ─── Routes ────────────────────────────────────────────────────────────────

await app.register(authRoutes,     { prefix: '/api/auth' })
await app.register(familyRoutes,   { prefix: '/api/family' })
await app.register(recipeRoutes,   { prefix: '/api/recipes' })
await app.register(menuRoutes,     { prefix: '/api/menus' })
await app.register(shoppingRoutes, { prefix: '/api/shopping' })
await app.register(pantryRoutes,   { prefix: '/api/pantry' })

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Start ─────────────────────────────────────────────────────────────────

try {
  const port = parseInt(process.env.PORT ?? '3000')
  const host = process.env.HOST ?? '0.0.0.0'
  await app.listen({ port, host })
  console.log(`🍳 今晚吃什么 API 已启动: http://${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
