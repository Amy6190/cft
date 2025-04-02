import express from "express";
import http from "http";
import { Server as SocketServer, Socket } from "socket.io";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { verifyToken } from "./middlewares/authMiddleware";
import redisClient, { cache } from "./utils/cache";
import { query } from "./utils/db";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  },
});

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

// Store active sessions (userId -> socketId)
const activeSessions = new Map<string, string>();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split("=")[1];

    if (!token) return next(new Error("Unauthorized"));

    const decoded: any = verifyToken(token);
    socket.data.user = decoded;

    const userId = decoded.userId;

    const existingSession = await cache.get(`session:${userId}`);

    if (existingSession) {
      io.to(existingSession).emit("forceLogout");
      await cache.del(`session:${userId}`);
    }

    await cache.set(`session:${userId}`, socket.id, 3600);

    activeSessions.set(userId, socket.id);
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket: Socket) => {
  const userId = socket.data.user.userId;

  console.log(`User ${userId} connected with socket ID: ${socket.id}`);

  socket.on("sendMessage", async (message) => {
    io.emit("newMessage", { userId, message });
  });

  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected`);
    activeSessions.delete(userId);
    await cache.del(`session:${userId}`);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
