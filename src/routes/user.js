const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

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
    }).populate("fromUserId", USER_SAVE);

    const data = connectionRequests.map((row) => row.fromUserId);

    res.status(201).json({ data: data });
  } catch (err) {
    res.status(400).json({ message: +err.message });
  }
});

module.exports = userRouter;
