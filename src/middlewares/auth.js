const adminAuth = (req, res, next) => {
  console.log("ADMIN IS getting checked");

  const token = "xyz";
  const isAdminAuthorized = token === "xyz";
  if (!isAdminAuthorized) {
    res.status(401).send("Unauthorized route");
  } else {
    next();
  }
};

const userAuth = (req, res, next) => {
  console.log("ADMIN IS getting checked");

  const token = "xyz";
  const isAdminAuthorized = token === "cxyz";
  if (!isAdminAuthorized) {
    res.status(401).send("Unauthorized request");
  } else {
    next();
  }
};

module.exports = { adminAuth, userAuth };
