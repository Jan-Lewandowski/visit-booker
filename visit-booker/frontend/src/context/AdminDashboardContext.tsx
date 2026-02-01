"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { API_URL } from "../lib/api";
import { Appointment, Category, User } from "../types/entities";

type EventMessage = {
  type: string;
  event?: "created" | "updated" | "deleted";
  payload?: {
    appointment?: Appointment;
    appointmentId?: number;
  };
};

type AdminDashboardContextValue = {
  currentUserId: number | null;
  users: User[];
  usersError: string | null;
  categories: Category[];
  categoriesError: string | null;
  newCategoryName: string;
  editingCategoryId: number | null;
  editingCategoryName: string;
  serviceCategoryId: number | null;
  serviceName: string;
  serviceDuration: string;
  servicePrice: string;
  editingServiceId: number | null;
  editingServiceName: string;
  editingServiceDuration: string;
  editingServicePrice: string;
  appointments: Appointment[];
  appointmentsError: string | null;
  editingAppointmentId: number | null;
  editCategoryId: number | null;
  editServiceId: number | null;
  editDate: string;
  editTime: string;
  notifications: string[];
  setNewCategoryName: (value: string) => void;
  setEditingCategoryName: (value: string) => void;
  setServiceCategoryId: (value: number | null) => void;
  setServiceName: (value: string) => void;
  setServiceDuration: (value: string) => void;
  setServicePrice: (value: string) => void;
  setEditingServiceName: (value: string) => void;
  setEditingServiceDuration: (value: string) => void;
  setEditingServicePrice: (value: string) => void;
  setEditCategoryId: (value: number | null) => void;
  setEditServiceId: (value: number | null) => void;
  setEditDate: (value: string) => void;
  setEditTime: (value: string) => void;
  createCategory: () => void;
  startEditCategory: (category: Category) => void;
  saveCategory: (categoryId: number) => void;
  deleteCategory: (categoryId: number) => void;
  createService: () => void;
  startEditService: (service: Category["services"][number]) => void;
  cancelEditService: () => void;
  saveService: (serviceId: number) => void;
  startEditAppointment: (appointment: Appointment) => void;
  saveAppointment: (appointmentId: number) => void;
  deleteAppointment: (appointmentId: number) => void;
  deleteUser: (userId: number) => void;
  toggleUserRole: (userId: number) => void;
};

const AdminDashboardContext = createContext<AdminDashboardContextValue | undefined>(
  undefined,
);

export function AdminDashboardProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!enabled) return;
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: { id: number }) => setCurrentUserId(data.id))
      .catch(() => setCurrentUserId(null));
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
        if (event.type === "appointments:update") {
          const label = event.event ?? "updated";
          setNotifications((prev) => [
            `appointments:${label} o ${new Date().toLocaleTimeString()}`,
            ...prev,
          ]);
          loadAppointments();
        }
      } catch {
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

  const deleteUser = async (userId: number) => {
    const target = users.find((user) => user.id === userId);
    if (target?.role === "admin" && target.id !== currentUserId) {
      setUsersError("Nie można usuwać innych administratorów.");
      return;
    }
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
  };

  const toggleUserRole = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (user.role === "admin" && user.id !== currentUserId) {
      setUsersError("Nie można zmieniać roli innych administratorów.");
      return;
    }
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
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setUsersError(message);
    }
  };

  const value: AdminDashboardContextValue = {
    currentUserId,
    users,
    usersError,
    categories,
    categoriesError,
    newCategoryName,
    editingCategoryId,
    editingCategoryName,
    serviceCategoryId,
    serviceName,
    serviceDuration,
    servicePrice,
    editingServiceId,
    editingServiceName,
    editingServiceDuration,
    editingServicePrice,
    appointments,
    appointmentsError,
    editingAppointmentId,
    editCategoryId,
    editServiceId,
    editDate,
    editTime,
    notifications,
    setNewCategoryName,
    setEditingCategoryName,
    setServiceCategoryId,
    setServiceName,
    setServiceDuration,
    setServicePrice,
    setEditingServiceName,
    setEditingServiceDuration,
    setEditingServicePrice,
    setEditCategoryId,
    setEditServiceId,
    setEditDate,
    setEditTime,
    createCategory,
    startEditCategory,
    saveCategory,
    deleteCategory,
    createService,
    startEditService,
    cancelEditService,
    saveService,
    startEditAppointment,
    saveAppointment,
    deleteAppointment,
    deleteUser,
    toggleUserRole,
  };

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error("useAdminDashboard must be used within AdminDashboardProvider");
  }
  return context;
}
