const express = require("express");
const connectDB = require("./config/database");
const app = express();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");

require("dotenv").config();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
// read json object convert that json to js javascript
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chat");
const blockUserRouter = require("./routes/blockUser");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);
app.use("/", blockUserRouter);

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
