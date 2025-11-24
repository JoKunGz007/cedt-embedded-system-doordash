import React from "react";
import { DoorStatus, DoorMode } from "@/lib/doorTypes";

type Props = {
  status: DoorStatus | null;
  busy: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onSetMode: (mode: DoorMode) => void;
  onRefresh: () => void;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#ffffff",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  cursor: "pointer",
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#2563eb",
  color: "white",
  borderColor: "#2563eb",
};

export default function DoorControls({
  status,
  busy,
  onLock,
  onUnlock,
  onSetMode,
  onRefresh,
}: Props) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Controls
      </h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          style={primaryButtonStyle}
          onClick={onUnlock}
          disabled={busy || !status}
        >
          {busy ? "Working..." : "Unlock"}
        </button>
        <button style={buttonStyle} onClick={onLock} disabled={busy || !status}>
          Lock
        </button>
        <button
          style={buttonStyle}
          onClick={() => onSetMode("password")}
          disabled={busy || !status}
        >
          Mode: Password
        </button>
        <button
          style={buttonStyle}
          onClick={() => onSetMode("free")}
          disabled={busy || !status}
        >
          Mode: Free
        </button>
        <button style={buttonStyle} onClick={onRefresh} disabled={busy}>
          Refresh
        </button>
      </div>
    </div>
  );
}
