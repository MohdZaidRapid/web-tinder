const express = require("express");
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");

app.use(express.json());
// read json object convert that json to js javascript

app.post("/signup", async (req, res) => {
  // console.log(req.body);
  
  const user = new User(req.body);

  try {
    await user.save();
    res.status(201).send("User Added successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

connectDB()
  .then(() => {
    console.log("Database connected established...");
    app.listen(7777, () => {
      console.log("Server is successfully listening on port 7777....");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
