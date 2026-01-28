export const appointments = [
  {
    "id": 1,
    "userId": 2,
    "categoryId": 1,
    "serviceId": 1,
    "date": "2026-01-24",
    "time": "10:00",
    "status": "scheduled"
  },
  {
    "id": 2,
    "userId": 3,
    "categoryId": 2,
    "serviceId": 2,
    "date": "2026-01-28",
    "time": "14:00",
    "status": "scheduled"
  },
  {
    "id": 3,
    "userId": 2,
    "categoryId": 3,
    "serviceId": 3,
    "date": "2026-01-29",
    "time": "08:00",
    "status": "scheduled"
  },
  {
    "id": 4,
    "userId": 3,
    "categoryId": 4,
    "serviceId": 4,
    "date": "2026-01-30",
    "time": "09:00",
    "status": "scheduled"
  },
  {
    "id": 5,
    "userId": 2,
    "categoryId": 5,
    "serviceId": 5,
    "date": "2026-01-31",
    "time": "11:00",
    "status": "scheduled"
  },
  {
    "id": 6,
    "userId": 1,
    "categoryId": 6,
    "serviceId": 6,
    "date": "2026-02-01",
    "time": "12:00",
    "status": "scheduled"
  },
  {
    "id": 7,
    "userId": 1,
    "categoryId": 7,
    "serviceId": 7,
    "date": "2026-02-02",
    "time": "15:00",
    "status": "scheduled"
  }];

let nextAppointmentId = 8;

export function generateAppointmentId() {
  return nextAppointmentId++;
}