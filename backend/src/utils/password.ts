import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

const COST_FACTOR = 12;

const DUMMY_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), COST_FACTOR);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return hash !== null && matches;
}
