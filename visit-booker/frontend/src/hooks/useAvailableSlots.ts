"use client";

import { useEffect, useState } from "react";
import type { AppointmentEvent } from "../types/appointments";

const DEFAULT_WS_URL = "ws://localhost:4000";
const API_URL = "http://localhost:4000";

type SlotsState = {
  slots: string[];
  loading: boolean;
  error: string | null;
};

export function useAvailableSlots(
  serviceId: number,
  date: string,
  enabled = true,
) {
  const [state, setState] = useState<SlotsState>({
    slots: [],
    loading: false,
    error: null,
  });

  const fetchSlots = async () => {
    if (!enabled || !serviceId || !date) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        serviceId: String(serviceId),
        date,
      });
      const res = await fetch(
        `${API_URL}/api/appointments/available?${params.toString()}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = await res.json();
      setState({ slots: data.availableSlots ?? [], loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ slots: [], loading: false, error: message });
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchSlots();
    }
  }, [enabled, serviceId, date]);

  useEffect(() => {
    if (!enabled) return;
    const wsUrl =
      typeof window !== "undefined"
        ? `ws://${window.location.hostname}:4000`
        : DEFAULT_WS_URL;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as AppointmentEvent;
        if (event.type.startsWith("appointments:")) {
          fetchSlots();
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, [enabled, serviceId, date]);

  return {
    slots: state.slots,
    loading: state.loading,
    error: state.error,
    refresh: fetchSlots,
  };
}
