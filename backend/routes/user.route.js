import express from "express";

import { getUsersProfile, getSuggestedUsers, searchUsers, followUnfollowUser } from "../controllers/user.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/", authenticatedRoute, getSuggestedUsers);
router.get("/:username/profile", authenticatedRoute, getUsersProfile);

router.get("/search", authenticatedRoute, searchUsers);

router.post("/:id/followUnfollow", authenticatedRoute, followUnfollowUser);

export default router;