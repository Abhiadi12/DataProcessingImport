/**
 * Redis keys. Written by the worker, read by the API — so they must agree, and
 * live here for the same reason the queue names do.
 */
export const REDIS_KEYS = {
  /** HASH: live counters + stage for one import. */
  progress: (importId: string): string => `import:${importId}:progress`,
  /** STRING "1": set by the cancel endpoint, polled by the worker between batches. */
  cancel: (importId: string): string => `import:${importId}:cancel`,
} as const;

/**
 * Progress keys expire a day after the import ends.
 *
 * Nothing durable is lost: Postgres holds the authoritative counters, so an
 * expired key just means `/progress` falls back to the database. Without a TTL,
 * every import that ever ran would leak a hash forever.
 */
export const PROGRESS_TTL_SECONDS = 24 * 60 * 60;

/** Cancel flags are short-lived — a cancel is acted on within one batch. */
export const CANCEL_TTL_SECONDS = 60 * 60;

/** Field names inside the progress hash. */
export const PROGRESS_FIELDS = {
  STAGE: "stage",
  BYTES_READ: "bytesRead",
  PROCESSED: "processed",
  SUCCESSFUL: "successful",
  FAILED: "failed",
  DUPLICATES: "duplicates",
  UPDATED_AT: "updatedAt",
} as const;

export const MAX_RETRY_ATTEMPTS = 2;
