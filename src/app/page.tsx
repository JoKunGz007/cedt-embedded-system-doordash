"use client";

import React, { useEffect, useState } from "react";

import { DoorStatus, DoorLogEntry, DoorMode } from "@/lib/doorTypes";

import DoorStatusCard from "@/components/DoorStatusCard";
import FireControls from "@/components/FireControls";
import LogsPanel from "@/components/LogsPanel";
import LeftMenuBar from "@/components/LeftMenubar";
import LeftNavigator from "@/components/LeftNavigator";
// จำลอง Component สำหรับ User Profile
const UserProfile = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d1e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: 'bold' }}>
            Mk
        </div>
        <span style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
             mokunato@gmail.com
        </span>
    </div>
);

// *** Import Service functions ที่จำเป็นเท่านั้น ***
import {
    subscribeToDoorStatus,
    subscribeToLogs,
    setPassword,
    refreshStatusFromHardware,
    ringBell,
    setTempThreshold,
} from "@/lib/doorService";

// 💡 ปรับปรุง Font และ Background
const appStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: 32, // เพิ่ม padding
    fontFamily:
        "Inter, 'Segoe UI', sans-serif", // เปลี่ยน Font
    background: "linear-gradient(to bottom right, #f8fafc, #eef2ff)", // พื้นหลัง gradient อ่อนๆ
};


const layoutStyle: React.CSSProperties = {
    maxWidth: 1100, // ขยายความกว้าง
    margin: "0 auto",
};

// 💡 Grid Style ที่ถูกต้อง: 2 ส่วนสำหรับ Controls, 1 ส่วนสำหรับ Logs
const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr", 
    gap: 24, // เพิ่มช่องว่าง
};

// ⭐️ สไตล์สำหรับกล่องควบคุม/ฟอร์มที่ฝังใน Page (Modern/Shadow) ⭐️
const controlBoxStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 12, // ขอบโค้งมนขึ้น
    padding: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // เงาที่ชัดเจนขึ้น
    marginBottom: 24,
    transition: 'transform 0.2s, box-shadow 0.2s',
};

const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    marginBottom: 10,
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 14,
    transition: 'border-color 0.2s',
};

// 💡 Interactive Button Style
const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.2s, transform 0.1s',
    minWidth: 120,
    fontSize: 14,
};

// 💡 สไตล์สำหรับปุ่ม Logout
const logoutButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: '#fff',
    minWidth: 100,
    padding: '8px 16px',
    fontSize: 14,
};


export default function Page() {
    const [status, setStatus] = useState<DoorStatus | null>(null);
    const [logs, setLogs] = useState<DoorLogEntry[]>([]);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ⭐️ State สำหรับฟอร์มเปลี่ยนรหัสผ่าน ⭐️
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [pwMessage, setPwMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });


    useEffect(() => {
        let unsubscribeStatus: (() => void) | undefined;
        let unsubscribeLogs: (() => void) | undefined;

        unsubscribeStatus = subscribeToDoorStatus((newStatus, err) => {
            if (err) {
                console.error("Page Component: Error subscribing to Door Status:", err.message);
                setError(err.message);
                setStatus(null);
            } else {
                setStatus(newStatus);
                setLoadingStatus(false);
                setError(null);
            }
        });

        unsubscribeLogs = subscribeToLogs((newLogs, err) => {
            if (err) {
                console.error("Page Component: Error subscribing to Logs:", err.message);
                setLogs([]);
            } else {
                setLogs(newLogs);
                setLoadingLogs(false);
                setError(null);
            }
        });

        return () => {
            if (unsubscribeStatus) {
                unsubscribeStatus();
            }
            if (unsubscribeLogs) {
                unsubscribeLogs();
            }
        };
    }, []);

    // ⭐️ Helper function สำหรับจัดการ Command ทั่วไป ⭐️
    const wrapAsyncCommand = async (commandFunc: () => Promise<void>, commandName: string) => {
        setBusy(true);
        setError(null);
        try {
            await commandFunc();
        } catch (e: any) {
            console.error(`Page Component: Error in ${commandName}:`, e);
            setError(e?.message ?? `Failed to run ${commandName}`);
            throw e;
        } finally {
            setBusy(false);
        }
    };

    


    const handleRefresh = () => wrapAsyncCommand(refreshStatusFromHardware, "refreshStatusFromHardware");
    const handleLogout = () => {
        // 💡 Logic การ Logout (จำลอง)
        alert('ออกจากระบบสำเร็จ!');
        // ในระบบจริง: router.push('/login');
    };
    

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMessage({ text: '', type: '' });
        
        if (newPassword.length < 4) {
            setPwMessage({ text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร', type: 'error' });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPwMessage({ text: 'Not match!', type: 'error' });
            return;
        }

        setBusy(true);
        setError(null);
        try {
            await setPassword(oldPassword, newPassword); 
            
            // Success
            setPwMessage({ text: 'Done successfully', type: 'success' });
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setError(null);

        } catch (error: any) {
            const errorMsg = error?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ";
            setPwMessage({ text: errorMsg, type: 'error' });
            console.error("Failed to change password:", error);
            
        } finally {
            setBusy(false);
        }
    };


    const handleSetThreshold = (temp: number) => wrapAsyncCommand(() => setTempThreshold(temp), "setTempThreshold");
    const handleRingBell = () => wrapAsyncCommand(ringBell, "ringBell");


    return (
        <div style={appStyle}>
          {status && <LeftNavigator currentTemperature={status.temperature} currentHumidity={status.humidity}/>}
         
            <div style={layoutStyle}>
              
                
                {/* 🚀 Top Menu / Header (รวม Profile & Logout) 🚀 */}
                <header style={{ 
                    marginBottom: 32, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: 16,
                    borderBottom: '1px solid #e5e7eb'
                }}>
                  
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      
                        <h1
                            style={{
                                fontSize: 28,
                                fontWeight: 800,
                                color: '#1f2937',
                                letterSpacing: '-0.02em',
                                marginRight: 10,
                            }}
                        >
                            <span style={{color: '#4f46e5'}}>DoorDash</span> – Smart Door
                        </h1>
                        <p style={{ color: "#6b7280", fontSize: 14, paddingTop: 5 }}>
                            Connected to Firebase
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <UserProfile />
                        <button 
                            onClick={handleLogout}
                            style={logoutButtonStyle}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                        >
                            <span role="img" aria-label="logout"></span> Logout
                        </button>
                    </div>
                </header>
                {/* --- */}

                {error && (
                    <div
                        style={{
                            marginBottom: 24,
                            padding: 16,
                            borderRadius: 8,
                            background: "#fecaca", // สีแดงอ่อน
                            color: "#991b1b",
                            fontSize: 14,
                            fontWeight: '500',
                            borderLeft: '4px solid #ef4444'
                        }}
                    >
                        **ERROR:** {error}
                    </div>
                )}
                 
                <div style={{ marginBottom: 32 }}> 
                <LeftMenuBar status={status} loading={loadingStatus} />
            </div>


                <div style={gridStyle}>
                  
                    {/* ⬅️ คอลัมน์ซ้าย: สถานะและการควบคุม (2fr) ⬅️ */}
                    <div> 
                      
                        <DoorStatusCard 
                            status={{...status, passwordStatus: status?.password ?? "UNKNOWN"}} 
                            loading={loadingStatus} 
                        />

                        {/* 🔑 ส่วนควบคุม/เปลี่ยนรหัสผ่าน (ใช้ controlBoxStyle ใหม่) 🔑 */}
                        <div style={controlBoxStyle}>
                            <h4 style={{ fontSize: 18, marginBottom: 16, fontWeight: '700', color: '#1f2937' }}>Configuration</h4>
                            
                            {/* ปุ่มรีเฟรช */}
                            <button 
                                onClick={handleRefresh} 
                                disabled={busy} 
                                style={{ 
                                    ...buttonStyle, 
                                    backgroundColor: busy ? '#141619ff' : '#706ad4ff', 
                                    color: '#fcfdfeff', 
                                    marginBottom: 24 
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = busy ? '#d1d5db' : '#fbbf24'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = busy ? '#d1d5db' : '#706ad4ff'}
                            >
                                <span role="img" aria-label="refresh"></span> {busy ? 'refreshing...' : 'refresh'}
                            </button>
                            
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
                                <h5 style={{ marginBottom: 15, fontSize: 16, fontWeight: '600' }}>Change Password</h5>
                                
                                {pwMessage.text && (
                                    <div style={{ 
                                        marginBottom: 15, 
                                        padding: 12, 
                                        borderRadius: 6, 
                                        backgroundColor: pwMessage.type === 'success' ? '#d1fae5' : '#fee2e2', 
                                        color: pwMessage.type === 'success' ? '#065f46' : '#991b1b',
                                        fontSize: 14
                                    }}>
                                        {pwMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChangeSubmit}>
                                    <input 
                                        type="password" 
                                        placeholder="current password" 
                                        value={oldPassword} 
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        required
                                        style={inputStyle}
                                        disabled={busy}
                                        
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="new password 4 digits" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={4}
                                        style={inputStyle}
                                        disabled={busy}
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="confirm new password" 
                                        value={confirmNewPassword} 
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        required
                                        minLength={4}
                                        style={inputStyle}
                                        disabled={busy}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={busy}
                                        style={{ 
                                            ...buttonStyle, 
                                            backgroundColor: busy ? '#9ca3af' : '#706ad4ff', 
                                            color: '#fff', 
                                            width: '100%',
                                            marginTop: 10
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = busy ? '#9ca3af' : '#12102dff'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = busy ? '#9ca3af' : '#706ad4ff'}
                                    >
                                        <span role="img" aria-label="save"></span> {busy ? 'initializing...' : 'save'}
                                    </button>
                                </form>
                            </div>
                        </div>
                         {/* <div >
                           <LeftMenuBar status={status} loading={loadingStatus} />
                         </div> */}
                       <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}> <FireControls
                            status={status}
                            busy={busy}
                            onSetThreshold={handleSetThreshold}
                            onRingBell={handleRingBell} 
                        /> </div>
                        {/* ⭐️ ส่วนควบคุมอื่นๆ (FireControls - ควรมีการปรับสไตล์ภายใน component เอง) ⭐️ */}
                        
                        
                    </div>
                    
                    {/* ➡️ คอลัมน์ขวา: บันทึก (1fr) ➡️ */}
                    <div>
                        <LogsPanel logs={logs} loading={loadingLogs} />
                    </div>
                </div>
            </div>
        </div>
    );
}