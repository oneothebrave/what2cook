import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { RecommendationEngine } from '../services/recommendation.js'

const prisma = new PrismaClient()
const engine = new RecommendationEngine()

export async function menuRoutes(app: FastifyInstance) {
  // 鉴权中间件
  app.addHook('preHandler', async (req, reply) => {
    await req.jwtVerify()
  })

  /**
   * POST /api/menus/recommend
   * 智能推荐今日菜单（综合家庭画像 + 库存 + 历史）
   */
  app.post('/recommend', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { count = 3, lockedIds = [], excludeIds = [] } = req.body as {
      count?: number
      lockedIds?: string[]
      excludeIds?: string[]
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family: { include: { restrictions: true, pantryItems: true } } },
    })

    if (!user?.family) {
      return reply.status(400).send({ error: '请先完成家庭信息设置' })
    }

    // 获取7天内的推荐历史
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentMenus = await prisma.dailyMenu.findMany({
      where: { familyId: user.family.id, menuDate: { gte: sevenDaysAgo } },
      include: { items: true },
    })
    const recentRecipeIds = recentMenus.flatMap((m) => m.items.map((i) => i.recipeId))

    // 调用推荐引擎
    const recommended = await engine.recommend({
      family: user.family,
      pantryItems: user.family.pantryItems,
      count,
      lockedIds,
      excludeIds: [...excludeIds, ...recentRecipeIds],
    })

    return recommended
  })

  /**
   * POST /api/menus/confirm
   * 用户确认菜单，写入daily_menus
   */
  app.post('/confirm', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { recipeIds } = req.body as { recipeIds: string[] }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.familyId) return reply.status(400).send({ error: '家庭信息未设置' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const menu = await prisma.dailyMenu.upsert({
      where: { id: `${user.familyId}-${today.toISOString().slice(0, 10)}-DINNER` },
      update: { isConfirmed: true },
      create: {
        familyId: user.familyId,
        menuDate: today,
        mealType: 'DINNER',
        isConfirmed: true,
        items: {
          create: recipeIds.map((recipeId, order) => ({ recipeId, order })),
        },
      },
    })

    return { menuId: menu.id }
  })
}
