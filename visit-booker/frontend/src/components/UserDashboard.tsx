"use client";

import Link from "next/link";
import UserAppointments from "./user/UserAppointments";
import UserBooking from "./user/UserBooking";
import "../styles/user-dashboard.css";
import { UserDashboardProvider, useUserDashboard } from "../context/UserDashboardContext";

type UserDashboardProps = {
  enabled: boolean;
};

function UserDashboardContent() {
  const { categories, categoriesLoading, categoriesError, notifications } =
    useUserDashboard();

  return (
    <div className="user-dashboard">
      <h2>Panel użytkownika</h2>

      <section className="user-section">
        <h3>Wybierz kategorię</h3>
        {categoriesLoading && <p>Ładowanie kategorii...</p>}
        {categoriesError && <p className="user-error">{categoriesError}</p>}
        {!categoriesLoading && categories.length === 0 && (
          <p>Brak kategorii.</p>
        )}
        <div className="user-category-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="user-category-card"
            >
              <div className="user-category-title">{category.name}</div>
              <div className="user-category-meta">
                {category.services.length} usług
              </div>
            </Link>
          ))}
        </div>
      </section>

      <UserAppointments />

      {notifications.length > 0 && (
        <div className="user-notifications">
          <h3>Powiadomienia</h3>
          <ul>
            {notifications.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function UserDashboard({ enabled }: UserDashboardProps) {
  return (
    <UserDashboardProvider enabled={enabled}>
      <UserDashboardContent />
    </UserDashboardProvider>
  );
}
