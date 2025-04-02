import express from "express";
import { getUserProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/profile", authMiddleware, getUserProfile);

export default router;
