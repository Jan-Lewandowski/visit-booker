export const users = [
  { "id": 1, "name": "Admin", "email": "admin@test.pl", "password": "$2b$10$InYMYkOIiDAV2t6/PMbIbOZmkWFDwqCih4Ojv/rIuAJDaLnOMtA8.", "role": "admin" },
  { "id": 2, "name": "Jan Kowalski", "email": "jan@example.com", "password": "$2b$10$4lMbFNLmEJT9b6gVI/ppquvUtFFjQJhlx0KOz5yM/r03ZWFhSJjAa", "role": "user" },
  { "id": 3, "name": "Anna Nowak", "email": "anna@example.com", "password": "pass123", "role": "user" }];

let nextUserId = 1;

export function generateUserId() {
  return nextUserId++;
}
