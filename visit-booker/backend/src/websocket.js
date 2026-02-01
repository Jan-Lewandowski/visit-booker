import { WebSocketServer } from "ws";
import { appointments } from "./data/appointments.data.js";

let wss;
let closeNotificationInterval;
const userConnections = new Map();
const notifiedCloseAppointments = new Set();
const CLOSE_NOTIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const CLOSE_NOTIFICATION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function parseUserIdFromRequest(req) {
  if (!req?.url) return null;
  try {
    const url = new URL(req.url, "http://localhost");
    const userId = Number(url.searchParams.get("userId"));
    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
}

function registerUserConnection(userId, ws) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(ws);
}

function unregisterUserConnection(userId, ws) {
  const connections = userConnections.get(userId);
  if (!connections) return;
  connections.delete(ws);
  if (connections.size === 0) {
    userConnections.delete(userId);
  }
}

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {


    const userId = parseUserIdFromRequest(req);
    console.log(`client connected ${userId}`);
    if (userId !== null) {
      ws.userId = userId;
      registerUserConnection(userId, ws);
      checkCloseAppointmentsForUser(userId);
    }

    ws.on("close", () => {
      if (ws.userId !== undefined) {
        unregisterUserConnection(ws.userId, ws);
      }
      console.log(`client disconnected ${ws.userId}`);
    });
  });

  if (!closeNotificationInterval) {
    closeNotificationInterval = setInterval(
      checkCloseAppointments,
      CLOSE_NOTIFICATION_CHECK_INTERVAL_MS,
    );
    checkCloseAppointments();
  }

  return wss;
}

function sendToAll(message) {
  if (!wss) return;

  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

function sendToUser(userId, message) {
  if (!wss) return;
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) return false;

  const payload = JSON.stringify(message);
  let sent = false;
  connections.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
      sent = true;
    }
  });

  return sent;
}

export function sendAppointmentUpdate(event, payload) {
  sendToAll({
    type: "appointments:update",
    event,
    payload,
    timestamp: new Date().toISOString(),
  });
}

export function sendUserNotification(userId, notification) {
  return sendToUser(userId, {
    type: "user:notification",
    userId,
    notification,
    timestamp: new Date().toISOString(),
  });
}

export function resetCloseNotification(appointmentId) {
  notifiedCloseAppointments.delete(appointmentId);
}

function checkCloseAppointments() {
  const now = Date.now();

  appointments.forEach((appointment) => {
    if (!appointment || appointment.status === "cancelled") return;
    const appointmentTime = new Date(
      `${appointment.date}T${appointment.time}`,
    ).getTime();
    if (Number.isNaN(appointmentTime)) return;

    if (appointmentTime <= now) {
      notifiedCloseAppointments.delete(appointment.id);
      return;
    }

    const diffMs = appointmentTime - now;
    if (
      diffMs <= CLOSE_NOTIFICATION_WINDOW_MS &&
      !notifiedCloseAppointments.has(appointment.id)
    ) {
      const sent = sendUserNotification(appointment.userId, {
        title: "Appointment soon",
        message: "Your appointment is within the next 24 hours.",
        appointmentId: appointment.id,
        date: appointment.date,
        time: appointment.time,
      });

      if (sent) {
        notifiedCloseAppointments.add(appointment.id);
      }
    }
  });
}

function checkCloseAppointmentsForUser(userId) {
  const now = Date.now();

  appointments.forEach((appointment) => {
    if (!appointment || appointment.status === "cancelled") return;
    if (appointment.userId !== userId) return;

    const appointmentTime = new Date(
      `${appointment.date}T${appointment.time}`,
    ).getTime();
    if (Number.isNaN(appointmentTime)) return;

    if (appointmentTime <= now) {
      notifiedCloseAppointments.delete(appointment.id);
      return;
    }

    const diffMs = appointmentTime - now;
    if (
      diffMs <= CLOSE_NOTIFICATION_WINDOW_MS &&
      !notifiedCloseAppointments.has(appointment.id)
    ) {
      const sent = sendUserNotification(appointment.userId, {
        title: "Appointment soon",
        message: "Your appointment is within the next 24 hours.",
        appointmentId: appointment.id,
        date: appointment.date,
        time: appointment.time,
      });

      if (sent) {
        notifiedCloseAppointments.add(appointment.id);
      }
    }
  });
}