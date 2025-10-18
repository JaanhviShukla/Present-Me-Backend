const jwt = require("jsonwebtoken");
const { findById } = require("../services/institutionService");

const userAuth = async (req, res, next) => {
  try {
    //get token from cookie or AUTHORIZATION OF HEADER
    const token =
      req.cookies?.token ||
      (req.header("Authorization")
        ? req.header("Authorization").replace("Bearer ", "")
        : null);

    if (!token) {
      return res.status(401).json({ message: "No auth token, access denied" });
    }

    //VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded || {};

    if (!id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Load full user by id
    const inst_id = await findById(id);
    console.log("Authenticated user:", inst_id);
    if (!inst_id) {
      return res.status(404).json({ message: "User not found" });
    }

    req.inst_id = inst_id; //attach user info to request object
    next(); //proceed to next middleware or route handler
  } catch (err) {
    console.error("Auth error : ", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = userAuth;
