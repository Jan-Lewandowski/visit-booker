"use client";

import { Category, Service } from "../../types/entities";

type UserBookingProps = {
  categories: Category[];
  services: Service[];
  servicesLoading: boolean;
  servicesError: string | null;
  serviceQuery: string;
  categoriesLoading: boolean;
  categoriesError: string | null;
  categoryId: number | null;
  serviceId: number;
  date: string;
  selectedTime: string;
  slots: string[];
  slotsLoading: boolean;
  slotsError: string | null;
  bookingError: string | null;
  bookingLoading: boolean;
  onCategoryChange: (value: number) => void;
  onServiceChange: (value: number) => void;
  onServiceQueryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onBook: () => void;
  onRefreshSlots: () => void;
};

export default function UserBooking({
  categories,
  services,
  servicesLoading,
  servicesError,
  serviceQuery,
  categoriesLoading,
  categoriesError,
  categoryId,
  serviceId,
  date,
  selectedTime,
  slots,
  slotsLoading,
  slotsError,
  bookingError,
  bookingLoading,
  onCategoryChange,
  onServiceChange,
  onServiceQueryChange,
  onDateChange,
  onTimeChange,
  onBook,
  onRefreshSlots,
}: UserBookingProps) {
  const hours = Array.from({ length: 8 }, (_, index) => 8 + index);
  const now = new Date();

  return (
    <section className="user-section">
      <h3>Zarezerwuj wizytę</h3>
      <div className="user-grid">
        <label className="user-label">
          Kategoria
          <select
            className="user-input"
            value={categoryId ?? ""}
            onChange={(e) => onCategoryChange(Number(e.target.value))}
            disabled={categoriesLoading || categories.length === 0}
          >
            {categories.length === 0 && (
              <option value="" disabled>
                Brak kategorii
              </option>
            )}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name || category.id}
              </option>
            ))}
          </select>
        </label>

        <label className="user-label">
          Usługa
          <select
            className="user-input"
            value={serviceId}
            onChange={(e) => onServiceChange(Number(e.target.value))}
            disabled={servicesLoading || services.length === 0}
          >
            {services.length === 0 && (
              <option value="" disabled>
                Brak usług
              </option>
            )}
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name || service.id}
              </option>
            ))}
          </select>
        </label>

        <label className="user-label">
          Wyszukaj usługę
          <input
            className="user-input"
            value={serviceQuery}
            onChange={(e) => onServiceQueryChange(e.target.value)}
            placeholder="Wpisz nazwę usługi"
          />
        </label>

        <label className="user-label">
          Data
          <input
            type="date"
            className="user-input"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>

        <div className="user-calendar">
          {hours.map((hour) => {
            const slot = `${String(hour).padStart(2, "0")}:00`;
            const isPast = new Date(`${date}T${slot}`) < now;
            const isAvailable = !isPast && slots.includes(slot);
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                className={`user-slot ${isAvailable ? "free" : "booked"} ${isSelected ? "selected" : ""
                  }`}
                onClick={() => isAvailable && onTimeChange(slot)}
                disabled={!isAvailable}
              >
                <div className="user-slot-time">{slot}</div>
                <div className="user-slot-status">
                  {isAvailable ? "Dostępny" : isPast ? "Niedostępny" : "Zajęty"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="user-button"
        onClick={onBook}
        disabled={bookingLoading || !selectedTime}
      >
        Zarezerwuj
      </button>

      <button type="button" className="user-button" onClick={onRefreshSlots}>
        Odśwież sloty
      </button>

      {categoriesLoading && <p>Ładowanie kategorii...</p>}
      {categoriesError && <p className="user-error">{categoriesError}</p>}
      {servicesLoading && <p>Ładowanie usług...</p>}
      {servicesError && <p className="user-error">{servicesError}</p>}
      {slotsLoading && <p>Ładowanie slotów...</p>}
      {slotsError && <p className="user-error">{slotsError}</p>}
      {bookingError && <p className="user-error">{bookingError}</p>}
    </section>
  );
}
