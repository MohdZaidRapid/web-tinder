const express = require("express");
const BlockUserModel = require("../models/blockUser");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequestModel = require("../models/connectionRequest");

const blockUserRouter = express.Router();

blockUserRouter.post(
  "/block/:blockUserId",
  userAuth,
  async (req, res, next) => {
    try {
      const blockUserId = req.params.blockUserId; // The user to be blocked
      const user = req.user; // Authenticated user performing the action

      // Check if the user to be blocked exists
      const userExists = await User.findById(blockUserId);
      if (!userExists) {
        return res.status(404).json({
          message: "The user you are trying to block does not exist.",
        });
      }

      // Check if the block entry already exists
      const blockToUser = await BlockUserModel.findOne({
        blockedTo: blockUserId,
        blockedBy: user._id,
      });

      if (blockToUser) {
        return res.status(400).json({
          message: "You have already blocked this user.",
        });
      }

      // Check if the user has already blocked the current user
      const userAlreadyBlockedYou = await User.findOne({
        _id: blockUserId,
        blockedBy: user._id,
      });

      if (userAlreadyBlockedYou) {
        return res.status(400).json({
          message:
            "You cannot block this user because they have already blocked you.",
        });
      }

      // Check if the user is already in the blockedBy array
      const alreadyInBlockedByArray = await User.findOne({
        _id: user._id,
        blockedBy: blockUserId,
      });

      if (alreadyInBlockedByArray) {
        return res.status(400).json({
          message: "This user is already in your blocked list.",
        });
      }

      // Remove the connection if it exists
      const connection = await ConnectionRequestModel.findOneAndDelete({
        $or: [
          { fromUserId: user._id, toUserId: blockUserId, status: "accepted" },
          { fromUserId: blockUserId, toUserId: user._id, status: "accepted" },
        ],
      });

      // Update the `blockedBy` and `blockedTo` arrays in the User model
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { blockedTo: blockUserId } }, // Add to `blockedTo` array if not already present
        { new: true }
      );

      await User.findByIdAndUpdate(
        blockUserId,
        { $addToSet: { blockedBy: user._id } }, // Add to `blockedBy` array if not already present
        { new: true }
      );

      // Create a new block entry in the BlockUserModel
      const newBlockEntry = new BlockUserModel({
        blockedTo: blockUserId,
        blockedBy: user._id,
        status: "blocked",
      });

      await newBlockEntry.save();

      return res.status(200).json({
        message:
          "The user has been successfully blocked, and the connection (if any) has been removed.",
        block: newBlockEntry,
      });
    } catch (error) {
      console.error("Error while blocking the user:", error);
      res.status(500).json({
        message:
          "An error occurred while blocking the user. Please try again later.",
        error: error.message,
      });
    }
  }
);

module.exports = blockUserRouter;
