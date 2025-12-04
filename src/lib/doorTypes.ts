// lib/doorTypes.ts
/** @typedef {'password' | 'fingerprint' | 'rfid' | 'off'} DoorMode */
export type DoorMode = 'password' | 'fingerprint' | 'rfid' | 'off';

/** @typedef {'INFO' | 'WARN' | 'ERROR'} LogLevel */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/**
 * @interface DoorStatus
 * @description สถานะปัจจุบันของประตูที่ได้รับจาก Firebase Realtime Database /state
 */
export interface DoorStatus {
    doorOpen: boolean;
    locked: boolean;
    mode: DoorMode;
    temperature: number;
    fanState: boolean;       // สถานะพัดลม (Manual ON/OFF)
    ventAuto: boolean;       // โหมด Auto/Manual สำหรับพัดลม
    tempThreshold: number;   // เกณฑ์อุณหภูมิสำหรับโหมด Auto (ค่าที่เรากำลังแก้ไข)
    lastUpdated: string;     // ISO timestamp ของการอัปเดตล่าสุด
}

/**
 * @interface DoorLogEntry
 * @description ข้อมูล Log ที่อ่านจาก Firebase Realtime Database /logs
 */
export interface DoorLogEntry {
    id: string;              // Unique ID ของ Log entry
    timestamp: string;       // ISO timestamp
    level: LogLevel;         // ระดับความสำคัญของ Log
    message: string;         // ข้อความสรุป
    details: string;         // JSON string ของรายละเอียด Log ทั้งหมด
}