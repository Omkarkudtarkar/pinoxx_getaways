import express from "express";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { verifyGoogleCredential } from "../utils/googleAuth.js";

export const authRouter = express.Router();

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider
  };
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, phone, password });
    const token = signToken(user);
    res.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    const profile = await verifyGoogleCredential(req.body.credential);
    let user = await User.findOne({ email: profile.email });

    if (user) {
      user.name = user.name || profile.name;
      user.googleId = user.googleId || profile.googleId;
      user.avatarUrl = profile.avatarUrl;
      user.authProvider = "google";
      await user.save();
    } else {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
        authProvider: "google"
      });
    }

    const token = signToken(user);
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});
