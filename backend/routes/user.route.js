import express from "express";

import { getUsersProfile, getSuggestedUsers ,followUnfollowUser } from "../controllers/user.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/", authenticatedRoute, getSuggestedUsers);

router.get("/:username", authenticatedRoute, getUsersProfile);

router.post("/:id/followUnfollow", authenticatedRoute, followUnfollowUser);

export default router;