import express from "express";

import { getUserProfile } from "../controllers/user.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/me", authenticatedRoute, getUserProfile);

router.get("/:username", authenticatedRoute, getUserProfile);

// router.post("/:id/follow", authenticatedRoute, followUser);

// router.delete("/:id/unfollow", authenticatedRoute, unfollowUser);

export default router;