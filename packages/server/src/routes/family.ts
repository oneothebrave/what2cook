import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function familyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => { await req.jwtVerify() })

  /** GET /api/family — 获取家庭信息 */
  app.get('/', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family: { include: { restrictions: true } } },
    })
    if (!user?.family) return reply.status(404).send({ error: '未设置家庭信息' })
    return user.family
  })

  /** POST /api/family — 创建或更新家庭信息（Onboarding） */
  app.post('/', async (req) => {
    const { userId } = req.user as { userId: string }
    const body = req.body as {
      name?: string
      memberCount: number
      hasElder: boolean
      hasChildren: boolean
      cookingLevel: 'SIMPLE' | 'MEDIUM' | 'ADVANCED'
      flavorTags: string[]
      restrictions?: Array<{ restrictionType: string; ingredientName: string }>
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    let family

    if (user?.familyId) {
      // 更新已有家庭
      await prisma.familyRestriction.deleteMany({ where: { familyId: user.familyId } })
      family = await prisma.family.update({
        where: { id: user.familyId },
        data: {
          memberCount: body.memberCount,
          hasElder: body.hasElder,
          hasChildren: body.hasChildren,
          cookingLevel: body.cookingLevel as any,
          flavorTags: body.flavorTags,
          restrictions: {
            create: body.restrictions?.map((r) => ({
              restrictionType: r.restrictionType as any,
              ingredientName: r.ingredientName,
            })) ?? [],
          },
        },
        include: { restrictions: true },
      })
    } else {
      // 创建新家庭
      family = await prisma.family.create({
        data: {
          memberCount: body.memberCount,
          hasElder: body.hasElder,
          hasChildren: body.hasChildren,
          cookingLevel: body.cookingLevel as any,
          flavorTags: body.flavorTags,
          members: { connect: { id: userId } },
          restrictions: {
            create: body.restrictions?.map((r) => ({
              restrictionType: r.restrictionType as any,
              ingredientName: r.ingredientName,
            })) ?? [],
          },
        },
        include: { restrictions: true },
      })
      // 关联用户
      await prisma.user.update({ where: { id: userId }, data: { familyId: family.id } })
    }

    return family
  })
}
