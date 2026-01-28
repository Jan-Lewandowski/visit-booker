export const categories = [
  {
    "id": 1,
    "name": "Włosy",
    "services": [
      { "id": 1, "name": "Strzyżenie męskie", "durationMinutes": 30, "price": 50 },
      { "id": 2, "name": "Strzyżenie damskie", "durationMinutes": 60, "price": 120 }
    ]
  },
  {
    "id": 2,
    "name": "Paznokcie",
    "services": [
      { "id": 1, "name": "Manicure klasyczny", "durationMinutes": 45, "price": 80 },
      { "id": 2, "name": "Manicure żelowy", "durationMinutes": 60, "price": 110 }
    ]
  },
  {
    "id": 3,
    "name": "Masaż",
    "services": [
      { "id": 3, "name": "Masaż klasyczny", "durationMinutes": 60, "price": 150 }
    ]
  },
  {
    "id": 4,
    "name": "Kosmetyka",
    "services": [
      { "id": 4, "name": "Zabieg na twarz", "durationMinutes": 50, "price": 130 }
    ]
  },
  {
    "id": 5,
    "name": "Brwi i rzęsy",
    "services": [
      { "id": 5, "name": "Laminacja brwi", "durationMinutes": 40, "price": 90 }
    ]
  },
  {
    "id": 6,
    "name": "Depilacja",
    "services": [
      { "id": 6, "name": "Depilacja woskiem", "durationMinutes": 30, "price": 70 }
    ]
  },
  {
    "id": 7,
    "name": "Makijaż",
    "services": [
      { "id": 7, "name": "Makijaż dzienny", "durationMinutes": 45, "price": 120 }
    ]
  }];
let nextCategoryId = 8;
let nextServiceId = 8;

export function generateCategoryId() {
  return nextCategoryId++;
}

export function generateServiceId() {
  return nextServiceId++;
}