import type { PrismaClient, RefreshToken } from "@prisma/client";

export interface CreateRefreshTokenData {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRefreshTokenData): Promise<void> {
    await this.prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  //INFO: make the current session's refresh token invalid, so it can't be used again. This is a security measure to prevent attacks.
  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  rotate(currentId: string, next: CreateRefreshTokenData): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.updateMany({
        where: { id: currentId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (count === 0) return false;

      await tx.refreshToken.create({ data: next });
      return true;
    });
  }
}
