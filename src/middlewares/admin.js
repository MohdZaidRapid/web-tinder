const jwt = require("jsonwebtoken");

const adminRole = (req, res, next) => {
  try {
    const adminRole = req.user.role;

    if (adminRole !== "admin") {
      throw new Error("Only admin  can perform such action");
    }

    next();
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports = adminRole;
