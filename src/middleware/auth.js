const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "239dknndinew9ew89errr");
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = auth;
