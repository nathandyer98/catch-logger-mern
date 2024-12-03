import express from "express";

import { getCurrentProfile, getUsersProfile } from "../controllers/user.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/me", authenticatedRoute, getCurrentProfile);

router.get("/:username", authenticatedRoute, getUsersProfile);

// router.post("/:id/follow", authenticatedRoute, followUser);

// router.delete("/:id/unfollow", authenticatedRoute, unfollowUser);

export default router;