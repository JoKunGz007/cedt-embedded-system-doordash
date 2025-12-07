import React, { useState, useEffect } from "react";
// สมมติว่า DoorStatus ถูก Import มาจาก doorTypes ที่เข้ากันได้กับ doorService.ts
// (DoorStatus มี field: fire_State, temperature, humidity, tempThreshold)

// ประเภท Props สำหรับ FireControls
type Props = {
  status: any | null; // ใช้ any ชั่วคราวเนื่องจากไม่มี doorTypes.ts
  busy: boolean;
  onSetThreshold: (temp: number) => void;
  onRingBell: () => void; // ฟังก์ชันจำลองการกดกริ่ง/แจ้งเตือน
};

// สไตล์ Tailwind CSS สำหรับการใช้งานในสภาพแวดล้อมที่รองรับ (ใช้ Inline Style เพื่อความเข้ากันได้)
const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#ffffff",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #fca5a5", // สีแดงอ่อน
  background: "#fee2e2", // สีชมพูอ่อนมาก
  color: "#b91c1c", // สีแดงเข้ม
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  transition: "background 0.3s",
};

const applyButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #ffffffff", // สีเขียว
  background: "#8a86e3ff",
  color: "#ffffffff",
};

export default function FireControls({
  status,
  busy,
  onSetThreshold,
  onRingBell,
}: Props) {
  const [localThreshold, setLocalThreshold] = useState<number>(
    status?.tempThreshold ?? 28
  );

  useEffect(() => {
    // ซิงค์ localThreshold กับ status ที่ได้รับมาใหม่
    if (status) setLocalThreshold(status.tempThreshold);
  }, [status]);

  const handleApplyThreshold = () => {
    if (!status || busy) return;
    onSetThreshold(localThreshold);
  };

  const isFireAlert = status?.fire_State === 'Yes';
  const fireStatusColor = isFireAlert ? '#dc2626' : '#16a34a'; // Red or Green

  return (
    <div style={cardStyle}>
      <h2 style={{ 
          fontSize: 18, 
          fontWeight: 700, 
          marginBottom: 12, 
          color: isFireAlert ? fireStatusColor : '#1f2937'
        }}>
        Fire & Climate Controls
      </h2>

      {!status ? (
        <div style={{ color: '#6b7280' }}>
          กำลังโหลดข้อมูลสถานะ...
        </div>
      ) : (
        <>
          {/* สถานะอัคคีภัย */}
          <div style={{ marginBottom: 12, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
            <strong style={{ marginRight: 8 }}>Fire Alert Status:</strong>
            <span style={{ 
              fontWeight: 700, 
              color: fireStatusColor,
              backgroundColor: isFireAlert ? '#fef2f2' : '#f0fdf4',
              padding: '4px 8px',
              borderRadius: 6,
            }}>
              {isFireAlert ? "FIRE DETECTED!" : "Normal"}
            </span>
          </div>
          
          {/* ข้อมูลสภาพแวดล้อม: อุณหภูมิและความชื้น */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14 }}>
            <div>
              <strong>Temperature:</strong> {status.temperature.toFixed(1)}°C
            </div>
            <div>
              <strong>Humidity:</strong> {status.humidity.toFixed(1)}%
            </div>
          </div>
          
          {/* การควบคุม Threshold */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>
              Temp Threshold (°C):
              <input
                type="number"
                value={localThreshold}
                onChange={(e) => setLocalThreshold(Number(e.target.value))}
                min="0"
                max="50"
                style={{
                  marginLeft: 8,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  width: 80,
                  transition: "border 0.3s",
                }}
                disabled={busy}
              />
            </label>
            <button
              style={applyButtonStyle}
              onClick={handleApplyThreshold}
              disabled={busy}
            >
              Set Threshold
            </button>
          </div>

          {/* การจำลองการแจ้งเตือน */}
          <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <button
              style={{...buttonStyle, background: '#8a86e3ff', color: '#ffffffff', borderColor: '#f1a636ff'}}
              onClick={onRingBell}
              disabled={busy}
            >
              Simulate Doorbell / Alert 
            </button>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              (for testing logging purposes)
            </p>
          </div>
        </>
      )}
    </div>
  );
}