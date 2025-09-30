import { Queue, Worker, QueueEvents, type JobsOptions, type Processor } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const connection = { url: REDIS_URL };

export function makeQueue<T extends object>(name: string) {
  const queue = new Queue<T>(name, { connection });
  const events = new QueueEvents(name, { connection });
  return { queue, events };
}

export function makeWorker<T extends object>(
  name: string,
  processor: Processor<T>,
) {
  return new Worker<T>(name, processor, { connection });
}

export const DEFAULT_JOB_OPTS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 },
};
