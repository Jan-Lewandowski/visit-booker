"use client";

import { useEffect, useState } from "react";
import { Appointment, Category } from "../../types/entities";

type AdminAppointmentManagementProps = {
  appointments: Appointment[];
  appointmentsError: string | null;
  categories: Category[];
  editingAppointmentId: number | null;
  editCategoryId: number | null;
  editServiceId: number | null;
  editDate: string;
  editTime: string;
  onEditCategoryChange: (value: number) => void;
  onEditServiceChange: (value: number) => void;
  onEditDateChange: (value: string) => void;
  onEditTimeChange: (value: string) => void;
  onStartEdit: (appointment: Appointment) => void;
  onSave: (appointmentId: number) => void;
  onDelete: (appointmentId: number) => void;
};

export default function AdminAppointmentManagement({
  appointments,
  appointmentsError,
  categories,
  editingAppointmentId,
  editCategoryId,
  editServiceId,
  editDate,
  editTime,
  onEditCategoryChange,
  onEditServiceChange,
  onEditDateChange,
  onEditTimeChange,
  onStartEdit,
  onSave,
  onDelete,
}: AdminAppointmentManagementProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const now = new Date();

  const hours = Array.from({ length: 8 }, (_, index) => 8 + index);

  const appointmentCategory = categories.find((c) => c.id === editCategoryId);
  const appointmentServices = appointmentCategory?.services ?? [];
  const getCategoryName = (categoryId: number) =>
    categories.find((category) => category.id === categoryId)?.name || categoryId;
  const getServiceName = (categoryId: number, serviceId: number) => {
    const category = categories.find((item) => item.id === categoryId);
    return (
      category?.services.find((service) => service.id === serviceId)?.name ||
      serviceId
    );
  };

  const getHour = (time: string) => {
    const [hour] = String(time).split(":").map(Number);
    return Number.isNaN(hour) ? null : hour;
  };

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    setSelectedCategoryId((prev) => prev ?? categories[0].id);
  }, [categories]);

  const appointmentsForDay = appointments.filter((appointment) => {
    if (appointment.date !== selectedDate) return false;
    if (!selectedCategoryId) return false;
    return appointment.categoryId === selectedCategoryId;
  });

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
      </div>

      <div className="admin-calendar">
        {hours.map((hour) => {
          const appointment = appointmentsForDay.find(
            (item) => getHour(item.time) === hour,
          );
          const slotTime = `${String(hour).padStart(2, "0")}:00`;
          const isPast = new Date(`${selectedDate}T${slotTime}`) < now;
          const statusLabel = appointment
            ? isPast
              ? "Zakończony"
              : ""
            : isPast
              ? "Niedostępny"
              : "";
          return (
            <button
              key={hour}
              type="button"
              className={`admin-slot ${appointment ? "busy" : "free"}`}
              onClick={() => appointment && !isPast && onStartEdit(appointment)}
              disabled={!appointment || isPast}
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
                </div>
              ) : (
                <div className="admin-slot-empty">
                  {statusLabel || "Brak wizyty"}
                </div>
              )}
            </button>
          );
        })}
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
                onChange={(e) => onEditCategoryChange(Number(e.target.value))}
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
                onChange={(e) => onEditServiceChange(Number(e.target.value))}
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
                onChange={(e) => onEditDateChange(e.target.value)}
              />
            </label>
            <label className="admin-label">
              Godzina
              <input
                className="admin-input"
                type="time"
                value={editTime}
                onChange={(e) => onEditTimeChange(e.target.value)}
              />
            </label>
          </div>
          <div className="admin-editor-actions">
            <button className="admin-button" onClick={() => onSave(editingAppointmentId)}>
              Zapisz
            </button>
            <button
              className="admin-button danger"
              onClick={() => onDelete(editingAppointmentId)}
            >
              Usuń
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
