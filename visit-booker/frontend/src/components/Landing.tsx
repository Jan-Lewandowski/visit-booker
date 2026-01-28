"use client";

import { useEffect, useState } from "react";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import "../styles/landing.css";

const API_URL = "http://localhost:4000";

type Service = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  services: Service[];
};

type LandingProps = {
  enabled?: boolean;
};

export default function Landing({ enabled = true }: LandingProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { slots, loading, error, refresh } = useAvailableSlots(
    serviceId,
    date,
    enabled,
  );

  useEffect(() => {
    if (!enabled) return;
    setCategoriesLoading(true);
    setCategoriesError(null);

    fetch(`${API_URL}/api/categories`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) {
          setCategoryId((prev) => prev ?? data[0].id);
          if (data[0].services?.length > 0) {
            setServiceId(data[0].services[0].id);
          }
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setCategoriesError(message);
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, [enabled]);

  useEffect(() => {
    if (!categoryId) return;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    if (category.services.length === 0) {
      setServiceId(0);
      return;
    }
    setServiceId(category.services[0].id);
  }, [categoryId, categories]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const services = selectedCategory?.services ?? [];

  return (
    <div className="landing">
      <h1>Realtime dostępne sloty</h1>
      <p>
        Sloty odświeżają się automatycznie po zdarzeniach WebSocket z backendu.
      </p>

      <label className="landing-label">
        Kategoria
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="landing-input"
          disabled={categoriesLoading || categories.length === 0}
        >
          {categories.length === 0 && (
            <option value="" disabled>
              Brak kategorii
            </option>
          )}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.id}
            </option>
          ))}
        </select>
      </label>

      <label className="landing-label">
        Usługa
        <select
          value={serviceId}
          onChange={(e) => setServiceId(Number(e.target.value))}
          className="landing-input"
          disabled={services.length === 0}
        >
          {services.length === 0 && (
            <option value="" disabled>
              Brak usług
            </option>
          )}
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.id}
            </option>
          ))}
        </select>
      </label>

      <label className="landing-label">
        Data
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="landing-input"
        />
      </label>

      <button
        type="button"
        onClick={refresh}
        className="landing-button"
      >
        Odśwież
      </button>

      {categoriesLoading && <p>Ładowanie kategorii...</p>}
      {categoriesError && <p className="landing-error">{categoriesError}</p>}
      {loading && <p>Ładowanie...</p>}
      {error && <p className="landing-error">Błąd: {error}</p>}

      {!loading && !error && (
        <ul>
          {slots.length === 0 && <li>Brak dostępnych slotów</li>}
          {slots.map((slot) => (
            <li key={slot}>{slot}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
