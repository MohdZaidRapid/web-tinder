const express = require("express");

const app = express();

app.use("/user", (req, res) => {
  res.send("Haha haha hahaha");
});

app.get("/user", (req, res) => {
  res.send({ name: "Mohammad Zaid", age: 23 });
});

app.post("/user", (req, res) => {
  console.log("Save Data to the database");
  res.send("Data successfully saved to the database!");
});

app.delete("/user", (req, res) => {
  res.send("Deleted successfully");
});

// match all http methods
app.use("/test", (req, res) => {
  res.send("Hello hello hello");
});

// app.use("/", (req, res) => {
//   res.send("Hello from the dashboard!  again  brother");
// });

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777....");
});
