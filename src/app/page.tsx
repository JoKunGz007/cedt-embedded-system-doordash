"use client";

import React, { useEffect, useState } from "react";
import { DoorStatus, DoorLogEntry, DoorMode } from "@/lib/doorTypes";
import DoorStatusCard from "@/components/DoorStatusCard";
import DoorControls from "@/components/DoorControls";
import VentControls from "@/components/VentControls";
import LogsPanel from "@/components/LogsPanel";   // <-- default import

import {
  fetchDoorStatus,
  fetchLogs,
  lockDoor,
  unlockDoor,
  setMode,
  refreshStatusFromHardware,
  setVentAuto,
  setVentOn,
  setTempThreshold,
} from "@/lib/doorService";

const appStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  background: "#f3f4f6",
};

const layoutStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 16,
};

export default function Page() {
  const [status, setStatus] = useState<DoorStatus | null>(null);
  const [logs, setLogs] = useState<DoorLogEntry[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadInitial() {
    try {
      setLoadingStatus(true);
      setLoadingLogs(true);
      const [s, l] = await Promise.all([fetchDoorStatus(), fetchLogs()]);
      setStatus(s);
      setLogs(l);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load initial data");
    } finally {
      setLoadingStatus(false);
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  const handleRefresh = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await refreshStatusFromHardware();
      setStatus(s);
      const l = await fetchLogs();
      setLogs(l);
    } catch (e: any) {
      setError(e?.message ?? "Failed to refresh status");
    } finally {
      setBusy(false);
    }
  };

  const handleLock = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await lockDoor();
      setStatus(s);
      setLogs(await fetchLogs());
    } catch (e: any) {
      setError(e?.message ?? "Failed to lock door");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await unlockDoor();
      setStatus(s);
      setLogs(await fetchLogs());
    } catch (e: any) {
      setError(e?.message ?? "Failed to unlock door");
    } finally {
      setBusy(false);
    }
  };

  const handleSetMode = async (mode: DoorMode) => {
    setBusy(true);
    setError(null);
    try {
      const s = await setMode(mode);
      setStatus(s);
      setLogs(await fetchLogs());
    } catch (e: any) {
      setError(e?.message ?? "Failed to set mode");
    } finally {
      setBusy(false);
    }
  };

  const handleSetAuto = async (auto: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const s = await setVentAuto(auto);
      setStatus(s);
      setLogs(await fetchLogs());
    } catch (e: any) {
      setError(e?.message ?? "Failed to set vent mode");
    } finally {
      setBusy(false);
    }
  };

  const handleSetVentOn = async (on: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const s = await setVentOn(on);
      setStatus(s);
      setLogs(await fetchLogs());
    } catch (e: any) {
      setError(e?.message ?? "Failed to switch vent");
    } finally {
      setBusy(false);
    }
  };

  const handleSetThreshold = async (temp: number) => {
    setBusy(true);
    setError(null);
    try {
      const s = await setTempThreshold(temp);
      setStatus(s);
      setLogs(await fetchLogs());
    } catch (e: any) {
      setError(e?.message ?? "Failed to set threshold");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={appStyle}>
      <div style={layoutStyle}>
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            DoorDash – Smart Door Dashboard
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14 }}>
            Next.js frontend prototype using a mock backend. Later you
            only replace the service calls.
          </p>
        </header>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={gridStyle}>
          <div>
            <DoorStatusCard status={status} loading={loadingStatus} />
            <DoorControls
              status={status}
              busy={busy}
              onLock={handleLock}
              onUnlock={handleUnlock}
              onSetMode={handleSetMode}
              onRefresh={handleRefresh}
            />
            <VentControls
              status={status}
              busy={busy}
              onSetAuto={handleSetAuto}
              onSetVentOn={handleSetVentOn}
              onSetThreshold={handleSetThreshold}
            />
          </div>
          <div>
            <LogsPanel logs={logs} loading={loadingLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* */