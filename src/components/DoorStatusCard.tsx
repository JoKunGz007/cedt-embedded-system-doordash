import React from "react";
import { DoorStatus } from "@/lib/doorTypes";

type Props = {
  status: DoorStatus | null;
  loading: boolean;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#ffffff",
};

export default function DoorStatusCard({ status, loading }: Props) {
  if (loading && !status) {
    return <div style={cardStyle}>Loading door status...</div>;
  }

  if (!status) {
    return <div style={cardStyle}>No status available.</div>;
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Door Status
      </h2>
      <div style={{ display: "grid", gap: 4 }}>
        <div>
          <strong>Door:</strong> {status.doorOpen ? "OPEN" : "CLOSED"}
        </div>
        <div>
          <strong>Lock:</strong> {status.locked ? "LOCKED" : "UNLOCKED"}
        </div>
        <div>
          <strong>Mode:</strong> {status.mode === "password" ? "Password" : "Free"}
        </div>
        <div>
          <strong>Temperature:</strong> {status.temperature.toFixed(1)}°C
        </div>
        <div>
          <strong>Vent:</strong>{" "}
          {status.ventOn ? "ON" : "OFF"} {status.ventAuto ? "(auto)" : "(manual)"}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Last updated: {new Date(status.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
