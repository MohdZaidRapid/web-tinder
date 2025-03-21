const express = require("express");
const connectDB = require("./config/database");
const app = express();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");

require("dotenv").config();

app.use(
  cors({
    origin: ["https://funtop.netlify.app", "http://localhost:5173"], // Allow only your frontend domain
    credentials: true, // Allow cookies & authentication headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Define allowed methods
  })
);
app.use(express.json());
// read json object convert that json to js javascript
app.use(cookieParser());
const path = require("path");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chat");
const blockUserRouter = require("./routes/blockUser");
const adminRouter = require("./routes/admin");
const postRouter = require("./routes/post");
const encryptedRouter = require("./routes/encrypted");
const { chatRoomRouter } = require("./routes/chatRoom");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);
app.use("/", blockUserRouter);
app.use("/", adminRouter);
app.use("/", postRouter);
app.use("/private", encryptedRouter);
app.use("/api/chatrooms", chatRoomRouter);

const server = http.createServer(app);

initializeSocket(server);

connectDB()
  .then(() => {
    console.log("Database connected established...");
    server.listen(process.env.PORT, () => {
      console.log("Server is successfully listening on port 7777....");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
