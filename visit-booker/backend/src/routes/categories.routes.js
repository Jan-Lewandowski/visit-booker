import { Router } from "express";
import {
  categories,
  generateCategoryId,
  generateServiceId,
} from "../data/categories.data.js";
import { auth } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/admin.middleware.js";

const categoriesRouter = Router();

categoriesRouter.get("/", auth, (req, res) => {
  const simpleCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    services: c.services,
  }));
  res.json(simpleCategories);
});

categoriesRouter.get("/:categoryId/services", auth, (req, res) => {
  const category = categories.find(
    (c) => c.id === Number(req.params.categoryId),
  );
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.json(category.services || []);
});

categoriesRouter.get("/:categoryId/services/search", auth, (req, res) => {
  const { q } = req.query;
  const category = categories.find(
    (c) => c.id === Number(req.params.categoryId),
  );
  if (!category) {
    return res.status(404).json({ message: "category not found" });
  }

  if (!q) {
    return res.status(400).json({ message: "query parameter 'q' is required" });
  }

  const result = (category.services || []).filter((service) =>
    service.name.toLowerCase().includes(q.toLowerCase()),
  );
  res.json(result);
});

categoriesRouter.post("/", auth, adminOnly, (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.status(400).json({ message: "Category name is required" });

  const newCategory = { id: generateCategoryId(), name, services: [] };
  categories.push(newCategory);
  res.status(201).json(newCategory);
});

categoriesRouter.post("/:categoryId/services", auth, adminOnly, (req, res) => {
  const { categoryId } = req.params;
  const { name, duration, price } = req.body;

  if (!name || !duration || !price) {
    return res
      .status(400)
      .json({ message: "name, duration and price are required" });
  }
  const category = categories.find((c) => c.id === Number(categoryId));
  if (!category) {
    return res.status(404).json({ message: "category not found" });
  }

  const newService = { id: generateServiceId(), name, duration, price };
  category.services.push(newService);

  res.status(201).json(newService);
});

categoriesRouter.put("/:categoryId/services/:serviceId", auth, adminOnly, (req, res) => {
  const { categoryId, serviceId } = req.params;
  const { name, duration, price } = req.body;

  const category = categories.find((c) => c.id === Number(categoryId));
  if (!category) {
    return res.status(404).json({ message: "category not found" });
  }

  const service = category.services.find((s) => s.id === Number(serviceId));
  if (!service) {
    return res.status(404).json({ message: "service not found" });
  }

  if (name) service.name = name;
  if (duration) service.duration = duration;
  if (price) service.price = price;

  res.json(service);
});

categoriesRouter.put("/:id", auth, adminOnly, (req, res) => {
  const categoryId = Number(req.params.id);
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "category name is required" });
  }
  const category = categories.find((c) => c.id === categoryId);
  if (!category) {
    return res.status(404).json({ message: "category not found" });
  }

  category.name = name;
  res.json(category);
});

categoriesRouter.delete("/:id", auth, adminOnly, (req, res) => {
  const categoryId = Number(req.params.id);
  const index = categories.findIndex((c) => c.id === categoryId);

  if (index === -1) {
    return res.status(404).json({ message: "category not found" });
  }
  if (categories[index].services.length > 0) {
    return res.status(409).json({
      message: "cannot delete category with existing services",
    });
  }

  categories.splice(index, 1);
  res.status(204).send();
});

export default categoriesRouter;
