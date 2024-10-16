// models/story.model.js

import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video"],
      required: true,
    },
    content: {
      type: String, // For text: the text itself; for image/video: Base64 string
      required: true,
    },
    likes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // TTL index: 24 hours in seconds
    },
  },
  { timestamps: true }
);

// Ensure TTL index on createdAt field
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Story = mongoose.model("Story", storySchema);

export default Story;
