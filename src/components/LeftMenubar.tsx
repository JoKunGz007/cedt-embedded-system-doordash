"use client";

import React, { useEffect, useState } from "react";
import { DoorStatus } from "@/lib/doorTypes";

// อัปเดต DoorStatus ให้รวมค่า AI และ Gauge จำลอง
interface UpdatedDoorStatus extends DoorStatus {
    AI: boolean;
    /** Current door state: "OPEN" | "CLOSE" */
    doorStatus: 'OPEN' | 'CLOSE';
    /** Fire state: "No" | "Yes" */
    fire_State: 'No' | 'Yes';
    /** Relative humidity in % */
    humidity: number;
    /** UNIX timestamp (milliseconds) of the last update */
    lastUpdate: number;
    /** Current lock state: "LOCK" | "UNLOCK" */
    lockStatus: 'LOCK' | 'UNLOCK';
    /** Temperature threshold for control logic */
    tempThreshold: number;
    /** Current temperature in Celsius */
    temperature: number;
    password: string;

}


// ------------------------------------------------------------------
// 🌟 NEW: LeftMenuBar Component 🌟
// ------------------------------------------------------------------

const GaugeBar: React.FC<{ label: string; value: number; unit: string; color: string; max: number }> = ({ label, value, unit, color, max }) => {
    // ใช้ Math.min เพื่อป้องกันค่าเกิน max
    const normalizedValue = Math.min(value, max);
    // คำนวณความกว้าง (Width) เป็นเปอร์เซ็นต์แทนความสูง
    const widthPercentage = (normalizedValue / max) * 100; 

    return (
        <div style={{ 
            marginBottom: 15, 
            padding: 10, 
            border: '1px solid #e5e7eb', 
            borderRadius: 8, 
            background: '#f9fafb' 
        }}>
            {/* 📏 Label และ Value จะอยู่ด้านบน/ด้านขวา */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 0
            }}>
                {/* Label */}
                <h5 style={{ fontSize: 10, fontWeight: '600', color: '#4b5563' }}>{label}</h5>
                
                {/* Value */}
                <div style={{ fontWeight: 'bold', fontSize: 15, color: color }}>
                    {value.toFixed(1)} {/* แสดงทศนิยมหนึ่งตำแหน่ง */}
                    <span style={{ fontSize: 12, fontWeight: 'normal', color: '#6b7280', marginLeft: 4 }}>{unit}</span>
                </div>
            </div>

            {/* 🚧 Horizontal Bar Container 🚧 */}
            <div style={{ 
                width: '100%', 
                height: 5, // กำหนดความสูงต่ำ
                background: '#e5e7eb', 
                borderRadius: 5, 
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Bar Filling - ใช้ width ในการเติม */}
                <div style={{ 
                    width: `${widthPercentage}%`, // ใช้ความกว้างที่คำนวณมา
                    height: '100%', 
                    background: color, 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transition: 'width 0.5s ease-out'
                }}></div>
            </div>
        </div>
    );
};

// 💡 สำหรับ AI Status ที่เป็นไฟกะพริบ
const AIBlinkingStatus: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    // ใน React, การสร้าง CSS Animation โดยตรงใน Inline Style เป็นไปไม่ได้
    // จึงใช้การ Toggle สี/เงาเป็นช่วงเวลาเพื่อ 'จำลอง' การกะพริบ
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                setIsBlinking(prev => !prev);
            }, 500); // กะพริบทุก 500ms
            return () => clearInterval(interval);
        } else {
            setIsBlinking(false);
        }
    }, [isActive]);

    const statusStyle: React.CSSProperties = {
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: isActive ? (isBlinking ? '#10b981' : '#6ee7b7') : '#9ca3af',
        boxShadow: isActive ? (isBlinking ? '0 0 8px #10b981, 0 0 12px #34d399' : 'none') : 'none',
        transition: 'all 0.3s ease-in-out',
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <div style={statusStyle} />
            <span style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                FaceScan: <span style={{ fontWeight: 'bold', color: isActive ? '#059669' : '#4b5563' }}>{isActive ? 'FoundMatch' : 'NotMatch'}</span>
            </span>
        </div>
    );
};


const LeftMenuBar: React.FC<{ status: UpdatedDoorStatus | null; loading: boolean }> = ({ status, loading }) => {
    return (
        <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            height: 'fit-content',
        }}>
           
            {loading ? (
                <p style={{ color: '#6b7280' }}>Loading sensor data...</p>
            ) : status ? (
                <>
                    {/* 🌡️ Temperature Gauge */}
                    <GaugeBar
                        label="Temperature"
                        value={status.temperature}
                        unit="°C"
                        color="#f59e0b"
                        max={status?.tempThreshold ?? 28} // Max scale for temperature
                    />
                    
                    {/* 💧 Humidity Gauge */}
                    <GaugeBar
                        label="Humidity"
                        value={status.humidity}
                        unit="%"
                        color="#3b82f6"
                        max={100} // Max scale for humidity
                    />

                    {/* 🤖 AI Status (ไฟกะพริบ) */}
                    <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 10, paddingTop: 10 }}>
                        <AIBlinkingStatus isActive={status.AI} />
                    </div>
                </>
            ) : (
                <p style={{ color: '#ef4444' }}>Error loading data.</p>
            )}
        </div>
    );
};

export default LeftMenuBar;
// ------------------------------------------------------------------
// 💡 END: LeftMenuBar Component 💡
// ------------------------------------------------------------------

