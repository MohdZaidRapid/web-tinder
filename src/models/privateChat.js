const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const privateChatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  messages: [privateMessageSchema],
});

const PrivateChat = mongoose.model("PrivateChat", privateChatSchema);

module.exports = { PrivateChat };
