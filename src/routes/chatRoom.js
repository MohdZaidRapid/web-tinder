const express = require("express");
const ChatRoom = require("../models/chatRoom");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { userAuth } = require("../middlewares/auth");
const adminRole = require("../middlewares/admin");
const upload = require("../middlewares/uploads");
const bcrypt = require("bcrypt");

const chatRoomRouter = express.Router();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../uploads"); // Correct path
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true }); // Ensure folder exists
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// Create a chat room (Admin only)

chatRoomRouter.post("/create", userAuth, adminRole, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can create chat rooms" });
    }

    const { name, password } = req.body;

    const existingRoom = await ChatRoom.findOne({ name });

    if (existingRoom) {
      return res.status(400).json({ error: "Chat room already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const chatRoom = new ChatRoom({
      name,
      password: hashedPassword,
      users: [],
      messages: [],
    });

    await chatRoom.save();
    res
      .status(201)
      .json({ message: "Chat room created successfully", chatRoom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave room
chatRoomRouter.post("/leave/:roomId", userAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // Remove user from the room
    chatRoom.users = chatRoom.users.filter(
      (id) => id.toString() !== userId.toString()
    );
    await chatRoom.save();

    res.json({ message: "Left chat room successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Get All Chat Rooms
chatRoomRouter.get("/", userAuth, async (req, res) => {
  try {
    // Include the 'users' field in the response so that the frontend can check membership.
    const chatRooms = await ChatRoom.find().select("name _id users");

    res.json(chatRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Join a Chat Room
chatRoomRouter.post("/join/:roomId", userAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;
    const userId = req.user._id;
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // Ensure chatRoom.users is defined (default to empty array if not)
    if (!chatRoom.users) {
      chatRoom.users = [];
    }

    // If the user has already joined, return the room info immediately
    if (chatRoom.users.includes(userId)) {
      return res.json({ message: "Already joined the room", chatRoom });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, chatRoom.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Add the user to the room and save
    chatRoom.users.push(userId);

    await chatRoom.save();

    res.json({ message: "Joined chat room successfully", chatRoom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Send Message (Handled by Socket.IO but API for history)
chatRoomRouter.post(
  "/:roomId/message",
  upload.single("file"),
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId, text } = req.body;
      const file = req.file;

      if (!userId)
        return res.status(400).json({ error: "User ID is required" });

      const newMessage = {
        senderId: userId,
        text: text || "",
        fileUrl: file ? `/uploads/${file.filename}` : null,
        fileType: file ? file.mimetype : null,
      };

      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom)
        return res.status(404).json({ error: "Chat room not found" });

      chatRoom.messages.push(newMessage);
      await chatRoom.save();

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("File Upload Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get Messages (Including Files)
chatRoomRouter.get("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom)
      return res.status(404).json({ error: "Chat room not found" });

    res.json(chatRoom.messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Get Messages of a Chat Room
// chatRoomRouter.get("/:roomId/messages", userAuth, async (req, res) => {
//   try {
//     const { roomId } = req.params;

//     // Validate roomId format (in case it's not a valid MongoDB ObjectId)
//     if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ error: "Invalid roomId format" });
//     }

//     const chatRoom = await ChatRoom.findById(roomId);

//     if (!chatRoom) {
//       return res.status(404).json({ error: "Chat room not found" });
//     }

//     // Populate messages only if they exist
//     if (chatRoom.messages.length > 0) {
//       await chatRoom.populate("messages.senderId", "name");
//     }

//     console.log("Fetched Messages:", chatRoom.messages);

//     res.json(chatRoom.messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

module.exports = { chatRoomRouter };
