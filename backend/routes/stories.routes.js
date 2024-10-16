// routes/story.routes.js

import express from "express";
import { createStory, getStories, toggleLike } from "../controllers/stories.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createStory);

router.post("/:storyId/like", protectRoute, toggleLike);

router.get("/", protectRoute, getStories);

export default router;
