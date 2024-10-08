import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (ensure you have your credentials set up)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Replace with your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // Replace with your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Replace with your Cloudinary API secret
});

// Create Post
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let img = null;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !req.file) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    if (req.file) {
      // Upload the image to Cloudinary
      const buffer = req.file.buffer;
      const base64Image = buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

      const uploadedResponse = await cloudinary.uploader.upload(dataUri, {
        folder: 'posts', // Optional: specify folder in Cloudinary
      });
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log("Error in createPost controller: ", error);
  }
};

// Delete Post
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

// Comment on Post
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

// Like or Unlike Post
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

// Get All Posts
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

// Get Liked Posts
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

// Get Following Posts
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

// Get User's Posts
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

// Get Post By ID
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

// Get Related Posts
export const getRelatedPosts = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the current post
    const currentPost = await Post.findById(id);
    if (!currentPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let relatedPosts = [];

    // Find related posts based on tags if available
    if (currentPost.tags && currentPost.tags.length > 0) {
      relatedPosts = await Post.find({
        _id: { $ne: currentPost._id }, // Exclude the current post
        tags: { $in: currentPost.tags }, // Match posts that share tags
      })
        .limit(5)
        .populate('user', 'username profileImg')
        .populate('comments.user', '-password');
    }

    // If no related posts found, fetch random posts as a fallback
    if (relatedPosts.length === 0) {
      relatedPosts = await Post.aggregate([
        { $match: { _id: { $ne: currentPost._id } } }, // Exclude the current post
        { $sample: { size: 5 } }, // Get 5 random posts
      ]);

      // Populate random posts with user data
      for (let post of relatedPosts) {
        post.user = await User.findById(post.user).select('username profileImg');
        // Optionally populate comments
        post.comments = await Promise.all(
          post.comments.map(async (comment) => {
            const user = await User.findById(comment.user).select('username profileImg');
            return { ...comment.toObject(), user };
          })
        );
      }
    }

    res.status(200).json(relatedPosts);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Post
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text, removeImage } = req.body; // 'removeImage' should be 'true' or 'false'
    const userId = req.user._id;

    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user is the author of the post
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You are not authorized to edit this post" });
    }

    // Handle image removal
    if (removeImage === 'true' || removeImage === true) {
      if (post.img) {
        const imgId = post.img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId);
        post.img = null;
      }
    }

    // Handle new image upload
    if (req.file) {
      // If there's an existing image and it's not being removed, delete it
      if (post.img && !removeImage) {
        const imgId = post.img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId);
      }

      // Upload the new image to Cloudinary
      const buffer = req.file.buffer;
      const base64Image = buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

      const uploadedResponse = await cloudinary.uploader.upload(dataUri, {
        folder: 'posts', // Optional: specify folder in Cloudinary
      });

      post.img = uploadedResponse.secure_url;
    }

    // Update text if provided
    if (text) {
      post.text = text;
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in updatePost controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
