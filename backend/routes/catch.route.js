import express from "express";

import { getCatches, createCatch, updateCatch, deleteCatch } from "../controllers/catch.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", authenticatedRoute, getCatches);

router.get("/user/:id", authenticatedRoute,getCatches);

router.post("/", authenticatedRoute, createCatch);

router.put("/:catchId", authenticatedRoute, updateCatch);

router.delete("/:catchId", authenticatedRoute, deleteCatch);


// -----------------TO ADD----------------
// GET /catches/feed
// Fetch a feed of catches from followed users (paginated).
//-----------------POTENTIAL-----------------
// Comments and Likes (Optional, for engagement)

// POST /catches/:catchId/comments
// Add a comment to a specific catch.

// GET /catches/:catchId/comments
// Fetch comments for a specific catch.

// POST /catches/:catchId/like
// Like a specific catch.

// DELETE /catches/:catchId/like
// Unlike a specific catch.


export default router;