"use client";

import { useEffect, useState } from "react";
import { useAdminDashboard } from "../../context/AdminDashboardContext";

export default function AdminAppointmentManagement() {
  const {
    appointments,
    appointmentsError,
    categories,
    editingAppointmentId,
    editCategoryId,
    editServiceId,
    editDate,
    editTime,
    setEditCategoryId,
    setEditServiceId,
    setEditDate,
    setEditTime,
    startEditAppointment,
    saveAppointment,
    deleteAppointment,
  } = useAdminDashboard();
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  );

  const now = new Date();

  const appointmentCategory = categories.find((c) => c.id === editCategoryId);
  const appointmentServices = appointmentCategory?.services ?? [];
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedServices = selectedCategory?.services ?? [];
  const selectedService = selectedServices.find((s) => s.id === selectedServiceId);
  const getCategoryName = (categoryId: number) =>
    categories.find((category) => category.id === categoryId)?.name || categoryId;
  const getServiceName = (categoryId: number, serviceId: number) => {
    const category = categories.find((item) => item.id === categoryId);
    return (
      category?.services.find((service) => service.id === serviceId)?.name ||
      serviceId
    );
  };

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId(null);
      setSelectedServiceId(null);
      return;
    }
    setSelectedCategoryId((prev) => prev ?? categories[0].id);
  }, [categories]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedServiceId(null);
      return;
    }
    const category = categories.find((c) => c.id === selectedCategoryId);
    if (!category || category.services.length === 0) {
      setSelectedServiceId(null);
      return;
    }
    setSelectedServiceId((prev) => prev ?? category.services[0].id);
  }, [selectedCategoryId, categories]);

  const appointmentsForDay = appointments.filter((appointment) => {
    if (appointment.date !== selectedDate) return false;
    if (!selectedCategoryId || !selectedServiceId) return false;
    return (
      appointment.categoryId === selectedCategoryId &&
      appointment.serviceId === selectedServiceId
    );
  });

  const durationMinutes = Number(
    selectedService?.durationMinutes ?? selectedService?.duration ?? 0,
  );
  const openMinutes = 8 * 60;
  const closeMinutes = 16 * 60;
  const slots: string[] = [];
  if (durationMinutes > 0) {
    for (
      let start = openMinutes;
      start + durationMinutes <= closeMinutes;
      start += durationMinutes
    ) {
      const hour = Math.floor(start / 60);
      const minute = start % 60;
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
  }

  const occupiedTimes = appointmentsForDay
    .filter((appointment) => appointment.id !== editingAppointmentId)
    .map((appointment) => appointment.time);
  const availableSlotsForEdit = slots.filter(
    (slot) => !occupiedTimes.includes(slot) || slot === editTime,
  );

  return (
    <section className="admin-section">
      <h3>Zarządzanie wizytami</h3>
      {appointmentsError && <p className="admin-error">{appointmentsError}</p>}
      <div className="admin-calendar-controls">
        <label className="admin-label">
          Data
          <input
            className="admin-input"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
        <label className="admin-label">
          Kategoria
          <select
            className="admin-input"
            value={selectedCategoryId ?? ""}
            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name || category.id}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-label">
          Usługa
          <select
            className="admin-input"
            value={selectedServiceId ?? ""}
            onChange={(e) => setSelectedServiceId(Number(e.target.value))}
            disabled={selectedServices.length === 0}
          >
            {selectedServices.length === 0 && (
              <option value="" disabled>
                Brak usług
              </option>
            )}
            {selectedServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name || service.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-calendar">
        {slots.map((slotTime) => {
          const appointment = appointmentsForDay.find(
            (item) => item.time === slotTime,
          );
          const isPast = new Date(`${selectedDate}T${slotTime}`) < now;
          const statusLabel = appointment
            ? isPast
              ? "Zakończony"
              : ""
            : isPast
              ? "Niedostępny"
              : "";
          return (
            <div
              key={slotTime}
              className={`admin-slot ${appointment ? "busy" : "free"}`}
            >
              <div className="admin-slot-time">{slotTime}</div>
              {appointment ? (
                <div className="admin-slot-details">
                  <div>#{appointment.id} • Użytkownik {appointment.userId}</div>
                  <div>
                    {getCategoryName(appointment.categoryId)} /{" "}
                    {getServiceName(appointment.categoryId, appointment.serviceId)}
                  </div>
                  {statusLabel && <div>{statusLabel}</div>}
                  {!isPast && (
                    <div className="admin-editor-actions">
                      <button
                        className="admin-button"
                        onClick={() => startEditAppointment(appointment)}
                      >
                        Edytuj
                      </button>
                      <button
                        className="admin-button danger"
                        onClick={() => deleteAppointment(appointment.id)}
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="admin-slot-empty">
                  {statusLabel || "Brak wizyty"}
                </div>
              )}
            </div>
          );
        })}
        {slots.length === 0 && (
          <p className="admin-note">Wybierz usługę, aby zobaczyć sloty.</p>
        )}
      </div>

      {editingAppointmentId && (
        <div className="admin-editor">
          <h4>Edytuj wizytę #{editingAppointmentId}</h4>
          <div className="admin-form">
            <label className="admin-label">
              Kategoria
              <select
                className="admin-input"
                value={editCategoryId ?? ""}
                onChange={(e) => setEditCategoryId(Number(e.target.value))}
                disabled={Boolean(editingAppointmentId)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name || category.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-label">
              Usługa
              <select
                className="admin-input"
                value={editServiceId ?? ""}
                onChange={(e) => setEditServiceId(Number(e.target.value))}
                disabled={Boolean(editingAppointmentId)}
              >
                {appointmentServices.map((service, index) => (
                  <option
                    key={`${appointmentCategory?.id ?? "cat"}-${service.id}-${index}`}
                    value={service.id}
                  >
                    {service.name || service.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-label">
              Data
              <input
                className="admin-input"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </label>
            <label className="admin-label">
              Godzina
              <select
                className="admin-input"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                disabled={availableSlotsForEdit.length === 0}
              >
                {availableSlotsForEdit.length === 0 && (
                  <option value="" disabled>
                    Brak dostępnych slotów
                  </option>
                )}
                {availableSlotsForEdit.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-editor-actions">
            <button
              className="admin-button"
              onClick={() => saveAppointment(editingAppointmentId)}
            >
              Zapisz
            </button>
            <button
              className="admin-button danger"
              onClick={() => deleteAppointment(editingAppointmentId)}
            >
              Usuń
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
