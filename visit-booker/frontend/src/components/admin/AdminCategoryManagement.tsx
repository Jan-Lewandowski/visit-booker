"use client";

import { useAdminDashboard } from "../../context/AdminDashboardContext";

export default function AdminCategoryManagement() {
  const {
    categories,
    categoriesError,
    newCategoryName,
    editingCategoryId,
    editingCategoryName,
    setNewCategoryName,
    setEditingCategoryName,
    createCategory,
    startEditCategory,
    saveCategory,
    deleteCategory,
  } = useAdminDashboard();
  return (
    <section className="admin-section">
      <h3>Zarządzanie kategoriami</h3>
      {categoriesError && <p className="admin-error">{categoriesError}</p>}
      <div className="admin-form">
        <input
          className="admin-input"
          placeholder="Nazwa nowej kategorii"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button className="admin-button" onClick={createCategory}>
          Dodaj kategorię
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nazwa</th>
            <th>Usługi</th>
            <th>Lista usług</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.id}</td>
              <td>
                {editingCategoryId === category.id ? (
                  <input
                    className="admin-input"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                  />
                ) : (
                  category.name
                )}
              </td>
              <td>{category.services.length}</td>
              <td>
                {category.services.length === 0
                  ? "Brak usług"
                  : category.services
                    .map((service) => service.name || service.id)
                    .join(", ")}
              </td>
              <td>
                {editingCategoryId === category.id ? (
                  <button
                    className="admin-button"
                    onClick={() => saveCategory(category.id)}
                  >
                    Zapisz
                  </button>
                ) : (
                  <button
                    className="admin-button"
                    onClick={() => startEditCategory(category)}
                  >
                    Edytuj
                  </button>
                )}
                <button
                  className="admin-button danger"
                  onClick={() => deleteCategory(category.id)}
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
