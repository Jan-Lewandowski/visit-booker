"use client";

import { Category, Service } from "../../types/entities";

type AdminServiceManagementProps = {
  categories: Category[];
  serviceCategoryId: number | null;
  serviceName: string;
  serviceDuration: string;
  servicePrice: string;
  editingServiceId: number | null;
  editingServiceName: string;
  editingServiceDuration: string;
  editingServicePrice: string;
  onServiceCategoryChange: (value: number) => void;
  onServiceNameChange: (value: string) => void;
  onServiceDurationChange: (value: string) => void;
  onServicePriceChange: (value: string) => void;
  onCreateService: () => void;
  onStartEditService: (service: Service) => void;
  onCancelEditService: () => void;
  onEditingServiceNameChange: (value: string) => void;
  onEditingServiceDurationChange: (value: string) => void;
  onEditingServicePriceChange: (value: string) => void;
  onSaveService: (serviceId: number) => void;
};

export default function AdminServiceManagement({
  categories,
  serviceCategoryId,
  serviceName,
  serviceDuration,
  servicePrice,
  editingServiceId,
  editingServiceName,
  editingServiceDuration,
  editingServicePrice,
  onServiceCategoryChange,
  onServiceNameChange,
  onServiceDurationChange,
  onServicePriceChange,
  onCreateService,
  onStartEditService,
  onCancelEditService,
  onEditingServiceNameChange,
  onEditingServiceDurationChange,
  onEditingServicePriceChange,
  onSaveService,
}: AdminServiceManagementProps) {
  const selectedCategory = categories.find(
    (category) => category.id === serviceCategoryId,
  );
  const services = selectedCategory?.services ?? [];

  const getDuration = (service: Service) =>
    service.duration ?? service.durationMinutes ?? "";

  return (
    <section className="admin-section">
      <h3>Zarządzanie usługami</h3>
      <div className="admin-form">
        <label>
          Kategoria
          <select
            className="admin-input"
            value={serviceCategoryId ?? ""}
            onChange={(e) => onServiceCategoryChange(Number(e.target.value))}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.id}
              </option>
            ))}
          </select>
        </label>
        <input
          className="admin-input"
          placeholder="Nazwa usługi"
          value={serviceName}
          onChange={(e) => onServiceNameChange(e.target.value)}
        />
        <input
          className="admin-input"
          placeholder="Czas trwania (minuty)"
          value={serviceDuration}
          onChange={(e) => onServiceDurationChange(e.target.value)}
        />
        <input
          className="admin-input"
          placeholder="Cena"
          value={servicePrice}
          onChange={(e) => onServicePriceChange(e.target.value)}
        />
        <button className="admin-button" onClick={onCreateService}>
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
                    onChange={(e) => onEditingServiceNameChange(e.target.value)}
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
                    onChange={(e) =>
                      onEditingServiceDurationChange(e.target.value)
                    }
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
                    onChange={(e) => onEditingServicePriceChange(e.target.value)}
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
                      onClick={() => onSaveService(service.id)}
                    >
                      Zapisz
                    </button>
                    <button
                      className="admin-button danger"
                      onClick={onCancelEditService}
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <button
                    className="admin-button"
                    onClick={() => onStartEditService(service)}
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
