import { PrismaClient } from '@prisma/client'
import fastify from 'fastify'
import mercurius from 'mercurius'

import { schema } from './graphql/schema'
import { extractToken, verifyToken } from './utils/jwt'

const app = fastify({
  logger: true
})

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn']
})

app.register(mercurius, {
  schema: schema,
  graphiql: true,
  context(request) {
    const token = extractToken(request['headers'])
    if (!token) {
      return { prisma, session: null }
    }

    const payload = verifyToken(token)

    return {
      prisma,
      session: payload?.sub
    }
  }
})

app.listen({ port: 3000 })
