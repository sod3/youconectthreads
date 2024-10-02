import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
	commentOnPost,
	createPost,
	deletePost,
	getAllPosts,
	getFollowingPosts,
	getLikedPosts,
	getUserPosts,
	likeUnlikePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", getLikedPosts);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", commentOnPost);
router.delete("/:id", protectRoute, deletePost);

export default router;
