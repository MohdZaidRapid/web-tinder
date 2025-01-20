const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequestModel = require("../models/connectionRequest");

const getSecretRoomId = (targetUserId, userId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    // Handle events

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);

      console.log(firstName + " Joining Room : " + roomId);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        const roomId = getSecretRoomId(userId, targetUserId);
        console.log(firstName + " " + text);

        // Save message to the database
        ConnectionRequestModel.findOne({
          $or: [
            {
              fromUserId: userId,
              toUserId: targetUserId,
              status: "accepted",
            },
            {
              fromUserId: targetUserId,
              toUserId: userId,
              status: "accepted",
            },
          ],
        });

        try {
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId: userId,
            text,
          });

          await chat.save();
        } catch (err) {
          console.log(err);
        }

        io.to(roomId).emit("messageReceived", {
          firstName,
          text,
          lastName,
          //   timestamp: new Date(),
        });
      }
    );

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
