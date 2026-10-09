import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { BCRYPT_COST_FACTOR } from "../constants/index.js";

const DUMMY_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), BCRYPT_COST_FACTOR);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return hash !== null && matches;
}
