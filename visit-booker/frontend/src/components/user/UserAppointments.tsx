"use client";

import { useUserDashboard } from "../../context/UserDashboardContext";

export default function UserAppointments() {
  const {
    appointments,
    appointmentsError,
    categories,
    editingId,
    editDate,
    editTime,
    editSlots,
    editSlotsLoading,
    editSlotsError,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteAppointment,
    setEditDate,
    setEditTime,
  } = useUserDashboard();
  const getCategoryName = (categoryId: number) =>
    categories.find((category) => category.id === categoryId)?.name || categoryId;

  const getServiceName = (categoryId: number, serviceId: number) => {
    const category = categories.find((item) => item.id === categoryId);
    return (
      category?.services.find((service) => service.id === serviceId)?.name ||
      serviceId
    );
  };

  const editSlotOptions = editTime && !editSlots.includes(editTime)
    ? [editTime, ...editSlots]
    : editSlots;

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
                      onChange={(e) => setEditDate(e.target.value)}
                      className="user-input"
                    />
                  ) : (
                    appointment.date
                  )}
                </td>
                <td>
                  {editingId === appointment.id ? (
                    <select
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="user-input"
                      disabled={editSlotsLoading || editSlotOptions.length === 0}
                    >
                      {editSlotsLoading && (
                        <option value="" disabled>
                          Ładowanie slotów...
                        </option>
                      )}
                      {!editSlotsLoading && editSlotOptions.length === 0 && (
                        <option value="" disabled>
                          Brak dostępnych slotów
                        </option>
                      )}
                      {editSlotOptions.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
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
                        onClick={() => saveEdit(appointment.id)}
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        className="user-button secondary"
                        onClick={cancelEdit}
                      >
                        Anuluj
                      </button>
                    </div>
                  ) : (
                    <div className="user-actions">
                      <button
                        type="button"
                        className="user-button"
                        onClick={() => startEdit(appointment)}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="user-button danger"
                        onClick={() => deleteAppointment(appointment.id)}
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
      {editingId && editSlotsError && (
        <p className="user-error">{editSlotsError}</p>
      )}
    </section>
  );
}
