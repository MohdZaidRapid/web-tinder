const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequestModel = require("../models/connectionRequest");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  // console.log(targetUserId);

  const userId = req.user._id;
  console.log(userId.toString());
  console.log(targetUserId.toString());

  try {
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
        .json({ message: "Connction does not exists", status: 401 });
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
    console.log(err);
  }
});

module.exports = chatRouter;
