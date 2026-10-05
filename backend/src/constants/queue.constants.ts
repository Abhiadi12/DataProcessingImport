/**
 * Queue topology names. Shared by the publisher (API) and the consumer
 * (worker) — if the two ever disagreed, messages would be published into a
 * queue nobody reads, with no error anywhere.
 */
export const EXCHANGES = {
  /** Where import jobs are published. */
  MAIN: "imports",
  /** Dead-letter exchange: where the main queue sends messages it rejects. */
  DLX: "imports.dlx",
} as const;

export const QUEUES = {
  /** Workers consume from here. */
  PROCESS: "imports.process",
  /**
   * A DELAY LINE, not a worklist. Nothing consumes it: messages sit out their
   * TTL and then dead-letter back onto MAIN. That is how retry backoff is
   * achieved without nack(requeue: true), which redelivers instantly and spins
   * the CPU.
   */
  RETRY: "imports.retry",
  /** Terminal. Inspectable in the management UI; re-driven by hand. */
  DLQ: "imports.dlq",
} as const;

export const ROUTING_KEYS = {
  PROCESS: "import.process",
} as const;

/** How long a message waits in the retry queue before returning to MAIN. */
export const RETRY_DELAY_MS = 30_000;

/**
 * One unacked delivery per worker.
 *
 * Without this a single worker grabs a batch of messages it cannot process for
 * hours, and `--scale worker=4` stops distributing work.
 */
export const WORKER_PREFETCH = 1;

/** Rows per batch insert. See docs/PIPELINE_WALKTHROUGH.md. */
export const IMPORT_BATCH_SIZE = 1000;
