const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());


mongoose.connect("mongodb+srv://satyamagrawal_db_user:Y6EaK8SQRkPAjyVd@apicluster.g0tzf3e.mongodb.net/?appName=apiCluster")
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.get("/hello", (req, res) => {
  res.json({ message: "Hello Aakash 👋 Welcome to Backend!" });
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", UserSchema);


const bcrypt = require("bcryptjs");

const auth = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, "SECRET123");
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};


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


const jwt = require("jsonwebtoken");

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

  const token = jwt.sign({ id: user._id }, "SECRET123", { expiresIn: "1d" });

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


app.listen(3000, () => {
  console.log("Server running on port 3000");
});


