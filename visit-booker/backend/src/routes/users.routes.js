import { Router } from "express";

const usersRouter = Router();

const users = [];
let nextId = 1;

usersRouter.get("/", (req, res) => {
  res.json(users);
});

usersRouter.get("/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
});

usersRouter.post("/", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }

  const newUser = { id: nextId++, name, email };
  users.push(newUser);

  res.json(newUser);
});

usersRouter.put("/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;

  res.json(user);
});

usersRouter.delete("/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "User not found" });
  }
  const deleted = users.splice(index, 1);
  res.json(deleted[0]);
});

export default usersRouter;
