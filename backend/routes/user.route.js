import express from "express";

import { getUsersProfile, getSuggestedUsers ,followUser, unfollowUser } from "../controllers/user.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

//router.get("/me", authenticatedRoute, getCurrentProfile);

router.get("/:username", authenticatedRoute, getUsersProfile);

router.get("/suggested", authenticatedRoute, getSuggestedUsers);

router.post("/:id/follow", authenticatedRoute, followUser);

router.delete("/:id/unfollow", authenticatedRoute, unfollowUser);

export default router;