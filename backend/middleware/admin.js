const db = require("../config/database");

module.exports = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized, no user found" });
    }
    db.query(
      "SELECT role FROM users WHERE id = ?",
      [req.user.id],
      (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "User not found" });
        }

        const user = results[0];
        if (user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Access denied. Admin role required." });
        }

        next();
      }
    );
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
