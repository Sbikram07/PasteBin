const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existing) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username, email, passwordHash });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("[auth] register error:", err.message);
    res.status(500).json({ message: "Failed to register" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername },
      ],
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("[auth] login error:", err.message);
    res.status(500).json({ message: "Failed to login" });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

module.exports = { register, login, me };
