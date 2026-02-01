"use client";

import { useAdminDashboard } from "../../context/AdminDashboardContext";

export default function AdminNotifications() {
  const { notifications } = useAdminDashboard();
  return (
    <section className="admin-section">
      <h3>Powiadomienia w czasie rzeczywistym</h3>
      <ul className="admin-notifications">
        {notifications.map((note, index) => (
          <li key={`${note}-${index}`}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
