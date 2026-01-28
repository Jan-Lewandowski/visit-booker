"use client";

import { User } from "../../types/entities";

type AdminUserManagementProps = {
  users: User[];
  usersError: string | null;
  onDeleteUser: (userId: number) => void;
  onRoleChange: (userId: number) => void;
};

export default function AdminUserManagement({
  users,
  usersError,
  onDeleteUser,
  onRoleChange,
}: AdminUserManagementProps) {
  const isAdmin = (user: User) => user.role === "admin";

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
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button
                  className="admin-button"
                  onClick={() => onRoleChange(user.id)}
                >
                  {isAdmin(user) ? "Zmień na użytkownika" : "Zmień na admina"}
                </button>
                <button
                  className="admin-button danger"
                  onClick={() => onDeleteUser(user.id)}
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
