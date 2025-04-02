import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

(async () => {
  await redisClient.connect();
  console.log("Connected to Redis");
})();

export const cache = {
  async get(key: string) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, ttl: number = 3600) {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  },

  async del(key: string) {
    await redisClient.del(key);
  },
};

export default redisClient;
