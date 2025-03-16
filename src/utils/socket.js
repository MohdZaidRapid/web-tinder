const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequestModel = require("../models/connectionRequest");
const ChatRoom = require("../models/chatRoom");
const path = require("path");
const fs = require("fs");

const getSecretRoomId = (targetUserId, userId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: ["http://localhost:5173", "https://funtop.netlify.app"], // Allow both local and production frontend
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true, // Enable credentials (important for auth and cookies)
    },
  });

  io.on("connection", (socket) => {
    // ======== Private Chat Functionality ========
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);

      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        const roomId = getSecretRoomId(userId, targetUserId);

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

          chat.messages.push({ senderId: userId, text });
          await chat.save();
        } catch (err) {
          console.log(err);
        }

        io.to(roomId).emit("messageReceived", { firstName, text, lastName });
      }
    );

    // ======== Group Chat (Chat Room) Functionality ========
    socket.on("joinRoom", async ({ userId, roomId }) => {
      try {
        if (!userId || !roomId) {
          console.error("Invalid joinRoom request: Missing userId or roomId");
          return;
        }

        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          console.error(`Chat room ${roomId} not found`);
          return;
        }

        if (!chatRoom.users.includes(userId)) {
          chatRoom.users.push(userId);
          await chatRoom.save();
        }

        socket.join(roomId);

        io.to(roomId).emit("userJoined", {
          userId,
          message: "A new user has joined the chat!",
        });
      } catch (error) {
        console.error("Error joining chat room:", error);
      }
    });

    socket.on("sendRoomMessage", async ({ userId, roomId, text, file }) => {
      try {
        if (!userId || !roomId || (!text && !file)) {
          console.error("Invalid sendRoomMessage request: Missing fields");
          return;
        }

        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          console.error(`Chat room ${roomId} not found`);
          return;
        }

        if (!chatRoom.users.includes(userId)) {
          console.error(`User ${userId} is not a member of room ${roomId}`);
          return;
        }

        let fileUrl = null;
        let fileType = null;

        if (file && file.data && file.name && file.type) {
          const uploadDir = path.join(__dirname, "../uploads");
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

          const fileName = `${Date.now()}-${file.name}`;
          const filePath = path.join(uploadDir, fileName);

          // Convert base64 string back to a binary buffer
          const buffer = Buffer.from(file.data, "base64");
          fs.writeFileSync(filePath, buffer);

          fileUrl = `/uploads/${fileName}`;
          fileType = file.type;
        }

        const message = {
          senderId: userId,
          text: text || "",
          fileUrl,
          fileType,
          timestamp: new Date(),
        };

        chatRoom.messages.push(message);
        await chatRoom.save();

        io.to(roomId).emit("roomMessageReceived", message);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // ======== Video Call Functionality ========
    socket.on("callUser", ({ fromUserId, toUserId, offer }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      console.log(`📞 Call initiated from ${fromUserId} to ${toUserId}`);
      io.to(roomId).emit("incomingCall", { fromUserId, offer });
    });

    socket.on("answerCall", ({ fromUserId, toUserId, answer }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      console.log(`✅ Call answered by ${fromUserId}`);
      io.to(roomId).emit("callAnswered", { answer });
    });

    socket.on("iceCandidate", ({ fromUserId, toUserId, candidate }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      io.to(roomId).emit("iceCandidate", { candidate });
    });

    socket.on("endCall", ({ fromUserId, toUserId }) => {
      const roomId = getSecretRoomId(fromUserId, toUserId);
      console.log(`❌ Call ended between ${fromUserId} and ${toUserId}`);
      io.to(roomId).emit("callEnded");
    });

    // ======== Disconnect Handling ========
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
