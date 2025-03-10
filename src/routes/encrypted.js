const express = require("express");
const crypto = require("crypto");
const { PrivateChat } = require("../models/privateChat");
const { userAuth } = require("../middlewares/auth");

const encryptedRouter = express.Router();
const algorithm = "aes-256-cbc";

const encryptMessage = (text, password) => {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256");

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return `${salt.toString("base64")}:${iv.toString("base64")}:${encrypted}`;
};

const decryptMessage = (encryptedText, password) => {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) throw new Error("Invalid encryption format");

    const salt = Buffer.from(parts[0], "base64");
    const iv = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    const key = crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    return null;
  }
};

encryptedRouter.post("/sendMessage", userAuth, async (req, res) => {
  try {
    const { targetUserId, encryptedText } = req.body;
    const userId = req.user._id;

    let chat = await PrivateChat.findOne({
      participants: { $all: [userId, targetUserId] },
    });

    if (!chat) {
      chat = new PrivateChat({
        participants: [userId, targetUserId],
        messages: [],
      });
    }

    chat.messages.push({ senderId: userId, text: encryptedText });
    await chat.save();

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

encryptedRouter.get(
  "/getMessages/:targetUserId",
  userAuth,
  async (req, res) => {
    try {
      const { targetUserId } = req.params;
      const userId = req.user._id;

      const chat = await PrivateChat.findOne({
        participants: { $all: [userId, targetUserId] },
      });

      if (!chat) return res.status(404).json({ message: "No messages found" });

      res.json({ messages: chat.messages });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// New API to decrypt messages in the backend
encryptedRouter.post("/decryptMessage", (req, res) => {
  try {
    const { encryptedText, password } = req.body;
    const decryptedText = decryptMessage(encryptedText, password);

    if (!decryptedText) {
      return res
        .status(400)
        .json({ error: "Decryption failed. Invalid password." });
    }

    res.json({ decryptedText });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = encryptedRouter;
