const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Ambil token dari header
  const authHeader = req.header("Authorization");
  console.log("Auth Header:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Format header: "Bearer [token]"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7, authHeader.length)
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tambahkan user ke request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};
