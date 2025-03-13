import express from "express";

import { getAllCatches, getUserCatches, createCatch, updateCatch, deleteCatch, getCatchesFeed, createComment, deleteComment, updateComment, likeUnlikeCatch } from "../controllers/catch.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/feed", authenticatedRoute, getCatchesFeed);

router.get("/user/:username", authenticatedRoute,getUserCatches);

router.get("/", authenticatedRoute, getAllCatches);
router.post("/", authenticatedRoute, createCatch);
router.put("/:catchId", authenticatedRoute, updateCatch);
router.delete("/:catchId", authenticatedRoute, deleteCatch);

router.post("/:catchId/comments", authenticatedRoute, createComment);
router.delete("/:catchId/comments/:commentId", authenticatedRoute, deleteComment);
router.put("/:catchId/comments/:commentId", authenticatedRoute, updateComment);

router.post("/:catchId/like", authenticatedRoute, likeUnlikeCatch);




export default router;