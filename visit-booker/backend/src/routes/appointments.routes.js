import { Router } from "express";
import { appointments, generateAppointmentId } from "../data/appointments.data.js";
import { categories } from "../data/categories.data.js";
import { adminOnly } from "../middleware/admin.middleware.js";
import { auth } from "../middleware/auth.middleware.js";
import { sendAppointmentUpdate, sendUserNotification, resetCloseNotification } from "../websocket.js";


const appointmentsRouter = Router();
const OPEN_HOUR = 8;
const CLOSE_HOUR = 16;
const OPEN_MINUTES = OPEN_HOUR * 60;
const CLOSE_MINUTES = CLOSE_HOUR * 60;

function appointmentDateTime(date, time) {
  return new Date(`${date}T${time}`);
}

function normalizeTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(time) {
  const [hour, minute] = String(time).split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function minutesToTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return normalizeTime(hour, minute);
}

function getServiceByIds(categoryId, serviceId) {
  const category = categories.find((c) => c.id === Number(categoryId));
  if (!category) return null;
  const service = category.services.find((s) => s.id === Number(serviceId));
  if (!service) return null;
  return { category, service };
}

function getServiceById(serviceId) {
  for (const category of categories) {
    const service = category.services.find((s) => s.id === Number(serviceId));
    if (service) return { category, service };
  }
  return null;
}

function getServiceDurationMinutes(service) {
  return Number(service?.durationMinutes ?? service?.duration ?? 60);
}

function isSlotAligned(startMinutes, durationMinutes) {
  return (startMinutes - OPEN_MINUTES) % durationMinutes === 0;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function hasOverlap(
  date,
  startMinutes,
  durationMinutes,
  categoryId,
  serviceId,
  ignoreAppointmentId = null,
) {
  const endMinutes = startMinutes + durationMinutes;

  return appointments.some((appointment) => {
    if (appointment.date !== date) return false;
    if (ignoreAppointmentId && appointment.id === ignoreAppointmentId) return false;
    if (
      Number(appointment.categoryId) !== Number(categoryId) ||
      Number(appointment.serviceId) !== Number(serviceId)
    ) {
      return false;
    }

    const existingStart = timeToMinutes(appointment.time);
    if (existingStart === null) return false;
    const existingService = getServiceByIds(
      appointment.categoryId,
      appointment.serviceId,
    );
    const existingDuration = getServiceDurationMinutes(existingService?.service);
    const existingEnd = existingStart + existingDuration;
    return overlaps(startMinutes, endMinutes, existingStart, existingEnd);
  });
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
  const normalizedTime = normalizeTime(hour, minute || 0);
  const startMinutes = timeToMinutes(normalizedTime);
  if (startMinutes === null) {
    return res.status(400).json({ message: "invalid time format" });
  }

  const now = new Date();
  const appointmentTime = new Date(`${date}T${normalizedTime}`);
  if (appointmentTime < now) {
    return res.status(400).json({
      message: "cannot create appointment in the past",
    });
  }

  const serviceResult = getServiceByIds(categoryId, serviceId);
  if (!serviceResult) {
    return res.status(404).json({ message: "service not found in this category" });
  }
  const { category, service } = serviceResult;
  const durationMinutes = getServiceDurationMinutes(service);
  const endMinutes = startMinutes + durationMinutes;

  if (startMinutes < OPEN_MINUTES || endMinutes > CLOSE_MINUTES) {
    return res.status(400).json({
      message: "appointments can be booked only between 08:00 and 16:00",
    });
  }
  if (!isSlotAligned(startMinutes, durationMinutes)) {
    return res.status(400).json({
      message: "appointments must start at a valid time for this service",
    });
  }

  if (hasOverlap(date, startMinutes, durationMinutes, category.id, service.id)) {
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
  sendAppointmentUpdate("created", { appointment: newAppointment });
  res.status(201).json(newAppointment);
});

appointmentsRouter.get("/available", auth, (req, res) => {
  const { serviceId, categoryId, date } = req.query;

  if (!serviceId || !date) {
    return res.status(400).json({
      message: "serviceId and date are required",
    });
  }

  const serviceResult =
    categoryId !== undefined
      ? getServiceByIds(categoryId, serviceId)
      : getServiceById(serviceId);
  if (!serviceResult) {
    return res.status(404).json({ message: "service not found" });
  }

  const durationMinutes = getServiceDurationMinutes(serviceResult.service);
  const slots = [];

  for (let start = OPEN_MINUTES; start + durationMinutes <= CLOSE_MINUTES; start += durationMinutes) {
    const time = minutesToTime(start);
    if (!hasOverlap(date, start, durationMinutes, serviceResult.category.id, serviceResult.service.id)) {
      slots.push(time);
    }
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
  const nextCategoryId = categoryId ? Number(categoryId) : appointment.categoryId;
  const nextServiceId = serviceId ? Number(serviceId) : appointment.serviceId;
  const serviceResult = getServiceByIds(nextCategoryId, nextServiceId);
  if (!serviceResult) {
    return res.status(404).json({
      message: "service not found in this category",
    });
  }
  const durationMinutes = getServiceDurationMinutes(serviceResult.service);

  const nextDate = date || appointment.date;
  const nextTime = time ? (() => {
    const [hour, minute] = time.split(":").map(Number);
    return normalizeTime(hour, minute || 0);
  })() : appointment.time;

  const startMinutes = timeToMinutes(nextTime);
  if (startMinutes === null) {
    return res.status(400).json({ message: "invalid time format" });
  }
  const endMinutes = startMinutes + durationMinutes;

  if (startMinutes < OPEN_MINUTES || endMinutes > CLOSE_MINUTES) {
    return res.status(400).json({
      message: "appointments can be booked only between 08:00 and 16:00",
    });
  }
  if (!isSlotAligned(startMinutes, durationMinutes)) {
    return res.status(400).json({
      message: "appointments must start at a valid time for this service",
    });
  }

  const proposedDateTime = appointmentDateTime(nextDate, nextTime);
  if (proposedDateTime < new Date()) {
    return res.status(400).json({ message: "cannot create appointment in the past" });
  }

  if (
    hasOverlap(
      nextDate,
      startMinutes,
      durationMinutes,
      serviceResult.category.id,
      serviceResult.service.id,
      appointment.id,
    )
  ) {
    return res.status(409).json({
      message: "this time slot is already booked",
    });
  }

  appointment.categoryId = serviceResult.category.id;
  appointment.serviceId = serviceResult.service.id;
  appointment.date = nextDate;
  appointment.time = nextTime;

  sendAppointmentUpdate("updated", { appointment });
  sendUserNotification(appointment.userId, {
    title: "Appointment updated",
    message: "Your appointment details have been updated.",
    appointmentId: appointment.id,
    date: appointment.date,
    time: appointment.time,
  });
  resetCloseNotification(appointment.id);
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
  sendAppointmentUpdate("deleted", { appointmentId: appointment.id });
  sendUserNotification(appointment.userId, {
    title: "Appointment canceled",
    message: "Your appointment has been canceled.",
    appointmentId: appointment.id,
    date: appointment.date,
    time: appointment.time,
  });
  resetCloseNotification(appointment.id);
  res.status(204).json("appointment deleted");
});

export default appointmentsRouter;
