import { createDecoder, createSigner } from 'fast-jwt'

// openssl rand -base64 32
const SECRET = 'Ga9MAAzOZOCMjaQ8kcv4Eyyb6FJ4NW8gN2DmO9Wr2X4='

const signer = createSigner({
  key: SECRET,
  algorithm: 'HS256',
  expiresIn: 1000 * 60 * 60 * 24 // 1 day
})
const decoder = createDecoder({})

type JwtPayload = {
  sub: string
}

export const createToken = (payload: JwtPayload) => {
  return signer(payload)
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return decoder(token)
  } catch (error) {
    return null
  }
}

export const extractToken = (headers: Record<string, unknown>) => {
  const authorization = headers['authorization']

  if (!authorization) {
    return null
  }

  if (typeof authorization !== 'string') {
    return null
  }

  const [_, token] = authorization.split(' ')
  return token
}
