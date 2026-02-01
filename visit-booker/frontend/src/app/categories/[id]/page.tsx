"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import UserBooking from "../../../components/user/UserBooking";
import { UserDashboardProvider, useUserDashboard } from "../../../context/UserDashboardContext";
import "../../../styles/user-dashboard.css";

function CategoryBookingContent({ categoryId }: { categoryId: number }) {
  const { categories, categoriesLoading, categoriesError } = useUserDashboard();
  const category = categories.find((item) => item.id === categoryId);

  return (
    <div className="user-dashboard">
      <div className="user-back">
        <Link href="/">← Wróć do panelu</Link>
      </div>
      <h2>Rezerwacja: {category?.name ?? `Kategoria #${categoryId}`}</h2>
      {categoriesLoading && <p>Ładowanie kategorii...</p>}
      {categoriesError && <p className="user-error">{categoriesError}</p>}
      <UserBooking />
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const categoryId = Number(rawId);

  if (!Number.isFinite(categoryId)) {
    return (
      <div className="user-dashboard">
        <p>Nieprawidłowa kategoria.</p>
        <Link href="/">Wróć</Link>
      </div>
    );
  }

  return (
    <UserDashboardProvider enabled lockedCategoryId={categoryId}>
      <CategoryBookingContent categoryId={categoryId} />
    </UserDashboardProvider>
  );
}
