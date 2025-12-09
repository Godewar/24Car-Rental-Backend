import jwt from "jsonwebtoken";
import User from "../models/user.js";

const SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const found = await User.findOne({ email, password }).lean();

    if (!found) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: "8h" });

    res.json({ user: payload, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

/**
 * @desc    Register new user (if needed)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Get next ID
    const max = await User.find().sort({ id: -1 }).limit(1).lean();
    const nextId = (max[0]?.id || 0) + 1;

    // Create new user
    const newUser = await User.create({
      id: nextId,
      name,
      email,
      password, // In production, hash this password!
      role: role || "user",
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: "8h" });

    res.status(201).json({ user: payload, token });
  } catch (err) {
    console.error("Registration error:", err);
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

/**
 * @desc    Verify token
 * @route   POST /api/auth/verify
 * @access  Public
 */
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
};
