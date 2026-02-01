"use client";

import { useAdminDashboard } from "../../context/AdminDashboardContext";

export default function AdminUserManagement() {
  const { currentUserId, users, usersError, deleteUser, toggleUserRole } =
    useAdminDashboard();
  const isAdmin = (user: { role: string }) => user.role === "admin";

  return (
    <section className="admin-section">
      <h3>Zarządzanie użytkownikami</h3>
      {usersError && <p className="admin-error">{usersError}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>E-mail</th>
            <th>Rola</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const disableAdminActions =
              isAdmin(user) && user.id !== currentUserId;
            return (
              <tr key={`${user.id}-${user.email}`}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    className="admin-button"
                    onClick={() => toggleUserRole(user.id)}
                    disabled={disableAdminActions}
                  >
                    {isAdmin(user) ? "Zmień na użytkownika" : "Zmień na admina"}
                  </button>
                  <button
                    className="admin-button danger"
                    onClick={() => deleteUser(user.id)}
                    disabled={disableAdminActions}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
