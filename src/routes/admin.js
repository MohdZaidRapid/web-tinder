const express = require("express");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const adminRole = require("../middlewares/admin");
const { default: mongoose } = require("mongoose");

const adminRouter = express.Router();

// Block User
adminRouter.post(
  "/admin/block/:userId",
  userAuth,
  adminRole,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(403).json({ message: "Cannot block an admin" });
      }

      await User.findByIdAndUpdate(userId, { $set: { isDeactivated: true } });

      return res.status(200).json({ message: "User blocked successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Unblock User
adminRouter.post(
  "/admin/unblock/:userId",
  userAuth,
  adminRole,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(403).json({ message: "Cannot unblock an admin" });
      }

      await User.findByIdAndUpdate(userId, { $set: { isDeactivated: false } });

      return res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Get all users (excluding admins)
adminRouter.get("/admin/get", userAuth, adminRole, async (req, res) => {
  try {
    const users = await User.find({ role: "user" });

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get a specific user by ID
adminRouter.get(
  "/admin/get/:userId",
  userAuth,
  adminRole,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await User.findById(userId).select(
        "firstName lastName isPremium gender role age photoUrl skills emailId"
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Delete a user by ID
adminRouter.delete(
  "/admin/delete/:userId",
  userAuth,
  adminRole,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

module.exports = adminRouter;
