const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAVE = "firstName lastName photoUrl age gender about skills";
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
    // User should see all the user cards except
    // 0. his  own card
    // 1. his connections
    // 2. ignored people
    // 3 . already sent the connection request
    // Example  Rahul : [Akshay ,Elon,Mark,Donald,Ms Dhoni,Virat]
    // R --> Akshay->rejected R-->Elon->Accepted
    //  Akshay =[]

    const loggedInUser = req.user;
    // come as a string from body covert to interger
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Find all connection requests (sent + received)
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId , toUserId");
    //   .populate("fromUserId", "firstName")
    //   .populate("toUserId", "firstName");

    const hidesUserFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hidesUserFromFeed.add(req.fromUserId.toString());
      hidesUserFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hidesUserFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAVE)
      .skip(skip)
      .limit(limit);
    // console.log(hidesUserFromFeed);
    // [A,B,F,G,H] ->A
    // [A,B,C,D,E,F]

    res.send(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
