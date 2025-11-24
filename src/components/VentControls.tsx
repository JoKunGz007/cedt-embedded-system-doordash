import React, { useState, useEffect } from "react";
import { DoorStatus } from "@/lib/doorTypes";

type Props = {
  status: DoorStatus | null;
  busy: boolean;
  onSetAuto: (auto: boolean) => void;
  onSetVentOn: (on: boolean) => void;
  onSetThreshold: (temp: number) => void;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#ffffff",
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  cursor: "pointer",
  fontSize: 14,
};

export default function VentControls({
  status,
  busy,
  onSetAuto,
  onSetVentOn,
  onSetThreshold,
}: Props) {
  const [localThreshold, setLocalThreshold] = useState<number>(
    status?.tempThreshold ?? 28
  );

  useEffect(() => {
    if (status) setLocalThreshold(status.tempThreshold);
  }, [status]);

  const handleApplyThreshold = () => {
    if (!status || busy) return;
    onSetThreshold(localThreshold);
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Vent & Temperature
      </h2>
      {!status ? (
        <div>No data.</div>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <strong>Current:</strong> {status.temperature.toFixed(1)}°C
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button style={buttonStyle} onClick={() => onSetAuto(true)} disabled={busy}>
              Auto
            </button>
            <button style={buttonStyle} onClick={() => onSetAuto(false)} disabled={busy}>
              Manual
            </button>
            <button
              style={buttonStyle}
              onClick={() => onSetVentOn(true)}
              disabled={busy || status.ventAuto}
            >
              Vent ON
            </button>
            <button
              style={buttonStyle}
              onClick={() => onSetVentOn(false)}
              disabled={busy || status.ventAuto}
            >
              Vent OFF
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 14 }}>
              Threshold (°C):
              <input
                type="number"
                value={localThreshold}
                onChange={(e) => setLocalThreshold(Number(e.target.value))}
                style={{
                  marginLeft: 8,
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  width: 80,
                }}
              />
            </label>
            <button
              style={buttonStyle}
              onClick={handleApplyThreshold}
              disabled={busy}
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  );
}
