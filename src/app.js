const express = require("express");

const app = express();

app.get("/getUserData", (req, res) => {
  // Logic of Db  call and get user data
  try {
    throw new Error("Error Brother ");
    res.send("User Data Sent");
  } catch (error) {
    res.status(500).send("Something went wrong Support contact ");
  }
});

app.use("/", (err, req, res, next) => {
  if (err) {
    console.log(err.message);
    res.status(500).send("Something went wrong");
  }
});

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777....");
});
