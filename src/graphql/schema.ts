import SchemaBuilder from '@pothos/core'
import ErrorsPlugin from '@pothos/plugin-errors'
import { PrismaClient } from '@prisma/client'
import { hash, verify } from 'argon2'
import { createToken } from '../utils/jwt'

import { TAuth, TUser } from './types/user'

type TSchema = {
  Objects: {
    User: TUser
    Auth: TAuth
  }
  Context: {
    prisma: PrismaClient
    session: string | null
  }
}

export type TBuilder = typeof builder

const builder = new SchemaBuilder<TSchema>({
  plugins: [ErrorsPlugin],
  errorOptions: {
    defaultTypes: []
  }
})

// GRAPHQL TYPES
builder.objectType('User', {
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt')
  })
})

builder.objectType('Auth', {
  fields: (t) => ({
    token: t.exposeString('token')
  })
})

builder.objectType(Error, {
  name: 'Error',
  fields: (t) => ({
    message: t.exposeString('message')
  })
})

// GRAPHQL INPUTS
const CreateUserInput = builder.inputType('CreateUserInput', {
  fields: (t) => ({
    name: t.string({
      required: true
    }),
    email: t.string({
      required: true
    }),
    password: t.string({
      required: true
    })
  })
})

const LoginInput = builder.inputType('LoginInput', {
  fields: (t) => ({
    email: t.string({
      required: true
    }),
    password: t.string({
      required: true
    })
  })
})

// GRAPHQL QUERIES
builder.queryType({
  fields: (t) => ({
    profile: t.field({
      description: 'Current user profile',
      type: 'User',
      errors: {
        types: [Error]
      },
      resolve: async (_, __, { prisma, session }) => {
        const err = new Error('Unauthorized')

        if (!session) {
          throw err
        }

        const user = await prisma.user.findUnique({
          where: {
            id: session
          }
        })

        if (!user) {
          throw err
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      }
    }),
    users: t.field({
      description: 'Get all users',
      type: ['User'],
      resolve: async (_, __, { prisma }) => {
        const users = await prisma.user.findMany()

        return users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }))
      }
    })
  })
})

// GRAPHQL MUTATIONS
builder.mutationType({
  fields: (t) => ({
    createUser: t.field({
      description: 'Create a new user',
      type: 'User',
      errors: {
        types: [Error]
      },
      args: {
        input: t.arg({ type: CreateUserInput, required: true })
      },
      resolve: async (_, { input }, { prisma }) => {
        const existingUser = await prisma.user.findUnique({
          where: {
            email: input.email
          }
        })

        if (existingUser) {
          throw new Error('User already exists')
        }

        const user = await prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: await hash(input.password)
          }
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      }
    }),
    login: t.field({
      description: 'Authenticate User',
      type: 'Auth',
      errors: {
        types: [Error]
      },
      args: {
        input: t.arg({ type: LoginInput, required: true })
      },
      resolve: async (_, { input }, { prisma }) => {
        const err = new Error('Invalid credentials')

        const user = await prisma.user.findUnique({
          where: {
            email: input.email
          }
        })

        if (!user) {
          throw err
        }

        const valid = await verify(user.password, input.password)
        if (!valid) {
          throw err
        }

        const token = createToken({
          sub: user.id
        })

        return {
          token
        }
      }
    })
  })
})

export const schema = builder.toSchema()
