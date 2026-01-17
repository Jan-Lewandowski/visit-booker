import { Router } from "express";

const servicesRouter = Router();

const services = [];
let nextId = 1;

servicesRouter.get("/", (req, res) => {
  res.json(services);
});

servicesRouter.get("/:id", (req, res) => {
  const service = services.find((s) => s.id === parseInt(req.params.id));
  if (!service) {
    return res.status(404).json({ message: "service not found" });
  }
  res.json(service);
});

servicesRouter.post("/", (req, res) => {
  const { name, duration, price } = req.body;
  if (!name || !duration || !price) {
    return res.status(400).json({
      message: "name, duration and price are required",
    });
  }

  const newService = {
    id: nextId++,
    name,
    duration,
    price,
  };

  services.push(newService);
  res.json(newService);
});

servicesRouter.put("/:id", (req, res) => {
  const service = services.find((s) => s.id === parseInt(req.params.id));
  if (!service) {
    return res.status(404).json({ message: "service not found" });
  }

  const { name, duration, price } = req.body;
  if (name) service.name = name;
  if (duration) service.duration = duration;
  if (price) service.price = price;

  res.json(service);
});

servicesRouter.delete("/:id", (req, res) => {
  const index = services.findIndex((s) => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "service not found" });
  }

  const deletedService = services.splice(index, 1);
  res.json(deletedService[0]);
});

export default servicesRouter;
