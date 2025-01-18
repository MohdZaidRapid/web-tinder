const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://mohdzaid:jtrMPxlXoyF0HCOe@cluster0.qnxxafl.mongodb.net/devTinder"
  );
};

module.exports = connectDB;

