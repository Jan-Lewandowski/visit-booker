import { Router } from "express";
import { users } from "../data/users.data.js";
import { auth } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/admin.middleware.js";

const usersRouter = Router();

usersRouter.get("/", auth, adminOnly, (req, res) => {
  res.json(users);
});

usersRouter.get("/:id", auth, adminOnly, (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
});

usersRouter.delete("/:id", auth, adminOnly, (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "User not found" });
  }
  const deleted = users.splice(index, 1);
  res.json(deleted[0]);
});

usersRouter.put("/:id", auth, adminOnly, (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const { role } = req.body;

  if (role) user.role = role;
  res.json(user);
});

export default usersRouter;
