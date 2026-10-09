// 2^12 bcrypt rounds: slow enough to frustrate offline cracking (~250ms per
// hash), fast enough that one login doesn't feel sluggish.
export const BCRYPT_COST_FACTOR = 12;

// 32 bytes = 256 bits of randomness in a refresh token.
export const REFRESH_TOKEN_BYTES = 32;

// Pinned on verify as well as sign, so a forged token can't pick its own
// algorithm (the classic "alg: none" attack).
export const JWT_ALGORITHM = "HS256" as const;

// An HS256 secret shorter than its 256-bit output weakens the signature.
export const JWT_SECRET_MIN_LENGTH = 32;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
