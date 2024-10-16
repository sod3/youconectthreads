// controllers/stories.controller.js

import Story from "../models/stories.models.js";
import User from "../models/user.model.js";

// Existing createStory and getStories functions...

export const toggleLike = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    // Find the story by ID
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found." });
    }

    // Check if the user has already liked the story
    const hasLiked = story.likes.includes(userId);

    if (hasLiked) {
      // Unlike the story
      story.likes.pull(userId);
    } else {
      // Like the story
      story.likes.push(userId);
    }

    await story.save();

    res.status(200).json({ liked: !hasLiked, likeCount: story.likes.length });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const createStory = async (req, res) => {
  try {
    const { contentType, content } = req.body;

    // Validate contentType
    if (!["text", "image"].includes(contentType)) {
      return res.status(400).json({ message: "Invalid content type." });
    }

    // Validate content
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content cannot be empty." });
    }

    // For images, ensure content is a Base64 string
    if (contentType === "image") {
      const regex = /^data:image\/[a-zA-Z]+;base64,/;
      if (!regex.test(content)) {
        return res.status(400).json({ message: "Invalid image format." });
      }
    }

    const newStory = new Story({
      user: req.user._id,
      contentType,
      content,
    });

    await newStory.save();

    // **Populate the user field with necessary details**
    await newStory.populate("user", "username profileImg fullName");

    res.status(201).json(newStory);
  } catch (error) {
    console.error("Error creating story:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// controllers/stories.controller.js

export const getStories = async (req, res) => {
  try {
    // Get the authenticated user
    const currentUser = req.user._id;

    // Find the user in the database and get the list of users they are following
    const user = await User.findById(currentUser).populate("following", "username");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Get the IDs of the users the current user is following
    const followingIds = user.following.map((follow) => follow._id);

    // Include the current user's own stories in the list
    followingIds.push(currentUser);

    // Fetch stories where the user is either followed by the current user or is the current user
    const stories = await Story.find({ user: { $in: followingIds } })
      .populate("user", "username profileImg fullName")
      .sort({ createdAt: -1 });

    // Map stories to include like count and whether the current user has liked each story
    const storiesWithLikes = stories.map((story) => ({
      _id: story._id,
      user: story.user,
      contentType: story.contentType,
      content: story.content,
      createdAt: story.createdAt,
      likeCount: story.likes.length,
      likedByCurrentUser: story.likes.includes(currentUser),
    }));

    res.status(200).json(storiesWithLikes);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Server error." });
  }
};

