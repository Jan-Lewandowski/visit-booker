import { Router } from "express";
import { appointments, generateAppointmentId } from "../data/appointments.data.js";
import { categories } from "../data/categories.data.js";
import { adminOnly } from "../middleware/admin.middleware.js";
import { auth } from "../middleware/auth.middleware.js";
import { broadcast } from "../websocket.js";


const appointmentsRouter = Router();
const OPEN_HOUR = 8;
const CLOSE_HOUR = 16;

function appointmentDateTime(date, time) {
  return new Date(`${date}T${time}`);
}

function normalizeTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function hourFromTime(time) {
  const [hour] = String(time).split(":").map(Number);
  return Number.isNaN(hour) ? null : hour;
}

appointmentsRouter.get("/", auth, adminOnly, (req, res) => {
  res.json(appointments);
});

appointmentsRouter.get("/my", auth, (req, res) => {
  const myAppointments = appointments.filter(
    (a) => a.userId === req.session.user.id,
  );

  res.json(myAppointments);
});

appointmentsRouter.post("/", auth, (req, res) => {
  const { categoryId, serviceId, date, time } = req.body;
  if (!categoryId || !serviceId || !date || !time) {
    return res.status(400).json({
      message: "categoryId, serviceId, date and time are required",
    });
  }

  const [hour, minute] = time.split(":").map(Number);
  if (minute !== 0) {
    return res.status(400).json({
      message: "appointments must start at full hour",
    });
  }
  const normalizedTime = normalizeTime(hour, 0);
  if (hour < OPEN_HOUR || hour >= CLOSE_HOUR) {
    return res.status(400).json({
      message: "appointments can be booked only between 08:00 and 16:00",
    });
  }

  const now = new Date();
  const appointmentTime = new Date(`${date}T${normalizedTime}`);
  if (appointmentTime < now) {
    return res.status(400).json({
      message: "cannot create appointment in the past",
    });
  }

  const diffMs = appointmentTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  const category = categories.find((c) => c.id === Number(categoryId));
  if (!category) {
    return res.status(404).json({ message: "category not found" });
  }
  const service = category.services.find((s) => s.id === Number(serviceId));
  if (!service) {
    return res.status(404).json({
      message: "service not found in this category",
    });
  }

  const isBooked = appointments.find(
    (a) =>
      a.serviceId === service.id && a.date === date && a.time === normalizedTime,
  );
  if (isBooked) {
    return res.status(409).json({
      message: "this time slot is already booked",
    });
  }

  const newAppointment = {
    id: generateAppointmentId(),
    userId: req.session.user.id,
    categoryId: category.id,
    serviceId: service.id,
    date,
    time: normalizedTime,
    status: "scheduled",
  };

  appointments.push(newAppointment);
  broadcast({ type: "appointments:created", appointment: newAppointment });
  res.status(201).json(newAppointment);
});

appointmentsRouter.get("/available", auth, (req, res) => {
  const { serviceId, date } = req.query;

  if (!serviceId || !date) {
    return res.status(400).json({
      message: "serviceId and date are required",
    });
  }

  const slots = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const time = `${String(hour).padStart(2, "0")}:00`;

    const isBooked = appointments.find((a) => {
      if (a.serviceId !== Number(serviceId) || a.date !== date) return false;
      const bookedHour = hourFromTime(a.time);
      return bookedHour === hour;
    });
    if (!isBooked) slots.push(time);
  }

  res.json({ availableSlots: slots });
});

appointmentsRouter.put("/:id", auth, (req, res) => {
  const appointmentId = Number(req.params.id);
  const { categoryId, serviceId, date, time } = req.body;
  const appointment = appointments.find((a) => a.id === appointmentId);

  if (!appointment) {
    return res.status(404).json({ message: "appointment not found" });
  }

  const appointmentTime = appointmentDateTime(appointment.date, appointment.time);
  if (appointmentTime < new Date()) {
    return res.status(403).json({
      message: "past appointments cannot be modified",
    });
  }
  if (appointment.userId !== req.session.user.id && req.session.user.role !== "admin") {
    return res.status(403).json({ message: "forbidden" });
  }
  if (categoryId && serviceId) {
    const category = categories.find((c) => c.id === Number(categoryId));
    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    const service = category.services.find((s) => s.id === Number(serviceId));
    if (!service) {
      return res.status(404).json({
        message: "service not found in this category",
      });
    }

    appointment.categoryId = category.id;
    appointment.serviceId = service.id;
  }

  if (date) appointment.date = date;
  if (time) {
    const [hour, minute] = time.split(":").map(Number);
    appointment.time = normalizeTime(hour, minute || 0);
  }

  broadcast({ type: "appointments:updated", appointment });
  res.json(appointment);
});


appointmentsRouter.delete("/:id", auth, (req, res) => {
  const appointmentIndex = appointments.findIndex(
    (a) => a.id === Number(req.params.id),
  );

  if (appointmentIndex === -1) {
    return res.status(404).json({ message: "not found" });
  }

  const appointment = appointments[appointmentIndex];

  const appointmentTime = appointmentDateTime(appointment.date, appointment.time);
  if (appointmentTime < new Date()) {
    return res.status(403).json({
      message: "past appointments cannot be modified",
    });
  }

  const now = new Date();
  const diffMs = appointmentTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    return res.status(403).json({
      message: "appointments cannot be modified less than 24 hours before",
    });
  }

  if (
    appointment.userId !== req.session.user.id &&
    req.session.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "forbidden" });
  }

  appointments.splice(appointmentIndex, 1);
  broadcast({ type: "appointments:deleted", appointmentId: appointment.id });
  res.status(204).json("appointment deleted");
});

export default appointmentsRouter;
