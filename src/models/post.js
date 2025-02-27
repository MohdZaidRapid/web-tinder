const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      validate(value) {
        if (value && !/^https?:\/\/.*\.(jpg|jpeg|png|gif)$/.test(value)) {
          throw new Error("Invalid image URL format");
        }
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
    hashtags: [{ type: String }], // For searching and trends
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Tagging users
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shares: { type: Number, default: 0 }, // Number of times shared
    parentPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // If shared
    reports: [
      {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
