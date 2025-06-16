import jwt from 'jsonwebtoken'

// const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Accept `Authorization`, `token`, or `dToken` for flexibility
  const authHeader = req.headers.authorization;
  const rawToken =
    authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] :
    req.headers.token || req.headers.dtoken;

  // console.log("Received token in middleware:", rawToken);

  if (!rawToken) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;
