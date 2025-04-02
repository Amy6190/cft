import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { query } from "../utils/db";
import { cache } from "../utils/cache";

dotenv.config();

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Missing fields" });

  const hashedPassword = await bcrypt.hash(password, 10);
  await query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);

  res.status(201).json({ message: "User registered" });
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const result = await query("SELECT id, password FROM users WHERE username = $1", [username]);
  
    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  
    const userId = result.rows[0].id;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  
    const existingSession = await cache.get(`session:${userId}`);
    if (existingSession) {
      io.to(existingSession).emit("forceLogout");
      await cache.del(`session:${userId}`);
    }
  
    await cache.set(`session:${userId}`, token, 3600);
  
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });
  
    res.json({ message: "Login successful", token });
  };

  export const logout = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    await cache.del(`session:${userId}`);
  
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  };
