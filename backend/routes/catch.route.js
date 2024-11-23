import express from "express";

import { getCatches, createCatch, updateCatch, deleteCatch } from "../controllers/catch.controller.js";
import { authenticatedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticatedRoute, getCatches);

router.post("/", authenticatedRoute, createCatch);

router.put("/:id", authenticatedRoute, updateCatch);

router.delete("/:id", authenticatedRoute, deleteCatch);

export default router;