"use client";

import { useUserDashboard } from "../../context/UserDashboardContext";

export default function UserBooking() {
  const {
    categories,
    services,
    servicesLoading,
    servicesError,
    serviceQuery,
    categoriesLoading,
    categoriesError,
    categoryId,
    categoryLocked,
    serviceId,
    date,
    selectedTime,
    slots,
    slotsLoading,
    slotsError,
    bookingError,
    bookingLoading,
    setCategoryId,
    setServiceId,
    setServiceQuery,
    setDate,
    setSelectedTime,
    handleBook,
    refreshSlots,
  } = useUserDashboard();
  const now = new Date();
  const selectedService = services.find((service) => service.id === serviceId);
  const durationMinutes = Number(
    selectedService?.durationMinutes ?? selectedService?.duration ?? 0,
  );
  const openMinutes = 8 * 60;
  const closeMinutes = 16 * 60;
  const allSlots: string[] = [];
  if (durationMinutes > 0) {
    for (
      let start = openMinutes;
      start + durationMinutes <= closeMinutes;
      start += durationMinutes
    ) {
      const hour = Math.floor(start / 60);
      const minute = start % 60;
      allSlots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
  }

  return (
    <section className="user-section">
      <div className="user-grid">
        {!categoryLocked && (
          <label className="user-label">
            Kategoria
            <select
              className="user-input"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(Number(e.target.value))}
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
        )}


        <label className="user-label">
          Usługa
          <input
            className="user-input"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder="Wpisz nazwę usługi"
          />
        </label>

        <div className="user-service-list" role="listbox" aria-label="Lista usług">
          {services.length === 0 && (
            <span className="user-muted">Brak usług</span>
          )}
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              className={`user-service-chip ${serviceId === service.id ? "selected" : ""}`}
              onClick={() => setServiceId(service.id)}
              role="option"
              aria-selected={serviceId === service.id}
            >
              <span className="user-service-name">{service.name || service.id}</span>
              <span className="user-service-price">{service.price} zł</span>
            </button>
          ))}
        </div>

        <label className="user-label">
          Data
          <input
            type="date"
            className="user-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <div className="user-calendar">
          {allSlots.map((slot) => {
            const isPast = new Date(`${date}T${slot}`) < now;
            const isAvailable = !isPast && slots.includes(slot);
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                className={`user-slot ${isAvailable ? "free" : "booked"} ${isSelected ? "selected" : ""}`}
                onClick={() => isAvailable && setSelectedTime(slot)}
                disabled={!isAvailable}
              >
                <div className="user-slot-time">{slot}</div>
                <div className="user-slot-status">
                  {isAvailable ? "Dostępny" : isPast ? "Niedostępny" : "Zajęty"}
                </div>
              </button>
            );
          })}
          {allSlots.length === 0 && (
            <p className="user-muted">Wybierz usługę, aby zobaczyć sloty.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="user-button"
        onClick={handleBook}
        disabled={bookingLoading || !selectedTime}
      >
        Zarezerwuj
      </button>

      <button type="button" className="user-button" onClick={refreshSlots}>
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
