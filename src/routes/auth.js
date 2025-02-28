const express = require("express");
const jwt = require("jsonwebtoken");
const { validateSignupData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { userAuth } = require("../middlewares/auth");

const authRouter = express.Router();

// Signup Route
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.isDeactivated) {
      throw new Error("User is deactivated. Please contact admin.");
    }

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Enable secure cookies in production
        sameSite: "none", // Required for cross-origin cookies
      });

      res.json({ message: "Login successful!", user });
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Signup Route
authRouter.post("/signup", async (req, res) => {
  const { firstName, lastName, emailId, password } = req.body;
  try {
    validateSignupData(req);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    res
      .status(201)
      .json({ message: "User added successfully", data: savedUser });
  } catch (error) {
    res.status(500).send("ERROR: " + error.message);
  }
});

// Logout Route
authRouter.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(400).send("No active session found");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (user) {
      user.token = null;
      await user.save();
    }

    res.clearCookie("token").send("Logged out successfully");
  } catch (err) {
    res.status(400).send("Error logging out");
  }
});

// Check Authentication Route
// const jwt = require("jsonwebtoken");
// const User = require("../models/user");

authRouter.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ isDeactivated: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("isDeactivated");

    if (!user) {
      return res
        .status(404)
        .json({ isDeactivated: false, message: "User not found" });
    }

    return res.json({ isDeactivated: user.isDeactivated });
  } catch (error) {
    return res
      .status(400)
      .json({ isDeactivated: false, message: "Invalid or expired token" });
  }
});

module.exports = authRouter;
