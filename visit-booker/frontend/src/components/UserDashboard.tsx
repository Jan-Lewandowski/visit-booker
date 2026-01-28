"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import UserAppointments from "./user/UserAppointments";
import UserBooking from "./user/UserBooking";
import "../styles/user-dashboard.css";
import { Appointment, Category, Service } from "../types/entities";

type UserDashboardProps = {
  enabled: boolean;
};

export default function UserDashboard({ enabled }: UserDashboardProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [serviceQuery, setServiceQuery] = useState("");

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number>(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

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
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
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
      .finally(() => setCategoriesLoading(false));
  }, [enabled]);

  useEffect(() => {
    if (!categoryId) return;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    if (category.services.length === 0) {
      setServices([]);
      setServiceId(0);
      return;
    }
    setServices(category.services);
    setServiceId(category.services[0].id);
    setServiceQuery("");
  }, [categoryId, categories]);

  useEffect(() => {
    if (!enabled || !categoryId) return;
    const query = serviceQuery.trim();
    const category = categories.find((c) => c.id === categoryId);
    if (!query) {
      const fallbackServices = category?.services ?? [];
      setServices(fallbackServices);
      if (fallbackServices.length === 0) {
        setServiceId(0);
      } else if (!fallbackServices.some((service) => service.id === serviceId)) {
        setServiceId(fallbackServices[0].id);
      }
      setServicesError(null);
      setServicesLoading(false);
      return;
    }

    setServicesLoading(true);
    setServicesError(null);
    fetch(
      `${API_URL}/api/categories/${categoryId}/services/search?q=${encodeURIComponent(query)}`,
      { credentials: "include" },
    )
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = data.message || `Request failed: ${res.status}`;
          throw new Error(message);
        }
        return res.json();
      })
      .then((data: Service[]) => {
        setServices(data);
        if (data.length === 0) {
          setServiceId(0);
        } else if (!data.some((service) => service.id === serviceId)) {
          setServiceId(data[0].id);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setServicesError(message);
        setServices([]);
      })
      .finally(() => setServicesLoading(false));
  }, [enabled, categoryId, categories, serviceQuery, serviceId]);

  useEffect(() => {
    if (!enabled) return;
    fetch(`${API_URL}/api/appointments/my`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Appointment[]) => {
        setAppointments(data);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setAppointmentsError(message);
      });
  }, [enabled]);

  const handleBook = async () => {
    if (!categoryId || !serviceId || !date || !selectedTime) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          categoryId,
          serviceId,
          date,
          time: selectedTime,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${res.status}`);
      }
      await refresh();
      const list = await fetch(`${API_URL}/api/appointments/my`, {
        credentials: "include",
      }).then((r) => r.json());
      setAppointments(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const startEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate("");
    setEditTime("");
  };

  const saveEdit = async (appointmentId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: editDate, time: editTime }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${res.status}`);
      }
      const list = await fetch(`${API_URL}/api/appointments/my`, {
        credentials: "include",
      }).then((r) => r.json());
      setAppointments(list);
      cancelEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setAppointmentsError(message);
    }
  };

  const deleteAppointment = async (appointmentId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${res.status}`);
      }
      const list = await fetch(`${API_URL}/api/appointments/my`, {
        credentials: "include",
      }).then((r) => r.json());
      setAppointments(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setAppointmentsError(message);
    }
  };

  return (
    <div className="user-dashboard">
      <h2>Panel użytkownika</h2>

      <UserBooking
        categories={categories}
        services={services}
        servicesLoading={servicesLoading}
        servicesError={servicesError}
        serviceQuery={serviceQuery}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        categoryId={categoryId}
        serviceId={serviceId}
        date={date}
        selectedTime={selectedTime}
        slots={slots}
        slotsLoading={loading}
        slotsError={error}
        bookingError={bookingError}
        bookingLoading={bookingLoading}
        onCategoryChange={setCategoryId}
        onServiceChange={setServiceId}
        onServiceQueryChange={setServiceQuery}
        onDateChange={setDate}
        onTimeChange={setSelectedTime}
        onBook={handleBook}
        onRefreshSlots={refresh}
      />

      <UserAppointments
        appointments={appointments}
        appointmentsError={appointmentsError}
        categories={categories}
        editingId={editingId}
        editDate={editDate}
        editTime={editTime}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onDelete={deleteAppointment}
        onEditDateChange={setEditDate}
        onEditTimeChange={setEditTime}
      />
    </div>
  );
}
