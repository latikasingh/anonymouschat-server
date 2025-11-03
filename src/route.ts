import express from "express";
import authRoutes from "./routes/auth.route";
import blockedIpRoutes from "./routes/blockedIp.route";
import chatRoutes from "./routes/chat.route";
import userRoutes from "./routes/user.route";
import { authenticate } from "./middleware/auth.middleware";
import ipChecker from "./middleware/ipChecker.middleware";

const router = express.Router();

router.use("/auth", authRoutes);

router.use(authenticate);
router.use(ipChecker);
router.use("/blockedIp", blockedIpRoutes);
router.use("/chat", chatRoutes);
router.use("/users", userRoutes);

export default router;
