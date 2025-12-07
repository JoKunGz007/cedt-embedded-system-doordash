import React from "react";
import { DoorLogEntry } from "@/lib/doorTypes";

type Props = {
  logs: DoorLogEntry[];
  loading: boolean;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#ffffff",
};

const badgeColors: Record<string, string> = {
  INFO: "#d1fae5",
  WARN: "#fef3c7",
  ERROR: "#fee2e2",
};

export default function LogsPanel({ logs, loading }: Props) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Event Log
      </h2>

      {loading && logs.length === 0 && <div>Loading logs...</div>}
      {logs.length === 0 && !loading && <div>No events yet.</div>}

      {/* ✅ Limit height + scroll here */}
      <div style={{ maxHeight: "119vh", overflowY: "auto", paddingRight: 8 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {logs.map((log) => (
            <li
              key={log.id}
              style={{
                padding: "6px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{log.message}</span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: badgeColors[log.level] ?? "#e5e7eb",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {log.level}
                </span>
              </div>

              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {new Date(log.timestamp).toLocaleString()}
                {log.details ? ` · ${log.details}` : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
