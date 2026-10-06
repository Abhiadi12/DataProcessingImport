import { IdempotencyStatus, Prisma, type IdempotencyKey, type PrismaClient } from "@prisma/client";

export interface ClaimKeyInput {
  key: string;
  userId: string;
  endpoint: string;
  requestHash: string;
  expiresAt: Date;
}

export class IdempotencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async claim(input: ClaimKeyInput): Promise<boolean> {
    const { count } = await this.prisma.idempotencyKey.createMany({
      data: [input],
      skipDuplicates: true,
    });
    return count === 1;
  }

  async find(userId: string, endpoint: string, key: string): Promise<IdempotencyKey | null> {
    return this.prisma.idempotencyKey.findUnique({
      where: { userId_endpoint_key: { userId, endpoint, key } },
    });
  }

  async complete(
    id: string,
    responseCode: number,
    responseBody: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { id },
      data: { status: IdempotencyStatus.COMPLETED, responseCode, responseBody },
    });
  }

  /**
   *INFO: Release the key after a 5xx.
   *
   * Keeping it would BURN the key: the client could never retry, because every
   * attempt would see an IN_PROGRESS or COMPLETED row for a request that never
   * actually succeeded. A 5xx may well be transient, so the key must become
   * usable again. 4xx responses are kept and replayed instead — they are
   * deterministic, so repeating the request would fail identically.
   */
  async release(id: string): Promise<void> {
    await this.prisma.idempotencyKey.delete({ where: { id } });
  }

  /**
   *INFO: Reclaim a row abandoned by a crashed process.
   *
   * Without this, a worker dying mid-handler would leave IN_PROGRESS forever and
   * permanently poison that key. No handler here runs for minutes, so anything
   * older than the cutoff is safely assumed dead.
   */
  async reclaimIfStale(id: string, olderThan: Date, input: ClaimKeyInput): Promise<boolean> {
    const { count } = await this.prisma.idempotencyKey.updateMany({
      where: { id, status: IdempotencyStatus.IN_PROGRESS, createdAt: { lt: olderThan } },
      data: {
        requestHash: input.requestHash,
        createdAt: new Date(),
        expiresAt: input.expiresAt,
        responseCode: null,
        responseBody: Prisma.DbNull,
      },
    });
    return count === 1;
  }

  /**
   *INFO: Housekeeping for the eventual cleanup job.
   */
  async deleteExpired(now: Date): Promise<number> {
    const { count } = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return count;
  }
}
