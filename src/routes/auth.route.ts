import { Router } from "express";
import {
  adminSignup,
  login,
  verifyOtp,
  role,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", adminSignup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/role", authenticate, role);


export default router;
