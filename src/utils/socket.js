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
      origin: ["http://localhost:5173", "https://funtop.netlify.app"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ======== Chat Functionality ========
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + " Joining Room: " + roomId);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        const roomId = getSecretRoomId(userId, targetUserId);
        console.log(firstName + " " + text);

        // Save message to the database
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
        });
      }
    );

    // ======== 🚀 Video Call Functionality 🚀 ========

    // 1️⃣ Initiate Call
    socket.on("callUser", ({ fromUserId, toUserId, offer }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      console.log(`📞 Call initiated from ${fromUserId} to ${toUserId}`);
      io.to(roomId).emit("incomingCall", { fromUserId, offer });
    });

    // 2️⃣ Answer Call
    socket.on("answerCall", ({ fromUserId, toUserId, answer }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      console.log(`✅ Call answered by ${fromUserId}`);
      io.to(roomId).emit("callAnswered", { answer });
    });

    // 3️⃣ Exchange ICE Candidates
    socket.on("iceCandidate", ({ fromUserId, toUserId, candidate }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      io.to(roomId).emit("iceCandidate", { candidate });
    });

    // 4️⃣ End Call
    socket.on("endCall", ({ fromUserId, toUserId }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      console.log(`❌ Call ended between ${fromUserId} and ${toUserId}`);
      io.to(roomId).emit("callEnded");
    });

    // Disconnect Handling
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
