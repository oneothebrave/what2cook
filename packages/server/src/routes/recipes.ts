import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function recipeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => { await req.jwtVerify() })

  /** GET /api/recipes — 搜索/浏览菜谱 */
  app.get('/', async (req) => {
    const { search, tags, page = '1' } = req.query as {
      search?: string; tags?: string; page?: string
    }
    const pageNum = parseInt(page)
    const tagList = tags ? tags.split(',') : []

    const [recipes, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where: {
          isPublished: true,
          ...(search ? { name: { contains: search } } : {}),
          ...(tagList.length ? { flavorTags: { hasSome: tagList } } : {}),
        },
        skip: (pageNum - 1) * 20,
        take: 20,
        select: {
          id: true, name: true, imageUrl: true, difficulty: true,
          cookTime: true, servings: true, flavorTags: true, categoryTags: true,
        },
      }),
      prisma.recipe.count({ where: { isPublished: true } }),
    ])

    return { recipes, total, page: pageNum }
  })

  /** GET /api/recipes/:id — 菜谱详情 */
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    })
    if (!recipe) return reply.status(404).send({ error: '菜谱不存在' })
    return recipe
  })
}
