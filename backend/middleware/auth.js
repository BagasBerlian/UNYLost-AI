const jwt = require("jsonwebtoken");
const db = require("../config/database");

module.exports = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return res.status(401).json({ message: "Token is not valid" });
      }

      db.query(
        "SELECT id, email, full_name FROM users WHERE id = ?",
        [decoded.id],
        (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Server error" });
          }

          if (results.length === 0) {
            return res.status(401).json({ message: "User not found" });
          }

          req.user = results[0];
          next();
        }
      );
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
