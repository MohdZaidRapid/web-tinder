const User = require("../models/user");
const BlockUserModel = require("../models/blockuser");

const isUserBlocked = async (req, res, next) => {
  try {
    const blockUserId = req.params.blockUserId || req.params.toUserId; // The user to be blocked
    const user = req.user; // Authenticated user performing the action
    console.log("calliing", blockUserId, req.user._id);

    // Check if the user to be blocked exists
    const userExists = await User.findById(blockUserId);
    if (!userExists) {
      return res.status(404).json({
        message: "The user does not exist.",
      });
    }

    // Check if the block entry already exists
    const blockToUser = await BlockUserModel.findOne({
      blockedTo: blockUserId,
      blockedBy: user._id,
    });

    if (blockToUser) {
      return res.status(400).json({
        message: "You have already blocked this user.",
      });
    }

    // Check if the user has already blocked the current user
    const userAlreadyBlockedYou = await User.findOne({
      _id: blockUserId,
      blockedBy: user._id,
    });

    if (userAlreadyBlockedYou) {
      return res.status(400).json({
        message:
          "You cannot block this user because they have already blocked you.",
      });
    }

    // Check if the user is already in the blockedBy array
    const alreadyInBlockedByArray = await User.findOne({
      _id: user._id,
      blockedBy: blockUserId,
    });

    if (alreadyInBlockedByArray) {
      return res.status(400).json({
        message: "This user is already in your blocked list.",
      });
    }

    // If no blocking relationship exists, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error("Error in isUserBlocked middleware:", error);
    return res.status(500).json({
      message: "An error occurred while checking the blocking status.",
      error: error.message,
    });
  }
};

module.exports = isUserBlocked;
