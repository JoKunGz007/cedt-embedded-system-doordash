import React, { useState, useEffect } from "react";
// Assuming DoorStatus contains: doorOpen, locked, mode, temperature, humidity, fire_State, ventAuto, ventOn, lastUpdated
// Note: 'ventOn' status is inferred for comprehensive display along with 'ventAuto'.

type Props = {
  status: any | null; // ใช้ any เพื่อความยืดหยุ่นตามบริบทของโค้ด
  loading: boolean;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#ffffff",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
};



export default function DoorStatusCard({ status, loading }: Props) {
   const [currentTime, setCurrentTime] = useState(new Date());
   const [isClient, setIsClient] = useState(false);
   const formatTime = (date: Date): string => {
    // ใช้ locale string เพื่อจัดรูปแบบเวลา (เช่น "7:16:59 PM")
    return date.toLocaleTimeString('en-US'); 
    // หรืออาจใช้ฟังก์ชันที่ซับซ้อนกว่านี้
};

 useEffect(() => {
    // โค้ดนี้รันเฉพาะใน Client เท่านั้น
    setIsClient(true);
  }, []);
  if (loading && !status) {
    return <div style={cardStyle}>Loading door status...</div>;
  }

  if (!status) {
    return <div style={cardStyle}>No status available.</div>;
  }

  const isFireAlert = status.fire_State === 'Yes';
  const fireStatusColor = isFireAlert ? '#dc2626' : '#16a34a';

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        Door & Environmental Status
      </h2>
      <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
        
        {/* สถานะอัคคีภัย (เน้นพิเศษ) */}
        <div style={{ 
          marginBottom: 4, 
          padding: '8px 12px',
          borderRadius: 8,
          backgroundColor: isFireAlert ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${isFireAlert ? '#fca5a5' : '#a7f3d0'}`
        }}>
          <strong>Overall Status:</strong>
          <span style={{ 
            fontWeight: 700, 
            color: fireStatusColor,
            marginLeft: 8
          }}>
            {isFireAlert ? "Warning" : "OK"}
          </span>
        </div>
        

        {/* สถานะประตูและการล็อค */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>Door:</strong> 
              <span style={{ marginLeft: 4, fontWeight: 600, color: status.doorOpen ? '#f97316' : '#10b981' }}>
                {status.doorOpen ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <div>
              <strong>Lock:</strong> 
              <span style={{ marginLeft: 4, fontWeight: 600, color: status.lockStatus ? '#dc2626' : '#10b981' }}>
                {status.lockStatus ? "LOCKED" : "UNLOCKED"}
              </span>
            </div>
        </div>


        

        
        {/* เวลาอัปเดตล่าสุด */}
       <div>
        {/* แสดงเวลาเฉพาะเมื่ออยู่ฝั่ง Client แล้ว */}
        {isClient ? formatTime(new Date()) : null}
        
    </div>
      </div>
    </div>
  );
}