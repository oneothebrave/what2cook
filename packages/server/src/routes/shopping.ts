import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function shoppingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => { await req.jwtVerify() })

  /**
   * POST /api/shopping/generate
   * 根据菜谱ID列表生成购物清单
   * 核心逻辑：汇总食材 → 合并同类 → 对比库存 → 标记已有/缺口
   */
  app.post('/generate', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { recipeIds } = req.body as { recipeIds: string[] }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family: { include: { pantryItems: true } } },
    })
    if (!user?.family) return reply.status(400).send({ error: '未设置家庭' })

    // 查询所有菜谱的食材
    const recipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { ingredients: true },
    })

    // 汇总并合并同类食材
    const itemMap = new Map<string, { quantity: number | null; unit: string | null }>()
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const existing = itemMap.get(ing.ingredientName)
        if (existing) {
          if (existing.quantity !== null && ing.quantity !== null) {
            existing.quantity += ing.quantity
          }
        } else {
          itemMap.set(ing.ingredientName, { quantity: ing.quantity, unit: ing.unit })
        }
      }
    }

    // 对比库存
    const pantryMap = new Map(user.family.pantryItems.map((p) => [p.ingredientName, p]))
    const shoppingItems = Array.from(itemMap.entries()).map(([name, { quantity, unit }]) => {
      const pantryItem = pantryMap.get(name)
      const isStaple = pantryItem?.isStaple && !pantryItem?.isDepleted
      const inPantry = isStaple || (
        pantryItem !== undefined &&
        (pantryItem.quantity === null || quantity === null || pantryItem.quantity >= quantity)
      )

      return {
        name,
        quantity,
        unit,
        checked: false,
        isFromPantry: inPantry,
        pantryQuantity: pantryItem?.quantity ?? null,
        neededQuantity: quantity,
        isStaple: pantryItem?.isStaple ?? false,
      }
    })

    // 排序：需购买的排在前面
    shoppingItems.sort((a, b) => (a.isFromPantry ? 1 : 0) - (b.isFromPantry ? 1 : 0))

    return shoppingItems
  })
}
