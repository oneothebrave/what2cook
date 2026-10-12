import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

// 微信登录地址
const WX_LOGIN_URL = 'https://api.weixin.qq.com/sns/jscode2session'

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/login
   * 微信小程序登录（用code换openid，返回JWT）
   */
  app.post('/login', {
    schema: {
      body: z.object({ code: z.string() }),
    },
  }, async (req, reply) => {
    const { code } = req.body as { code: string }

    // 用code换取openid
    const wxRes = await axios.get(WX_LOGIN_URL, {
      params: {
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
    })

    const { openid, errcode, errmsg } = wxRes.data
    if (errcode) {
      return reply.status(400).send({ error: `微信登录失败: ${errmsg}` })
    }

    // 查找或创建用户
    const user = await prisma.user.upsert({
      where: { openid },
      update: {},
      create: { openid },
    })

    // 签发JWT
    const token = app.jwt.sign({ userId: user.id, openid }, { expiresIn: '30d' })

    return { token, userId: user.id, hasFamily: !!user.familyId }
  })
}
