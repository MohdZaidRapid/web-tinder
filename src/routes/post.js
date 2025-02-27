const express = require("express");
const Post = require("../models/post");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const postRouter = express.Router();

// ✅ Create a Post
postRouter.post("/posts", userAuth, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const loggedInUser = req.user;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const post = new Post({
      content,
      imageUrl,
      createdBy: loggedInUser._id,
    });

    await post.save();
    res.status(201).json({ message: "Post created successfully", data: post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get All Posts
postRouter.get("/posts", userAuth, async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "createdBy",
      "firstName lastName photoUrl"
    );
    res.json({ data: posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Posts from Connections
postRouter.get("/posts/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Get all connected users
    const connections = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    });

    const connectionIds = connections.map((conn) =>
      conn.fromUserId.toString() === loggedInUser._id.toString()
        ? conn.toUserId
        : conn.fromUserId
    );

    // Fetch posts from connections
    const posts = await Post.find({
      createdBy: { $in: connectionIds },
    }).populate("createdBy", "firstName lastName photoUrl");
    res.json({ data: posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete a Post (only by the owner or admin)
postRouter.delete("/posts/:postId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      post.createdBy.toString() !== loggedInUser._id.toString() &&
      loggedInUser.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Like a Post
postRouter.post("/posts/:postId/like", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.includes(loggedInUser._id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== loggedInUser._id.toString()
      );
    } else {
      post.likes.push(loggedInUser._id);
    }

    await post.save();
    res.json({
      message: alreadyLiked ? "Unliked post" : "Liked post",
      data: post,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add a Comment
postRouter.post("/posts/:postId/comment", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { text } = req.body;

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: loggedInUser._id, text });
    await post.save();

    res.json({ message: "Comment added", data: post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.post("/posts/:postId/share", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const sharedPost = new Post({
      content: post.content,
      imageUrl: post.imageUrl,
      createdBy: loggedInUser._id,
      parentPost: post._id,
    });

    post.shares += 1;
    await post.save();
    await sharedPost.save();

    res.json({ message: "Post shared successfully", data: sharedPost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.get("/posts/trending", userAuth, async (req, res) => {
  try {
    const trendingHashtags = await Post.aggregate([
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({ data: trendingHashtags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.get("/posts/hashtag/:tag", userAuth, async (req, res) => {
  try {
    const posts = await Post.find({ hashtags: req.params.tag }).populate(
      "createdBy",
      "firstName lastName photoUrl"
    );

    res.json({ data: posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.post("/posts/:postId/save", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const postId = req.params.postId;

    const user = await User.findById(loggedInUser._id);

    if (user.savedPosts.includes(postId)) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId
      );
      await user.save();
      return res.json({ message: "Post removed from saved list" });
    }

    user.savedPosts.push(postId);
    await user.save();
    res.json({ message: "Post saved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.put("/posts/:postId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { content, imageUrl, visibility } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.createdBy.toString() !== loggedInUser._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    post.content = content || post.content;
    post.imageUrl = imageUrl || post.imageUrl;
    post.visibility = visibility || post.visibility;

    await post.save();
    res.json({ message: "Post updated successfully", data: post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  postRouter.post("/posts/:postId/report", userAuth, async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { reason } = req.body;

      const post = await Post.findById(req.params.postId);

      if (!post) return res.status(404).json({ message: "Post not found" });

      post.reports.push({ reportedBy: loggedInUser._id, reason });
      await post.save();

      res.json({ message: "Post reported successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
});

postRouter.post("/posts/:postId/report", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { reason } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.reports.push({ reportedBy: loggedInUser._id, reason });
    await post.save();

    res.json({ message: "Post reported successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.get("/posts/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    });

    const connectionIds = connections.map((conn) =>
      conn.fromUserId.toString() === loggedInUser._id.toString()
        ? conn.toUserId
        : conn.fromUserId
    );

    const posts = await Post.aggregate([
      {
        $match: {
          createdBy: { $in: connectionIds },
          visibility: { $in: ["public", "friends"] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
    ]);

    res.json({ data: posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = postRouter;
