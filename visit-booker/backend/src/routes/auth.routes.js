import express from "express";
import bcrypt from "bcrypt";
import { users } from "../data/users.data.js";

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ message: "user already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const role = req.body.email === "admin@test.pl" ? "admin" : "user"

  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    role: role,
  };

  users.push(newUser);

  req.session.user = {
    id: newUser.id,
    role: newUser.role,
  };

  res.status(201).json({ message: "registered and logged in" });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: "user not found" });
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return res.status(401).json({ message: "invalid password" });
  }

  req.session.user = {
    id: user.id,
    role: user.role,
  };

  res.json({ message: "logged in" });
});

authRouter.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "not authenticated" });
  }

  res.json({
    id: req.session.user.id,
    role: req.session.user.role,
  });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("visit-booker.sid");
    res.json({ message: "logged out" });
  });
});


export default authRouter;
