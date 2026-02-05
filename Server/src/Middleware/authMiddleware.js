import jwt from "jsonwebtoken";
import { User } from "../models/UserSchema.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Access denied, token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);



    const userId = decoded.id || decoded.userId || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token: missing user ID" });
    }

    // ⚠️ TEMPORARY: Skip user lookup, just use token data
    req.user = {
      _id: userId,
      role: decoded.role,
      // Use decoded data instead of DB lookup
    };


    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }
    console.warn("JWT verification failed:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
// Restrict route by role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {


    if (!roles.includes(req.user.role)) {
      console.error("❌ Authorization failed - User role doesn't match");
      return res.status(403).json({
        message: "Forbidden: Access denied",
        userRole: req.user.role,
        requiredRoles: roles
      });
    }


    next();
  };
};