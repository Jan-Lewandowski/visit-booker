"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import "../styles/admin-dashboard.css";
import AdminAppointmentManagement from "./admin/AdminAppointmentManagement";
import AdminCategoryManagement from "./admin/AdminCategoryManagement";
import AdminNotifications from "./admin/AdminNotifications";
import AdminServiceManagement from "./admin/AdminServiceManagement";
import AdminUserManagement from "./admin/AdminUserManagement";
import { Appointment, Category, User } from "../types/entities";

type AdminDashboardProps = {
  enabled: boolean;
};

type EventMessage = {
  type: string;
  appointment?: Appointment;
  appointmentId?: number;
};

export default function AdminDashboard({ enabled }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [serviceCategoryId, setServiceCategoryId] = useState<number | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingServiceName, setEditingServiceName] = useState("");
  const [editingServiceDuration, setEditingServiceDuration] = useState("");
  const [editingServicePrice, setEditingServicePrice] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editServiceId, setEditServiceId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [notifications, setNotifications] = useState<string[]>([]);

  const loadUsers = () => {
    if (!enabled) return;
    fetch(`${API_URL}/api/users`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: User[]) => setUsers(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setUsersError(message);
      });
  };

  useEffect(() => {
    loadUsers();
  }, [enabled]);

  const loadCategories = () => {
    if (!enabled) return;
    fetch(`${API_URL}/api/categories`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) {
          setServiceCategoryId((prev) => prev ?? data[0].id);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setCategoriesError(message);
      });
  };

  useEffect(() => {
    loadCategories();
  }, [enabled]);

  const loadAppointments = () => {
    if (!enabled) return;
    fetch(`${API_URL}/api/appointments`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Appointment[]) => setAppointments(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setAppointmentsError(message);
      });
  };

  useEffect(() => {
    loadAppointments();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const wsUrl = `ws://${window.location.hostname}:4000`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as EventMessage;
        if (event.type.startsWith("appointments:")) {
          setNotifications((prev) => [
            `${event.type} o ${new Date().toLocaleTimeString()}`,
            ...prev,
          ]);
          loadAppointments();
        }
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [enabled]);

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (res.ok) {
      setNewCategoryName("");
      loadCategories();
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveCategory = async (categoryId: number) => {
    const res = await fetch(`${API_URL}/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: editingCategoryName }),
    });
    if (res.ok) {
      setEditingCategoryId(null);
      setEditingCategoryName("");
      loadCategories();
    }
  };

  const deleteCategory = async (categoryId: number) => {
    const res = await fetch(`${API_URL}/api/categories/${categoryId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      loadCategories();
    }
  };

  const createService = async () => {
    if (!serviceCategoryId || !serviceName || !serviceDuration || !servicePrice) {
      return;
    }
    const res = await fetch(
      `${API_URL}/api/categories/${serviceCategoryId}/services`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: serviceName,
          duration: Number(serviceDuration),
          price: Number(servicePrice),
        }),
      },
    );
    if (res.ok) {
      setServiceName("");
      setServiceDuration("");
      setServicePrice("");
      loadCategories();
    }
  };

  const startEditService = (service: Category["services"][number]) => {
    setEditingServiceId(service.id);
    setEditingServiceName(service.name);
    setEditingServiceDuration(
      String(service.duration ?? service.durationMinutes ?? ""),
    );
    setEditingServicePrice(String(service.price ?? ""));
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setEditingServiceName("");
    setEditingServiceDuration("");
    setEditingServicePrice("");
  };

  const saveService = async (serviceId: number) => {
    if (!serviceCategoryId) return;
    const res = await fetch(
      `${API_URL}/api/categories/${serviceCategoryId}/services/${serviceId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editingServiceName,
          duration: Number(editingServiceDuration),
          price: Number(editingServicePrice),
        }),
      },
    );
    if (res.ok) {
      cancelEditService();
      loadCategories();
    }
  };

  const startEditAppointment = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setEditCategoryId(appointment.categoryId);
    setEditServiceId(appointment.serviceId);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
  };

  const saveAppointment = async (appointmentId: number) => {
    const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        categoryId: editCategoryId,
        serviceId: editServiceId,
        date: editDate,
        time: editTime,
      }),
    });
    if (res.ok) {
      setEditingAppointmentId(null);
      loadAppointments();
    }
  };

  const deleteAppointment = async (appointmentId: number) => {
    const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      loadAppointments();
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Panel administratora</h2>
      <AdminUserManagement
        users={users}
        usersError={usersError}
        onDeleteUser={async (userId) => {
          try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (!res.ok) {
              throw new Error(`Request failed: ${res.status}`);
            }
            setUsers((prev) => prev.filter((u) => u.id !== userId));
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setUsersError(message);
          }
        }}
        onRoleChange={async (userId) => {
          const user = users.find((u) => u.id === userId);
          if (!user) return;
          const newRole = user.role === "admin" ? "user" : "admin";
          try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) {
              throw new Error(`Request failed: ${res.status}`);
            }
            const updated = (await res.json()) as User;
            setUsers((prev) =>
              prev.map((u) => (u.id === userId ? updated : u)),
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setUsersError(message);
          }
        }}
      />

      <AdminCategoryManagement
        categories={categories}
        categoriesError={categoriesError}
        newCategoryName={newCategoryName}
        editingCategoryId={editingCategoryId}
        editingCategoryName={editingCategoryName}
        onNewCategoryNameChange={setNewCategoryName}
        onEditingCategoryNameChange={setEditingCategoryName}
        onCreateCategory={createCategory}
        onStartEditCategory={startEditCategory}
        onSaveCategory={saveCategory}
        onDeleteCategory={deleteCategory}
      />

      <AdminServiceManagement
        categories={categories}
        serviceCategoryId={serviceCategoryId}
        serviceName={serviceName}
        serviceDuration={serviceDuration}
        servicePrice={servicePrice}
        editingServiceId={editingServiceId}
        editingServiceName={editingServiceName}
        editingServiceDuration={editingServiceDuration}
        editingServicePrice={editingServicePrice}
        onServiceCategoryChange={setServiceCategoryId}
        onServiceNameChange={setServiceName}
        onServiceDurationChange={setServiceDuration}
        onServicePriceChange={setServicePrice}
        onCreateService={createService}
        onStartEditService={startEditService}
        onCancelEditService={cancelEditService}
        onEditingServiceNameChange={setEditingServiceName}
        onEditingServiceDurationChange={setEditingServiceDuration}
        onEditingServicePriceChange={setEditingServicePrice}
        onSaveService={saveService}
      />

      <AdminAppointmentManagement
        appointments={appointments}
        appointmentsError={appointmentsError}
        categories={categories}
        editingAppointmentId={editingAppointmentId}
        editCategoryId={editCategoryId}
        editServiceId={editServiceId}
        editDate={editDate}
        editTime={editTime}
        onEditCategoryChange={setEditCategoryId}
        onEditServiceChange={setEditServiceId}
        onEditDateChange={setEditDate}
        onEditTimeChange={setEditTime}
        onStartEdit={startEditAppointment}
        onSave={saveAppointment}
        onDelete={deleteAppointment}
      />

      <AdminNotifications notifications={notifications} />
    </div>
  );
}
