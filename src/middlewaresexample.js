const express = require("express");

const app = express();

// app.use(
//   "/user",
//   (req, res, next) => {
//     console.log("Handling the route user 1!!");
//     next();
//   },
//   (req, res, next) => {
//     console.log("Handling the route user 2!!");
//     // res.send("2nd Response!!");
//     next();
//   },
//   (req, res, next) => {
//     console.log("Handling the route user 3!!");
//     // res.send("3rd Response!!");
//     next();
//   },
//   (req, res, next) => {
//     console.log("Handling the route user 4!!");
//     res.send("4th Response!!");
//   }
// );

//  GET /user =>

// app.use("/", (req, res, next) => {
//   //   res.send("Handling /  route");
//   next();
// });

// app.get(
//   "/user",
//   (req, res, next) => {
//     console.log("Handling /user route");
//     next();
//   },
//   (req, res, next) => {
//     res.send("1st Route Handler");
//     // next();
//   },
//   (req, res, next) => {
//     // next();
//     res.send("2nd Route Handler");
//   }
// );

// app.get("/user", (req, res, next) => {
//   res.send("2nd Route Handler");
// });
const { adminAuth, userAuth } = require("./middlewares/auth");

app.use("/admin", adminAuth);

app.post("/user/login", (req, res) => {
  res.send("USer logged in successfully");
});

app.get("/admin/getAllData", (req, res) => {
  // Checkif the request is  authorized
  // logic of checking if the request is authenticated
  res.send("All Data sent");
});

app.get("/admin/deleteUser", (req, res) => {
  res.send("Deleted a user");
});

app.get("/user", userAuth, (req, res) => {
  res.send("user data");
});

app.listen(7777, () => {
  console.log("Server is successfully listening on port 7777....");
});
