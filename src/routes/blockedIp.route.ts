import express from "express";
import { requireAdmin } from "../middleware/role.middleware";
import {
  getAllBlocked,
  setBlocked,
  unblock,
} from "../controllers/blockedIp.controller";

const router = express.Router();

router.use(requireAdmin);

router.get("/", getAllBlocked);
router.post("/", setBlocked);
router.delete("/:id", unblock);

export default router;
