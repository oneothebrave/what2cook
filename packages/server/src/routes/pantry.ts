import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { generateAIText } from '@ai-sdk/google'
import { writeFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

export async function pantryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => { await req.jwtVerify() })

  /** GET /api/pantry — 获取当前家庭库存 */
  app.get('/', async (req) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.familyId) return []
    return prisma.pantryItem.findMany({ where: { familyId: user.familyId } })
  })

  /** POST /api/pantry — 新增或更新单个食材库存 */
  app.post('/', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.familyId) return reply.status(400).send({ error: '未设置家庭' })

    const body = req.body as {
      ingredientName: string
      quantity?: number
      unit?: string
      isStaple?: boolean
      isDepleted?: boolean
      expiryDate?: string
    }

    return prisma.pantryItem.upsert({
      where: { familyId_ingredientName: { familyId: user.familyId, ingredientName: body.ingredientName } },
      update: { ...body, lastUpdated: new Date() },
      create: { familyId: user.familyId, ...body, source: 'MANUAL' },
    })
  })

  /** DELETE /api/pantry/:name — 删除库存食材 */
  app.delete('/:name', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { name } = req.params as { name: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.familyId) return reply.status(400).send({ error: '未设置家庭' })

    await prisma.pantryItem.deleteMany({
      where: { familyId: user.familyId, ingredientName: decodeURIComponent(name) },
    })
    return { ok: true }
  })

  /**
   * POST /api/pantry/upload
   * 上传冰箱照片 → AI识别食材
   */
  app.post('/upload', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.familyId) return reply.status(400).send({ error: '未设置家庭' })

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: '未上传文件' })

    // 读取图片buffer转base64
    const chunks: Buffer[] = []
    for await (const chunk of data.file) chunks.push(chunk)
    const imageBuffer = Buffer.concat(chunks)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = data.mimetype

    // 调用 Gemini Vision 识别食材
    const prompt = `
      请识别图片中所有可见的食材，以JSON数组格式输出：
      [{"name": "食材名", "quantity": 数量, "unit": "单位", "confidence": 置信度}]
      规则：
      - 食材名使用标准中文名称
      - 数量给出估算值（数字），无法估算则填0
      - unit使用：g/个/根/袋/瓶/包/块
      - confidence为0到1之间的小数
      - 只输出JSON，不要其他文字
    `

    let aiItems: Array<{ name: string; quantity: number; unit: string; confidence: number }> = []
    try {
      // TODO: 替换为实际的Gemini Vision调用
      // const result = await generateAIText({ model: 'gemini-2.0-flash', ... })
      // aiItems = JSON.parse(result.text)
      aiItems = [] // 占位，实际接入时替换
    } catch {
      aiItems = []
    }

    // 记录扫描日志
    const scanLog = await prisma.pantryScanLog.create({
      data: {
        familyId: user.familyId,
        photoUrl: `placeholder-${Date.now()}`, // TODO: 上传到COS
        aiRawResult: aiItems,
        modelUsed: 'gemini-2.0-flash',
      },
    })

    return { items: aiItems, scanLogId: scanLog.id, photoUrl: scanLog.photoUrl }
  })

  /**
   * POST /api/pantry/confirm-scan
   * 用户确认AI识别结果，批量写入库存
   */
  app.post('/confirm-scan', async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.familyId) return reply.status(400).send({ error: '未设置家庭' })

    const { scanLogId, confirmedItems } = req.body as {
      scanLogId: string
      confirmedItems: Array<{ name: string; quantity: number; unit: string }>
    }

    // 更新扫描日志
    await prisma.pantryScanLog.update({
      where: { id: scanLogId },
      data: { confirmedItems },
    })

    // 批量upsert食材库存
    const results = await Promise.all(
      confirmedItems.map((item) =>
        prisma.pantryItem.upsert({
          where: {
            familyId_ingredientName: {
              familyId: user.familyId!,
              ingredientName: item.name,
            },
          },
          update: { quantity: item.quantity, unit: item.unit, source: 'PHOTO_AI', lastUpdated: new Date() },
          create: {
            familyId: user.familyId!,
            ingredientName: item.name,
            quantity: item.quantity,
            unit: item.unit,
            source: 'PHOTO_AI',
          },
        })
      )
    )

    return results
  })
}
