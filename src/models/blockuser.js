const mongoose = require("mongoose");

const blockUserSchema = new mongoose.Schema({
  blockedTo: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  blockedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: {
      values: ["blocked", "unblocked"],
      message: `{VALUE} is not a valid gender type`,
    },
  },
});

const BlockUser =
  mongoose.models.BlockUser || new mongoose.model("BlockUser", blockUserSchema);

module.exports = BlockUser;
