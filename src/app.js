const express = require("express");

const app = express();

app.use("/", (req, res) => {
  res.send("Hello from the dashboard! brohter again");
});

app.use("/hello", (req, res) => {
  res.send("Hello hello hello");
});

app.use("/test", (req, res) => {
  res.send("Hello Hello Hello Hello");
});

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777....");
});
