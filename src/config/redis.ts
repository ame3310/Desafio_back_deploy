import { RedisOptions } from "ioredis";

//para gestionar tickets por colas, si da tiempo

export function getRedisOptions(): RedisOptions {
  const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
  return { host: new URL(url).hostname, port: Number(new URL(url).port || 6379) };
}
