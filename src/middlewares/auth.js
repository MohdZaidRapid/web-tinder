const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (user.token !== token) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    if (user.isDeactivated) {
      return res.status(403).json({ message: "Account is deactivated. Contact support." });
    }

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token. Please log in again." });
  }
};

module.exports = { userAuth };
