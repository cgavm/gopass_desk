import { PrismaClient, User } from '@prisma/client';
import { CreateUserInput, UpdateUserInput } from './users.dto';

export type UsersRepository = ReturnType<typeof createUsersRepository>;

export const createUsersRepository = (prisma: PrismaClient) => {
  const userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  return {
    findAll: (): Promise<Omit<User, 'passwordHash'>[]> =>
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      }),

    findById: (id: string): Promise<Omit<User, 'passwordHash'> | null> =>
      prisma.user.findUnique({ where: { id }, select: userSelect }),

    findByEmail: (email: string): Promise<User | null> =>
      prisma.user.findUnique({ where: { email } }),

    create: (
      data: CreateUserInput & { passwordHash: string }
    ): Promise<Omit<User, 'passwordHash'>> =>
      prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
          role: data.role ?? 'USER',
        },
        select: userSelect,
      }),

    update: (
      id: string,
      data: UpdateUserInput
    ): Promise<Omit<User, 'passwordHash'>> =>
      prisma.user.update({
        where: { id },
        data: {
          ...(data.email !== undefined && { email: data.email }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        select: userSelect,
      }),

    deactivate: (id: string): Promise<Omit<User, 'passwordHash'>> =>
      prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: userSelect,
      }),
  };
};
