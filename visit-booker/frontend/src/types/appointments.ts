export type Appointment = {
  id: number;
  userId: number;
  categoryId: number;
  serviceId: number;
  date: string;
  time: string;
  status: "scheduled" | "cancelled";
};

export type AppointmentEvent = {
  type: "appointments:update";
  event: "created" | "updated" | "deleted";
  payload: {
    appointment?: Appointment;
    appointmentId?: number;
  };
};
