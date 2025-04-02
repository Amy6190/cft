import { Request, Response } from "express";
import { query } from "../utils/db";
import { cache } from "../utils/cache";

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const cacheKey = `user:${userId}`;

  const cachedData = await cache.get(cacheKey);
  if (cachedData) {
    return res.json({ source: "cache", data: cachedData });
  }

  const result = await query("SELECT id, username FROM users WHERE id = $1", [userId]);
  if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

  const user = result.rows[0];

  await cache.set(cacheKey, user, 3600);

  res.json({ source: "database", data: user });
};
