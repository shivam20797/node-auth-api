const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");   // <-- connect middleware

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.get("/hello", (req, res) => {
  res.json({ message: "Hello Aakash 👋 Welcome to Backend!" });
});



app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashedPassword
  });

  await user.save();
  res.json({ message: "User registered successfully" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Wrong password" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ message: "Login successful ✅", token });
});

app.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

app.post("/change-password",auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);

  // check old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Old password is incorrect" });
  }

  // encrypt new password
  const hashed = await bcrypt.hash(newPassword, 10);

  // update in DB
  user.password = hashed;
  await user.save();

  res.json({ message: "Password changed successfully 🔐" });
});

app.post("/change-password-no-token",auth, async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  // 1. find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // 2. check old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    return res.status(400).json({ error: "Old password is incorrect" });
  }

  // 3. encrypt new password
  const hashed = await bcrypt.hash(newPassword, 10);

  // 4. update password
  user.password = hashed;
  await user.save();

  res.json({ message: "Password changed successfully 🔐" });
});