import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = upload.single('file');

export const createPost = async (req, res) => {
	try {
	  const { text, video } = req.body;
	  console.log('Received video URL:', video); // Add this line to check if video URL is received
	  const userId = req.user._id.toString();
	  
	  const user = await User.findById(userId);
	  if (!user) return res.status(404).json({ message: "User not found" });
  
	  // Check if at least one of text, image, or video exists
	  if (!text && !req.file && !video) {
		return res.status(400).json({ error: "Post must have text, image, or video" });
	  }
  
	  let imgUrl = null;
	  let videoUrl = null;
  
	  // Handle image upload using multer (if image file is uploaded)
	  if (req.file) {
		const buffer = req.file.buffer;
		const base64Image = buffer.toString('base64');
		const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;
		
		// Upload image to Cloudinary
		const uploadedResponse = await cloudinary.uploader.upload(dataUri, {
		  folder: 'posts',
		});
		imgUrl = uploadedResponse.secure_url; // Save the image URL
	  }
  
	  // Handle video URL (Firebase video URL passed from frontend)
	  if (video) {
		const isValidUrl = (string) => {
		  try {
			new URL(string);
			return true;
		  } catch {
			return false;
		  }
		};
		
		if (!isValidUrl(video)) {
		  return res.status(400).json({ error: "Invalid video URL" });
		}
		videoUrl = video; // Use the video URL from the frontend
	  }
  
	  // Create a new post
	  const newPost = new Post({
		user: userId,
		text,
		img: imgUrl,     // Store image URL if uploaded
		video: videoUrl,  // Store video URL if provided
	  });
  
	  await newPost.save();
	  res.status(201).json(newPost);
	} catch (error) {
	  console.error("Error in createPost controller: ", error);
	  res.status(500).json({ error: "Internal server error" });
	}
  };  

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user ? req.user._id : null;

		if (!userId) {
			return res.status(401).json({ error: "User is not authenticated" });
		}

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = { user: userId, text };
		post.comments.push(comment);
		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};


export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
			await notification.save();

			const updatedLikes = post.likes;
			res.status(200).json(updatedLikes);
		}
	} catch (error) {
		console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		if (posts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
export const getPostById = async (req, res) => {
	try {
	  const { id } = req.params;
	  const post = await Post.findById(id)
		.populate({
		  path: "user",
		  select: "-password",
		})
		.populate({
		  path: "comments.user",
		  select: "-password",
		});
  
	  if (!post) {
		return res.status(404).json({ error: "Post not found" });
	  }
  
	  res.status(200).json(post);
	} catch (error) {
	  console.log("Error in getPostById controller: ", error);
	  res.status(500).json({ error: "Internal server error" });
	}
  };
  export const getRelatedPosts = async (req, res) => {
	const { id } = req.params;
  
	try {
	  // Fetch the current post
	  const currentPost = await Post.findById(id);
	  if (!currentPost) {
		return res.status(404).json({ message: 'Post not found' });
	  }
  
	  let relatedPosts = [];
  
	  // Since tags are not defined, skip related posts based on tags
	  // Instead, you can define other criteria for relatedness or fetch random posts
  
	  // Example: Fetch random posts excluding the current one
	  relatedPosts = await Post.aggregate([
		{ $match: { _id: { $ne: currentPost._id } } }, // Exclude the current post
		{ $sample: { size: 5 } }, // Get 5 random posts
	  ]);
  
	  // Populate random posts with user data
	  for (let post of relatedPosts) {
		post.user = await User.findById(post.user).select('username profileImg fullName');
	  }
  
	  res.status(200).json(relatedPosts);
	} catch (error) {
	  console.error('Error fetching related posts:', error);  // Detailed error logging
	  res.status(500).json({ message: 'Server error', error: error.message });
	}
  };
  