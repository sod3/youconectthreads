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
  getPostById,
  getRelatedPosts,
  updatePost, // Ensure you have this imported
} from "../controllers/post.controller.js";
import multer from "multer";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define routes with multer middleware where necessary
router.get("/all", getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", getLikedPosts);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, upload.single("img"), createPost); // Apply multer here
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);
router.get("/:id", getPostById);
router.get('/related/:id', getRelatedPosts);
router.put("/:id", protectRoute, upload.single("img"), updatePost); // New route for updating posts

export default router;
