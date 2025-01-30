const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequestModel = require("../models/connectionRequest");
const User = require("../models/user");
const BlockUser = require("../models/blockUser");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    console.log("userId", userId);
    console.log("targetUserId", targetUserId);

    const user = await User.findOne({ _id: targetUserId });
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    const blockedUser = await User.findOne({
      _id: targetUserId,
      isDeactivated: true,
    });
    if (blockedUser) {
      return res.status(403).json({ message: "User is deactivated by admin" });
    }

    const isBlocked = await BlockUser.findOne({
      $or: [
        { blockedTo: targetUserId, blockedBy: userId },
        { blockedBy: targetUserId, blockedTo: userId },
      ],
    });

    if (isBlocked) {
      return res
        .status(403)
        .json({ message: "User is blocked or you blocked the user" });
    }

    let connectionExists = await ConnectionRequestModel.findOne({
      $or: [
        {
          fromUserId: userId.toString(),
          toUserId: targetUserId.toString(),
          status: "accepted",
        },
        {
          fromUserId: targetUserId.toString(),
          toUserId: userId.toString(),
          status: "accepted",
        },
      ],
    });

    if (!connectionExists) {
      return res
        .status(401)
        .json({ message: "Connection does not exist", status: 401 });
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = chatRouter;
