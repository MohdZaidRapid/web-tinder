const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const BlockUserModel = require("../models/blockUser");

const USER_SAVE = "firstName lastName photoUrl age gender about skills role";
// Get all the pending connection request for the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAVE);
    // }).populate("fromUserId", ["firstName", "lastName"]);
    res.json({
      message: "Data Fetched Successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // zaid -> abu  => accepted
    // elon -> mark =>accepted

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAVE)
      .populate("toUserId", USER_SAVE);
    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.status(201).json({ data: data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Find all connection requests (sent + received)
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId , toUserId");

    const hidesUserFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hidesUserFromFeed.add(req.fromUserId.toString());
      hidesUserFromFeed.add(req.toUserId.toString());
    });

    const blockUsers = await BlockUserModel.find({
      $or: [{ blockedBy: req.user._id }, { blockedTo: req.user._id }],
    }).select("blockedBy blockedTo");

    blockUsers.forEach((req) => {
      hidesUserFromFeed.add(req.blockedBy);
      hidesUserFromFeed.add(req.blockedTo);
    });

    const userAdmin = await User.find({ role: "admin" });

    userAdmin.forEach((req) => {
      hidesUserFromFeed.add(req._id.toString());
    });

    // Fetch all users except the ones in hidesUserFromFeed and the logged-in user
    const users = await User.find({
      isDeactivated: false,
      $and: [
        { _id: { $nin: Array.from(hidesUserFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    }).select(USER_SAVE);

    // Send all users in the response
    res.send(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
