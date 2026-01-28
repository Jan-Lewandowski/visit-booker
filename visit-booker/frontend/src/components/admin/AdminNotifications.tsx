"use client";

type AdminNotificationsProps = {
  notifications: string[];
};

export default function AdminNotifications({ notifications }: AdminNotificationsProps) {
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
