import { User } from "@prisma/client";

export type TUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type TAuth = {
  token: string;
};

export const mapUserFromPrisma = (user: User): TUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
