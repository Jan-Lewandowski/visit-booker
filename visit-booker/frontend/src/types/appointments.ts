export type Appointment = {
  id: number;
  userId: number;
  categoryId: number;
  serviceId: number;
  date: string;
  time: string;
  status: "scheduled" | "cancelled";
};

export type AppointmentEvent =
  | { type: "appointments:created"; appointment: Appointment }
  | { type: "appointments:updated"; appointment: Appointment }
  | { type: "appointments:deleted"; appointmentId: number };
