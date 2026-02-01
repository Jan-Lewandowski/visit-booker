"use client";

import { useAdminDashboard } from "../../context/AdminDashboardContext";

export default function AdminServiceManagement() {
  const {
    categories,
    serviceCategoryId,
    serviceName,
    serviceDuration,
    servicePrice,
    editingServiceId,
    editingServiceName,
    editingServiceDuration,
    editingServicePrice,
    setServiceCategoryId,
    setServiceName,
    setServiceDuration,
    setServicePrice,
    createService,
    startEditService,
    cancelEditService,
    setEditingServiceName,
    setEditingServiceDuration,
    setEditingServicePrice,
    saveService,
  } = useAdminDashboard();
  const selectedCategory = categories.find(
    (category) => category.id === serviceCategoryId,
  );
  const services = selectedCategory?.services ?? [];

  const getDuration = (service: { duration?: number; durationMinutes?: number }) =>
    service.duration ?? service.durationMinutes ?? "";

  return (
    <section className="admin-section">
      <h3>Zarządzanie usługami</h3>
      <div className="admin-form">
        <select
          className="admin-input"
          value={serviceCategoryId ?? ""}
          onChange={(e) => setServiceCategoryId(Number(e.target.value))}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name || category.id}
            </option>
          ))}
        </select>
        <input
          className="admin-input"
          placeholder="Nazwa usługi"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
        <input
          className="admin-input"
          placeholder="Czas trwania (minuty)"
          value={serviceDuration}
          onChange={(e) => setServiceDuration(e.target.value)}
        />
        <input
          className="admin-input"
          placeholder="Cena"
          value={servicePrice}
          onChange={(e) => setServicePrice(e.target.value)}
        />
        <button className="admin-button" onClick={createService}>
          Dodaj usługę
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nazwa</th>
            <th>Czas (min)</th>
            <th>Cena</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {services.length === 0 && (
            <tr>
              <td colSpan={5}>Brak usług</td>
            </tr>
          )}
          {services.map((service, index) => (
            <tr key={`${service.id}-${index}`}>
              <td>{service.id}</td>
              <td>
                {editingServiceId === service.id ? (
                  <input
                    className="admin-input"
                    value={editingServiceName}
                    onChange={(e) => setEditingServiceName(e.target.value)}
                  />
                ) : (
                  service.name
                )}
              </td>
              <td>
                {editingServiceId === service.id ? (
                  <input
                    className="admin-input"
                    value={editingServiceDuration}
                    onChange={(e) => setEditingServiceDuration(e.target.value)}
                  />
                ) : (
                  getDuration(service)
                )}
              </td>
              <td>
                {editingServiceId === service.id ? (
                  <input
                    className="admin-input"
                    value={editingServicePrice}
                    onChange={(e) => setEditingServicePrice(e.target.value)}
                  />
                ) : (
                  service.price
                )}
              </td>
              <td>
                {editingServiceId === service.id ? (
                  <div className="admin-editor-actions">
                    <button
                      className="admin-button"
                      onClick={() => saveService(service.id)}
                    >
                      Zapisz
                    </button>
                    <button
                      className="admin-button danger"
                      onClick={cancelEditService}
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <button
                    className="admin-button"
                    onClick={() => startEditService(service)}
                  >
                    Edytuj
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
