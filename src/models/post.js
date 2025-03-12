const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema], // Replies array
});

const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
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
    hashtags: [{ type: String }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema], // Nested comments structure
    shares: { type: Number, default: 0 },
    parentPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    reports: [
      {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
      },
    ],

    // ✅ Post Buying Features
    price: { type: Number, required: false }, // Price of post (only if for sale)
    isForSale: { type: Boolean, default: false }, // Flag to check if post is buyable
    currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Owner of the post
    previousOwners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Past owners
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
