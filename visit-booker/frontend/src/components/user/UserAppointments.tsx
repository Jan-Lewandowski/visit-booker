"use client";

import { Appointment, Category } from "../../types/entities";

type UserAppointmentsProps = {
  appointments: Appointment[];
  appointmentsError: string | null;
  categories: Category[];
  editingId: number | null;
  editDate: string;
  editTime: string;
  onStartEdit: (appointment: Appointment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (appointmentId: number) => void;
  onDelete: (appointmentId: number) => void;
  onEditDateChange: (value: string) => void;
  onEditTimeChange: (value: string) => void;
};

export default function UserAppointments({
  appointments,
  appointmentsError,
  categories,
  editingId,
  editDate,
  editTime,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditDateChange,
  onEditTimeChange,
}: UserAppointmentsProps) {
  const getCategoryName = (categoryId: number) =>
    categories.find((category) => category.id === categoryId)?.name || categoryId;

  const getServiceName = (categoryId: number, serviceId: number) => {
    const category = categories.find((item) => item.id === categoryId);
    return (
      category?.services.find((service) => service.id === serviceId)?.name ||
      serviceId
    );
  };

  return (
    <section className="user-section">
      <h3>Moje wizyty</h3>
      {appointmentsError && <p className="user-error">{appointmentsError}</p>}
      {appointments.length === 0 && <p>Brak wizyt.</p>}
      {appointments.length > 0 && (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Kategoria</th>
              <th>Usługa</th>
              <th>Data</th>
              <th>Godzina</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.id}</td>
                <td>{getCategoryName(appointment.categoryId)}</td>
                <td>
                  {getServiceName(appointment.categoryId, appointment.serviceId)}
                </td>
                <td>
                  {editingId === appointment.id ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => onEditDateChange(e.target.value)}
                      className="user-input"
                    />
                  ) : (
                    appointment.date
                  )}
                </td>
                <td>
                  {editingId === appointment.id ? (
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => onEditTimeChange(e.target.value)}
                      className="user-input"
                    />
                  ) : (
                    appointment.time
                  )}
                </td>
                <td>
                  {editingId === appointment.id ? (
                    <div className="user-actions">
                      <button
                        type="button"
                        className="user-button"
                        onClick={() => onSaveEdit(appointment.id)}
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        className="user-button secondary"
                        onClick={onCancelEdit}
                      >
                        Anuluj
                      </button>
                    </div>
                  ) : (
                    <div className="user-actions">
                      <button
                        type="button"
                        className="user-button"
                        onClick={() => onStartEdit(appointment)}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="user-button danger"
                        onClick={() => onDelete(appointment.id)}
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
