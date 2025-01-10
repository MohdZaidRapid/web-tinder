const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://mohdzaid:ZtMRpVdkMc4aBw7w@cluster0.qnxxafl.mongodb.net/devTinder"
  );
};

module.exports = connectDB;

