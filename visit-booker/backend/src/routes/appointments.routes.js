import { Router } from "express";
import { all, get, run } from "../db/index.js";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  appointmentDateTime,
  normalizeTime,
  timeToMinutes,
  minutesToTime,
  mapAppointmentRow,
  getServiceByIds,
  getServiceById,
  getServiceDurationMinutes,
  isSlotAligned,
  hasOverlap,
} from "../lib/appointments.js";
import { adminOnly } from "../middleware/admin.middleware.js";
import { auth } from "../middleware/auth.middleware.js";
import { sendNotification } from "../mqtt/notificationPublisher.js";
import { resetCloseNotification, sendAppointmentUpdate, sendUserNotification } from "../websocket.js";

const appointmentsRouter = Router();
appointmentsRouter.get("/", auth, adminOnly, async (req, res) => {
  const result = await all(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments ORDER BY date, time",
  );
  res.json(result.map(mapAppointmentRow));
});

appointmentsRouter.get("/my", auth, async (req, res) => {
  const result = await all(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE user_id = ? ORDER BY date, time",
    [req.session.user.id],
  );
  res.json(result.map(mapAppointmentRow));
});

appointmentsRouter.post("/", auth, async (req, res) => {
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
      message: "Nie można zarezerwować wizyty w przeszłości",
    });
  }

  const serviceResult = await getServiceByIds(categoryId, serviceId);
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

  if (await hasOverlap(date, startMinutes, durationMinutes, category.id, service.id)) {
    return res.status(409).json({
      message: "this time slot is already booked",
    });
  }

  const insertResult = await run(
    "INSERT INTO appointments (user_id, category_id, service_id, date, time, status) VALUES (?, ?, ?, ?, ?, ?)",
    [
      req.session.user.id,
      category.id,
      service.id,
      date,
      normalizedTime,
      "scheduled",
    ],
  );
  const newRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
    [insertResult.lastID],
  );
  const newAppointment = mapAppointmentRow(newRow);
  sendNotification({
    userId: req.session.user.id,
    email: req.session.user.email,
    type: "EMAIL",
    topic: "notifications/send",
    subject: "Zarezerwowano wizytę",
    message: `Twoja wizyta na usługę "${service.name}" w dniu ${date} o godzinie ${normalizedTime} została pomyślnie zarezerwowana.`,
  });
  sendAppointmentUpdate("created", { appointment: newAppointment });
  res.status(201).json(newAppointment);
});

appointmentsRouter.get("/available", auth, async (req, res) => {
  const { serviceId, categoryId, date } = req.query;

  if (!serviceId || !date) {
    return res.status(400).json({
      message: "serviceId and date are required",
    });
  }

  const serviceResult =
    categoryId !== undefined
      ? await getServiceByIds(categoryId, serviceId)
      : await getServiceById(serviceId);
  if (!serviceResult) {
    return res.status(404).json({ message: "service not found" });
  }

  const durationMinutes = getServiceDurationMinutes(serviceResult.service);
  const slots = [];

  for (let start = OPEN_MINUTES; start + durationMinutes <= CLOSE_MINUTES; start += durationMinutes) {
    const time = minutesToTime(start);
    if (!(await hasOverlap(date, start, durationMinutes, serviceResult.category.id, serviceResult.service.id))) {
      slots.push(time);
    }
  }

  res.json({ availableSlots: slots });
});

appointmentsRouter.put("/:id", auth, async (req, res) => {
  const appointmentId = Number(req.params.id);
  const { categoryId, serviceId, date, time } = req.body;
  const appointmentRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
    [appointmentId],
  );
  if (!appointmentRow) {
    return res.status(404).json({ message: "appointment not found" });
  }
  const appointment = mapAppointmentRow(appointmentRow);

  const appointmentTime = appointmentDateTime(appointment.date, appointment.time);
  if (appointmentTime < new Date()) {
    return res.status(403).json({
      message: "past appointments cannot be modified",
    });
  }
  const isAdmin = req.session.user.role === "admin";
  if (appointment.userId !== req.session.user.id && !isAdmin) {
    return res.status(403).json({ message: "forbidden" });
  }

  if (!isAdmin) {
    if (!date || !time) {
      return res.status(400).json({
        message: "date and time are required for edit request",
      });
    }
    if (appointment.editRequestStatus === "pending") {
      return res.status(409).json({
        message: "edit request already pending",
      });
    }
  }
  if (!isAdmin && (categoryId || serviceId)) {
    return res.status(403).json({
      message: "users can only request date or time changes",
    });
  }

  const nextCategoryId = isAdmin && categoryId
    ? Number(categoryId)
    : appointment.categoryId;
  const nextServiceId = isAdmin && serviceId
    ? Number(serviceId)
    : appointment.serviceId;
  const serviceResult = await getServiceByIds(nextCategoryId, nextServiceId);
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
    await hasOverlap(
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

  if (isAdmin) {
    await run(
      "UPDATE appointments SET category_id = ?, service_id = ?, date = ?, time = ?, edit_requested_category_id = NULL, edit_requested_service_id = NULL, edit_requested_date = NULL, edit_requested_time = NULL, edit_request_status = NULL WHERE id = ?",
      [
        serviceResult.category.id,
        serviceResult.service.id,
        nextDate,
        nextTime,
        appointment.id,
      ],
    );
    const updatedRow = await get(
      "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
      [appointment.id],
    );
    const updated = mapAppointmentRow(updatedRow);

    sendAppointmentUpdate("updated", { appointment: updated });
    sendUserNotification(updated.userId, {
      title: "Appointment updated",
      message: "Your appointment details have been updated.",
      appointmentId: updated.id,
      date: updated.date,
      time: updated.time,
    });
    resetCloseNotification(updated.id);
    res.json(updated);
  } else {
    await run(
      "UPDATE appointments SET edit_requested_category_id = ?, edit_requested_service_id = ?, edit_requested_date = ?, edit_requested_time = ?, edit_request_status = ? WHERE id = ?",
      [
        serviceResult.category.id,
        serviceResult.service.id,
        nextDate,
        nextTime,
        "pending",
        appointment.id,
      ],
    );
    const updatedRow = await get(
      "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
      [appointment.id],
    );
    const updated = mapAppointmentRow(updatedRow);

    sendAppointmentUpdate("updated", { appointment: updated });
    res.json(updated);
  }
});

appointmentsRouter.put("/:id/approve-edit", auth, adminOnly, async (req, res) => {
  const appointmentId = Number(req.params.id);
  const appointmentRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
    [appointmentId],
  );
  if (!appointmentRow) {
    return res.status(404).json({ message: "appointment not found" });
  }
  const appointment = mapAppointmentRow(appointmentRow);
  if (appointment.editRequestStatus !== "pending") {
    return res.status(409).json({ message: "no pending edit request" });
  }

  const nextCategoryId = appointment.editRequestedCategoryId ?? appointment.categoryId;
  const nextServiceId = appointment.editRequestedServiceId ?? appointment.serviceId;
  const nextDate = appointment.editRequestedDate;
  const nextTime = appointment.editRequestedTime;
  if (!nextDate || !nextTime) {
    return res.status(400).json({ message: "missing requested date or time" });
  }

  const serviceResult = await getServiceByIds(nextCategoryId, nextServiceId);
  if (!serviceResult) {
    return res.status(404).json({ message: "service not found in this category" });
  }
  const durationMinutes = getServiceDurationMinutes(serviceResult.service);

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
    await hasOverlap(
      nextDate,
      startMinutes,
      durationMinutes,
      serviceResult.category.id,
      serviceResult.service.id,
      appointment.id,
    )
  ) {
    return res.status(409).json({ message: "this time slot is already booked" });
  }

  await run(
    "UPDATE appointments SET category_id = ?, service_id = ?, date = ?, time = ?, edit_request_status = ? WHERE id = ?",
    [
      serviceResult.category.id,
      serviceResult.service.id,
      nextDate,
      nextTime,
      "approved",
      appointment.id,
    ],
  );

  const updatedRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
    [appointment.id],
  );
  const updated = mapAppointmentRow(updatedRow);
  const userRow = await get("SELECT email FROM users WHERE id = ?", [
    updated.userId,
  ]);
  const userEmail = userRow?.email ?? req.session.user.email;
  const serviceName = serviceResult.service.name;

  sendAppointmentUpdate("updated", { appointment: updated });
  sendNotification({
    userId: updated.userId,
    email: userEmail,
    type: "EDIT_REQUEST_APPROVED",
    topic: "appointments/edit-request",
    subject: "Zaakceptowano zmianę wizyty",
    message: `Wizyta ${serviceName} została zaktualizowana na ${updated.date} ${updated.time}.`,
  });
  resetCloseNotification(updated.id);
  res.json(updated);
});

appointmentsRouter.put("/:id/reject-edit", auth, adminOnly, async (req, res) => {
  const appointmentId = Number(req.params.id);
  const appointmentRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
    [appointmentId],
  );
  if (!appointmentRow) {
    return res.status(404).json({ message: "appointment not found" });
  }
  const appointment = mapAppointmentRow(appointmentRow);
  if (appointment.editRequestStatus !== "pending") {
    return res.status(409).json({ message: "no pending edit request" });
  }

  await run(
    "UPDATE appointments SET edit_request_status = ? WHERE id = ?",
    ["rejected", appointment.id],
  );
  const updatedRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status, edit_requested_category_id, edit_requested_service_id, edit_requested_date, edit_requested_time, edit_request_status FROM appointments WHERE id = ?",
    [appointment.id],
  );
  const updated = mapAppointmentRow(updatedRow);
  const userRow = await get("SELECT email FROM users WHERE id = ?", [
    updated.userId,
  ]);
  const userEmail = userRow?.email ?? req.session.user.email;
  const serviceResult = await getServiceById(updated.serviceId);
  const serviceName = serviceResult?.service.name ?? updated.serviceId;

  sendAppointmentUpdate("updated", { appointment: updated });
  sendNotification({
    userId: updated.userId,
    email: userEmail,
    type: "EDIT_REQUEST_REJECTED",
    topic: "appointments/edit-request",
    subject: "Odrzucono zmianę wizyty",
    message: `Prośba o zmianę wizyty ${serviceName} na godzinę ${updated.editRequestedTime} została odrzucona.`,
  });
  res.json(updated);
});


appointmentsRouter.delete("/:id", auth, async (req, res) => {
  const appointmentId = Number(req.params.id);
  const appointmentRow = await get(
    "SELECT id, user_id, category_id, service_id, date, time, status FROM appointments WHERE id = ?",
    [appointmentId],
  );
  if (!appointmentRow) {
    return res.status(404).json({ message: "not found" });
  }

  const appointment = mapAppointmentRow(appointmentRow);

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
      message: "Nie można usuwać wizyty na mniej niż 24 godziny przed jej terminem",
    });
  }

  if (
    appointment.userId !== req.session.user.id &&
    req.session.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "forbidden" });
  }

  await run("DELETE FROM appointments WHERE id = ?", [appointmentId]);
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
