export type User = {
  id: number;
  name?: string;
  email: string;
  role: string;
};

export type Service = {
  id: number;
  name: string;
  durationMinutes?: number;
  duration?: number;
  price: number;
};

export type Category = {
  id: number;
  name: string;
  services: Service[];
};

export type Appointment = {
  id: number;
  userId: number;
  categoryId: number;
  serviceId: number;
  date: string;
  time: string;
  status: string;
};
