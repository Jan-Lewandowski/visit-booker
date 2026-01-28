import express from "express";
import cors from "cors";
import router from "./routes/index.js";
import session from "express-session";

const app = express();

const allowedOrigins = ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());


app.use(
  session({
    name: "visit-booker.sid",
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 7,
    },
  }),
);
app.use("/api", router);

export default app;
