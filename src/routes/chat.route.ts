import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getDMChatHistory,
  getGroupChatHistory,
  createGroup,
  getUserGroups,
  requestJoinGroup,
  handleJoinRequest,
  removeFromGroup,
  getAvailableGroups,
  getJoinRequests,
  addMemberToGroup,
  deleteGroup,
} from "../controllers/chat.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// Direct message routes
router.get("/dm/:userId", getDMChatHistory);

// Group routes
router.get("/groups", getUserGroups);
router.post("/groups", requireAdmin, createGroup);
router.get("/groups/avail", getAvailableGroups);
router.get("/groups/:groupId/messages", getGroupChatHistory);
router.get("/groups/requests", getJoinRequests);
router.post("/groups/:groupId/join", requestJoinGroup);
router.post("/groups/requests/:requestId", handleJoinRequest);
router.delete("/groups/:groupId/members/:userId", removeFromGroup);
router.post("/groups/:groupId/members", addMemberToGroup);
router.delete("/groups/:groupId", deleteGroup);

export default router;
