const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;

    res.send(user);
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    // validateprofileEditdata
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
      //   return res.status(400).send("");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();
    res.json({
      message: ` ${loggedInUser.firstName} Profile Updated successfully`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERRROR : " + err.message);
  }
});

module.exports = profileRouter;
