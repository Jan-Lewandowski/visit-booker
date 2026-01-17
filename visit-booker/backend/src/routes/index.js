import { Router } from "express";
import usersRouter from "./users.routes.js";
import servicesRouter from "./services.routes.js";

const router = Router();

router.use("/users", usersRouter);
router.use("/services", servicesRouter);

export default router;
