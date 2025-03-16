const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      fileUrl: String,
      fileType: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
module.exports = ChatRoom;
