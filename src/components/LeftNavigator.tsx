"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface TemperatureData {
    timestamp: number; // UNIX timestamp
    temp: number; // Temperature value
}
interface HumidityData {
    timestamp: number;
    humidity: number; // Humidity percentage value
}


const LEFT_MENU_WIDTH = 300; // ความกว้างเมื่อขยาย
const COLLAPSED_WIDTH = 60; // ความกว้างเมื่อย่อ (แสดงเฉพาะไอคอน)
const MENU_TRANSITION = 'width 0.3s ease-in-out';

/**
 * 🌡️ Hook: useRealtimeTemperature
 * 🚨 แก้ไข: ลบ Math.random() ออก โดยใช้ initialTemp คงที่
 */
// ✅ Replace your two hooks with these (keep the rest of the file the same)

const useRealtimeTemperature = (currentTemp: number) => {
  const [history, setHistory] = useState<TemperatureData[]>(() => [
    { timestamp: Date.now(), temp: Number(currentTemp.toFixed(1)) },
  ]);

  useEffect(() => {
    const now = Date.now();
    const newEntry: TemperatureData = { timestamp: now, temp: Number(currentTemp.toFixed(1)) };

    setHistory((prev) => {
      const maxPoints = 100;

      // (optional) avoid adding duplicates too fast
      const last = prev[prev.length - 1];
      if (last && last.temp === newEntry.temp && now - last.timestamp < 800) return prev;

      const next = [...prev, newEntry];
      return next.length > maxPoints ? next.slice(-maxPoints) : next;
    });
  }, [currentTemp]);

  return history;
};

const useRealtimeHumidity = (currentHumidity: number) => {
  const [history, setHistory] = useState<HumidityData[]>(() => [
    { timestamp: Date.now(), humidity: Number(currentHumidity.toFixed(1)) },
  ]);

  useEffect(() => {
    const now = Date.now();
    const clamped = Math.min(100, Math.max(0, currentHumidity));
    const newEntry: HumidityData = { timestamp: now, humidity: Number(clamped.toFixed(1)) };

    setHistory((prev) => {
      const maxPoints = 100;

      const last = prev[prev.length - 1];
      if (last && last.humidity === newEntry.humidity && now - last.timestamp < 800) return prev;

      const next = [...prev, newEntry];
      return next.length > maxPoints ? next.slice(-maxPoints) : next;
    });
  }, [currentHumidity]);

  return history;
};

// 💡 Component จำลองกราฟ (เนื่องจากใช้ไลบรารีจริงไม่ได้)
const RealtimeTemperatureChart: React.FC<{ data: TemperatureData[] }> = ({ data }) => {
    
    // 1. เตรียมข้อมูล: แปลง timestamp เป็นเวลาที่อ่านได้
    const formattedData = data.map(d => ({
        // ใช้ ToLocaleTimeString เพื่อให้แสดงเวลา 'HH:mm:ss'
        time: new Date(d.timestamp).toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }),
        Temperature: d.temp, // ใช้เป็น Data Key สำหรับ Line
    }));

    const latestTemp = data[data.length - 1]?.temp || 0;
    
    // กำหนดขอบเขตของ Y-Axis แบบ Dynamic 
    // ในกรณีที่ไม่มี random ขอบเขตจะคงที่ตามค่าที่ส่งเข้ามา
    const minY = Math.floor(Math.min(...data.map(d => d.temp)) - 1);
    const maxY = Math.ceil(Math.max(...data.map(d => d.temp)) + 1);

    return (
        <div style={{ 
            padding: 15, 
            border: '1px solid #4b5563', // เปลี่ยนสีขอบให้เข้ากับเมนู
            borderRadius: 8, 
            background: '#ffffff', // พื้นหลังกราฟสีขาว
        }}>
            <h4 style={{ fontSize: 16, fontWeight: '700', marginBottom: 5, color: '#374151' }}>
                 Temp History ({data.length} pts)
            </h4>
            
            {/* ค่าอุณหภูมิล่าสุด */}
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 }}>
                {latestTemp.toFixed(1)}°C
            </p>

            {/* 📈 พื้นที่กราฟ 📉 */}
            <ResponsiveContainer width="100%" height={180}>
                <LineChart 
                    data={formattedData}
                    // ลด Margin ให้น้อยลงเพื่อใช้พื้นที่ในเมนู Navigator ได้เต็มที่
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }} 
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    
                    {/* XAxis: แสดงเวลาที่อัปเดต (ตั้งให้ซ่อน Label เมื่อมีจุดเยอะ) */}
                    <XAxis 
                        dataKey="time" 
                        stroke="#6b7280"
                        interval="preserveStartEnd"
                        minTickGap={10} 
                        style={{ fontSize: 10 }}
                    /> 
                    
                    {/* YAxis: แสดงค่าอุณหภูมิ */}
                    <YAxis 
                        dataKey="Temperature"
                        stroke="#6b7280"
                        domain={[minY, maxY]} // กำหนดขอบเขต Y-Axis
                        style={{ fontSize: 10 }}
                    /> 
                    
                    <Tooltip 
                        contentStyle={{ background: '#374151', border: '1px solid #9ca3af', color: '#fff' }}
                    />
                    
                    {/* Line: กราฟเส้นอุณหภูมิ */}
                    <Line 
                        type="monotone" 
                        dataKey="Temperature" 
                        stroke="#ef4444" // สีแดงสำหรับอุณหภูมิ
                        strokeWidth={2}
                        dot={false} // ไม่แสดงจุดบนกราฟ (เพื่อความสะอาด)
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
const RealtimeHumidityChart: React.FC<{ data: HumidityData[] }> = ({ data }) => {
    
    const formattedData = data.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        Humidity: d.humidity,
    }));

    const latestHumidity = data[data.length - 1]?.humidity || 0;
    
    return (
        <div style={{ padding: 15, border: '1px solid #4b5563', borderRadius: 8, background: '#ffffff', }}>
            <h4 style={{ fontSize: 16, fontWeight: '700', marginBottom: 5, color: '#374151' }}>
                 Humidity History ({data.length} pts)
            </h4>
            
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 10 }}>
                {latestHumidity.toFixed(1)}%
            </p>

            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" interval="preserveStartEnd" minTickGap={10} style={{ fontSize: 10 }}/> 
                    <YAxis dataKey="Humidity" stroke="#6b7280" domain={[0, 100]} style={{ fontSize: 10 }}/> 
                    <Tooltip contentStyle={{ background: '#374151', border: '1px solid #9ca3af', color: '#fff' }}/>
                    <Line type="monotone" dataKey="Humidity" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};


export const LeftNavigator: React.FC<{ currentTemperature: number; currentHumidity: number; }> = ({ currentTemperature, currentHumidity }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // ใช้งาน Hook จำลอง Real-time
    const tempHistory = useRealtimeTemperature(currentTemperature);
    const humidityHistory = useRealtimeHumidity(currentHumidity);

    const handleMouseEnter = () => setIsExpanded(true);
    const handleMouseLeave = () => setIsExpanded(false);

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: isExpanded ? LEFT_MENU_WIDTH : COLLAPSED_WIDTH,
        background: '#6741e6ff', // Dark background for navigator
        color: '#f9fafb',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        padding: 15,
        zIndex: 1000,
        transition: MENU_TRANSITION,
        overflowX: 'hidden',
    };
    
    const contentStyle: React.CSSProperties = {
        opacity: isExpanded ? 1 : 0,
        transition: 'opacity 0.2s ease-in 0.1s', // หน่วงเวลาให้แสดงเมื่อขยายเสร็จ
        whiteSpace: 'nowrap',
        marginTop: 50,
        paddingLeft: 5,
    };
    
    // Icon Style
    const iconStyle: React.CSSProperties = {
        fontSize: 24,
        position: 'absolute',
        top: 15,
        left: 18,
    };

    return (
        <div 
            style={menuStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* ⬅️ Icon (Visible Even When Collapsed) ⬅️ */}
            <div style={iconStyle}>
                <span role="img" aria-label="menu">☰</span>
            </div>
            
            {/* 🖥️ Menu Content (Only Visible When Expanded) 🖥️ */}
            <div style={contentStyle}>
                <h3 style={{ fontSize: 20, fontWeight: '800', marginBottom: 20, color: '#f9fafb' }}>
                    System Analytics
                </h3>
                
                <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 20 }}>
                    Real-time Sensor Data
                </p>

                {/* 🌡️ Real-time Temperature Graph Simulation */}
               <RealtimeTemperatureChart data={tempHistory} />
                <RealtimeHumidityChart data={humidityHistory} />

                {/* ------------------------------------------------------ */}
                {/* ... Navigation Links (เหมือนเดิม) ... */}

                {/* ------------------------------------------------------ */}
                <div style={{ marginTop: 30, borderTop: '1px solid #4b5563', paddingTop: 20 }}>
                    <p style={{ fontSize: 14, marginBottom: 10, color: '#f9fafb' }}>
                        Netpie
                    </p>    
                    <p style={{ fontSize: 14, marginBottom: 10, color: '#f9fafb' }}>
                        Group
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LeftNavigator;