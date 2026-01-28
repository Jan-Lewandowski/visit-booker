"use client";

import { Category } from "../../types/entities";

type AdminCategoryManagementProps = {
  categories: Category[];
  categoriesError: string | null;
  newCategoryName: string;
  editingCategoryId: number | null;
  editingCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  onEditingCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
  onStartEditCategory: (category: Category) => void;
  onSaveCategory: (categoryId: number) => void;
  onDeleteCategory: (categoryId: number) => void;
};

export default function AdminCategoryManagement({
  categories,
  categoriesError,
  newCategoryName,
  editingCategoryId,
  editingCategoryName,
  onNewCategoryNameChange,
  onEditingCategoryNameChange,
  onCreateCategory,
  onStartEditCategory,
  onSaveCategory,
  onDeleteCategory,
}: AdminCategoryManagementProps) {
  return (
    <section className="admin-section">
      <h3>Zarządzanie kategoriami</h3>
      {categoriesError && <p className="admin-error">{categoriesError}</p>}
      <div className="admin-form">
        <input
          className="admin-input"
          placeholder="Nazwa nowej kategorii"
          value={newCategoryName}
          onChange={(e) => onNewCategoryNameChange(e.target.value)}
        />
        <button className="admin-button" onClick={onCreateCategory}>
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
                    onChange={(e) => onEditingCategoryNameChange(e.target.value)}
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
                    onClick={() => onSaveCategory(category.id)}
                  >
                    Zapisz
                  </button>
                ) : (
                  <button
                    className="admin-button"
                    onClick={() => onStartEditCategory(category)}
                  >
                    Edytuj
                  </button>
                )}
                <button
                  className="admin-button danger"
                  onClick={() => onDeleteCategory(category.id)}
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
