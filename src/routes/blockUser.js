const mongoose = require("mongoose");
const express = require("express");
const BlockUserModel = require("../models/blockuser");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequestModel = require("../models/connectionRequest");

const blockUserRouter = express.Router();

// get all blocked user for current user
blockUserRouter.get("/block/blocked", userAuth, async (req, res) => {
  try {
    const user = req.user; // Authenticated user

    // MongoDB aggregation pipeline
    const blockedUsers = await BlockUserModel.aggregate([
      {
        $match: {
          blockedBy: user._id, // Filter by the current user's ID
        },
      },
      {
        $lookup: {
          from: "users", // Join with the User collection
          localField: "blockedTo", // Field in BlockUserModel
          foreignField: "_id", // Matching field in User model
          as: "userDetails", // Result array
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                emailId: 1,
                photoUrl: 1,
                skills: 1,
                isPremium: 1,
                gender: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$userDetails", // Deconstruct the userDetails array
      },
      {
        $addFields: {
          mergedDetails: {
            $mergeObjects: [
              "$userDetails", // Fields from the User collection
              {
                status: "$status", // Add status from BlockUserModel
                blockedAt: "$createdAt", // Add blockedAt timestamp
              },
            ],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$mergedDetails", // Replace the root with merged details
        },
      },
    ]);

    // Respond with merged data
    return res.status(200).json({
      message: "Blocked users fetched successfully.",
      totalBlockedUsers: blockedUsers.length,
      blockedUsers, // Merged data
    });
  } catch (error) {
    console.error("Error while fetching blocked users:", error);
    res.status(500).json({
      message: "An error occurred while fetching blocked users.",
      error: error.message,
    });
  }
});

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
          message: "This user is already blocked you.",
        });
      }

      // Remove the connection if it exists
      const connection = await ConnectionRequestModel.findOneAndDelete({
        $or: [
          { fromUserId: user._id, toUserId: blockUserId, status: "accepted" },
          { fromUserId: blockUserId, toUserId: user._id, status: "accepted" },
        ],
      });

      const interestedConnection =
        await ConnectionRequestModel.findOneAndDelete({
          $or: [
            {
              fromUserId: user._id,
              toUserId: blockUserId,
              status: "interested",
            },
            {
              fromUserId: blockUserId,
              toUserId: user._id,
              status: "interested",
            },
          ],
        });

      // Update the `blockedBy` and `blockedTo` arrays in the User model
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { blockedTo: blockUserId } }, // Add to `blockedTo` array if not already present
        { new: true }
      ).lean();

      await User.findByIdAndUpdate(
        blockUserId,
        { $addToSet: { blockedBy: user._id } }, // Add to `blockedBy` array if not already present
        { new: true }
      ).lean();

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

blockUserRouter.post(
  "/unBlock/:unBlockUserId",
  userAuth,
  async (req, res, next) => {
    try {
      const loggedInUser = req.user;
      const unBlockUserId = req.params.unBlockUserId;

      // Validate the unBlockUserId
      if (!mongoose.Types.ObjectId.isValid(unBlockUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if the user to be unblocked exists
      const findBlockedUser = await User.findById(unBlockUserId);
      if (!findBlockedUser) {
        return res
          .status(404)
          .json({ message: "User you are trying to unblock does not exist" });
      }

      // Check if the blocking relationship exists
      const findBlockUser = await BlockUserModel.findOne({
        $or: [
          {
            blockedBy: loggedInUser._id,
            blockedTo: unBlockUserId,
            status: "blocked",
          },
          {
            blockedBy: unBlockUserId,
            blockedTo: loggedInUser._id,
            status: "blocked",
          },
        ],
      });

      if (!findBlockUser) {
        return res
          .status(400)
          .json({ message: "This user is already unblocked by you" });
      }

      // Check if the unblocked user has blocked the current user
      const findIfUserBlockedUs = await BlockUserModel.findOne({
        blockedBy: unBlockUserId,
        blockedTo: loggedInUser._id,
        status: "blocked",
      });

      if (findIfUserBlockedUs) {
        return res.status(403).json({
          message: "You cannot unblock this user because they blocked you",
        });
      }

      // Update the `blockedTo` and `blockedBy` arrays in the User model
      await User.findByIdAndUpdate(
        loggedInUser._id,
        { $pull: { blockedTo: unBlockUserId } }, // Remove from `blockedTo`
        { new: true }
      );

      await User.findByIdAndUpdate(
        unBlockUserId,
        { $pull: { blockedBy: loggedInUser._id } }, // Remove from `blockedBy`
        { new: true }
      );

      // Remove the block entry from the BlockUserModel
      await BlockUserModel.findOneAndDelete({
        blockedBy: loggedInUser._id,
        blockedTo: unBlockUserId,
      });

      // Send a success response
      return res.status(200).json({
        message: "User has been successfully unblocked.",
      });
    } catch (error) {
      console.error("Error while unblocking user:", error);
      res.status(500).json({
        message: "An error occurred while unblocking the user.",
        error: error.message,
      });
    }
  }
);

module.exports = blockUserRouter;
