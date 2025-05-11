import Redis from "ioredis";

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
  }
  return redisClient;
}
