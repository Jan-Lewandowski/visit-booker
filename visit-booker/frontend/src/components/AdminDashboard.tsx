"use client";

import "../styles/admin-dashboard.css";
import AdminAppointmentManagement from "./admin/AdminAppointmentManagement";
import AdminCategoryManagement from "./admin/AdminCategoryManagement";
import AdminNotifications from "./admin/AdminNotifications";
import AdminServiceManagement from "./admin/AdminServiceManagement";
import AdminUserManagement from "./admin/AdminUserManagement";
import { AdminDashboardProvider, useAdminDashboard } from "../context/AdminDashboardContext";

type AdminDashboardProps = {
  enabled: boolean;
};

function AdminDashboardContent() {
  useAdminDashboard();

  return (
    <div className="admin-dashboard">
      <h2>Panel administratora</h2>
      <AdminUserManagement />

      <AdminCategoryManagement />

      <AdminServiceManagement />

      <AdminAppointmentManagement />

      <AdminNotifications />
    </div>
  );
}

export default function AdminDashboard({ enabled }: AdminDashboardProps) {
  return (
    <AdminDashboardProvider enabled={enabled}>
      <AdminDashboardContent />
    </AdminDashboardProvider>
  );
}
