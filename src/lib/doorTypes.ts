/** @typedef {'password' | 'fingerprint' | 'rfid' | 'off'} DoorMode */
export type DoorMode = 'password' | 'fingerprint' | 'rfid' | 'off';

/** @typedef {'INFO' | 'WARN' | 'ERROR' | 'ALERT'} LogLevel */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'ALERT';

/**
 * @interface DoorStatus
 * @description สถานะปัจจุบันของประตูที่ได้รับจาก Firebase Realtime Database /state
 * **NOTE:** The structure has been updated to match the incoming data.
 */
export interface DoorStatus {
    /** true/false based on system AI state */
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
    // NOTE: Original fields like 'doorOpen', 'locked', 'mode', 'fanState', 'ventAuto', 'lastUpdated' (as string) 
    // were removed or renamed to match the provided data fields.
}

/**
 * @interface DoorLogEntry
 * @description ข้อมูล Log ที่อ่านจาก Firebase Realtime Database /logs
 */
export interface DoorLogEntry {
    id: string;             // Unique ID ของ Log entry
    timestamp: string;      // ISO timestamp
    level: LogLevel;        // ระดับความสำคัญของ Log
    message: string;        // ข้อความสรุป
    details: string;        // JSON string ของรายละเอียด Log ทั้งหมด
}