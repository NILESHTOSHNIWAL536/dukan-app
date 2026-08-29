const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET || "239dknndinew9ew89errr",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

module.exports = { signToken };
