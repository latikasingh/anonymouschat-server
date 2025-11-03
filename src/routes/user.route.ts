import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";
import { getAllUsers, removeUser } from "../controllers/user.controller";

const router = Router();

router.use(authenticate);

router.get("/", getAllUsers);
router.delete("/:userId", removeUser);

export default router;
