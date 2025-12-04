// lib/doorService.ts
import { db, auth } from "./firebase" ;  // นำเข้า db และ auth จากไฟล์ config
import {
  ref,
  get,
  set,
  onValue,
  push,
  query,
  orderByChild,
  limitToLast,
  off, // สำหรับยกเลิก listener
} from "firebase/database";
import { signInAnonymously } from "firebase/auth"; // สำหรับ Anonymous Authentication

import { DoorStatus, DoorLogEntry, DoorMode, LogLevel } from "./doorTypes";

// กำหนด ID ของประตูสำหรับ Firebase
const SMART_DOOR_ID = "mainDoor";

// --- Firebase Authentication (เบื้องต้น: Anonymous Sign-in) ---
async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Firebase: Signed in anonymously.");
    } catch (error) {
      console.error("Firebase: Error signing in anonymously:", error);
      throw new Error("Authentication failed. Cannot connect to Firebase.");
    }
  }
}
// ---------------------------------------------------------------

// Helper function to get the current door data path reference
const getDoorRef = (path: string) => ref(db, `doors/${SMART_DOOR_ID}/${path}`);


// ⭐️⭐️ Command Payload Generator ⭐️⭐️
/**
 * @function getCommandPayload
 * @description สร้าง Payload มาตรฐานสำหรับ Command ทุกตัว เพื่อระบุแหล่งที่มาและผู้สั่ง
 * @param additionalFields - Field เฉพาะสำหรับคำสั่งนั้นๆ
 * @returns Object ที่เป็น Command Payload ที่มี timestamp, userId, และ source
 */
function getCommandPayload(additionalFields: object = {}): object {
    // ดึง User ID ปัจจุบัน
    const userId = auth.currentUser?.uid || "anonymous-guest"; 
    return {
        timestamp: Date.now(),
        userId: userId,
        source: "FrontendWeb", // ระบุแหล่งที่มาของคำสั่ง (Client Web UI)
        ...additionalFields,
    };
}
// ⭐️⭐️ END Command Payload Generator ⭐️⭐️


// --- Realtime Listeners ---

// แปลงข้อมูลจาก Firebase snapshot ให้อยู่ในรูปแบบ DoorStatus ของ Frontend
function mapFirebaseStatusToDoorStatus(data: any): DoorStatus {
  // ค่าเริ่มต้นสำหรับ property ที่อาจจะยังไม่มีใน Firebase
  const defaultStatus: DoorStatus = {
    doorOpen: false,
    locked: true,
    mode: "password",
    temperature: 0,
    fanState: false, 
    ventAuto: true,
    tempThreshold: 28,
    lastUpdated: new Date().toISOString(),
  };

  if (!data) return defaultStatus;

  const mappedStatus: DoorStatus = {
    doorOpen: data.doorStatus === "OPEN", 
    locked: data.lockStatus === "LOCKED", 
    mode: data.mode || defaultStatus.mode, 
    temperature: data.temperature || defaultStatus.temperature,
    fanState: data.fanState === "ON", // 'ON'/'OFF' -> true/false
    ventAuto: typeof data.fanAutoMode === 'boolean' ? data.fanAutoMode : defaultStatus.ventAuto, 
    tempThreshold: data.tempThreshold || defaultStatus.tempThreshold,
    lastUpdated: data.lastUpdate ? new Date(parseInt(data.lastUpdate)).toISOString() : defaultStatus.lastUpdated,
  };

  return mappedStatus;
}
// Subscribe เพื่อรับสถานะประตูแบบเรียลไทม์
export function subscribeToDoorStatus(
  callback: (status: DoorStatus | null, error: Error | null) => void
): () => void {
  let unsubscribe = () => {}; 
    
  ensureAuthenticated().then(() => {
    const statusRef = getDoorRef("state");
    const listener = onValue(
      statusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const doorStatus = mapFirebaseStatusToDoorStatus(data);
          callback(doorStatus, null);
        } else {
          console.error("Firebase: Door status data not found in Firebase at Path:", getDoorRef("state").toString());
          callback(null, new Error("Door status data not found in Firebase."));
        }
      },
      (error) => {
        console.error("Firebase: Door Status subscription error:", error);
        callback(null, error);
      }
    );
    unsubscribe = () => off(statusRef, "value", listener);
  }).catch(error => {
    console.error("Firebase: Failed to subscribe to door status due to auth error:", error);
    callback(null, error);
  });
  return unsubscribe; 
}


// แปลงข้อมูล Log จาก Firebase snapshot ให้อยู่ในรูปแบบ DoorLogEntry ของ Frontend
function mapFirebaseLogToDoorLogEntry(logData: any, key: string): DoorLogEntry {
  let level: LogLevel = "INFO"; // Default level
  if (logData.type === "PASSWORD_UNLOCK_ATTEMPT" && logData.status === "FAILED") {
    level = "WARN";
  } else if (logData.type === "ERROR") { 
    level = "ERROR";
  }

  return {
    id: key, 
    timestamp: logData.timestamp ? new Date(parseInt(logData.timestamp)).toISOString() : new Date().toISOString(),
    level: level,
    message: logData.message || logData.type || "Unknown event",
    details: JSON.stringify({ 
      type: logData.type,
      status: logData.status,
      method: logData.method,
      enteredPassword: logData.enteredPassword, 
    }, null, 2),
  };
}

// Subscribe เพื่อรับ Logs แบบเรียลไทม์
export function subscribeToLogs(
  callback: (logs: DoorLogEntry[], error: Error | null) => void
): () => void {
  let unsubscribe = () => {};
  ensureAuthenticated().then(() => {
    // ดึง 50 รายการล่าสุด, เรียงตาม timestamp
    const logsQuery = query(getDoorRef("logs"), orderByChild("timestamp"), limitToLast(50));
    const listener = onValue(
      logsQuery,
      (snapshot) => {
        const fetchedLogs: DoorLogEntry[] = [];
        // ตรวจสอบว่า logs เป็น array/object ไม่ใช่ string
        if (typeof snapshot.val() === 'string') {
          console.warn("Firebase: Logs node contains a string value instead of a collection. Ignoring string value.");
          callback([], new Error("Logs node is incorrectly formatted as a string."));
          return;
        }
        
        snapshot.forEach((childSnapshot) => {
          fetchedLogs.push(mapFirebaseLogToDoorLogEntry(childSnapshot.val(), childSnapshot.key || "unknown"));
        });
        // เรียงจากใหม่ไปเก่าตาม timestamp
        fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(fetchedLogs, null);
      },
      (error) => {
        console.error("Firebase: Logs subscription error:", error);
        callback([], error);
      }
    );
    unsubscribe = () => off(logsQuery, "value", listener); 
  }).catch(error => {
    console.error("Firebase: Failed to subscribe to logs due to auth error:", error);
    callback([], error);
  });
  return unsubscribe;
}


// -------- Command Functions (เขียนข้อมูลไปยัง Firebase) --------
// ⭐️ ทุกฟังก์ชันใช้ getCommandPayload() แล้ว ⭐️

export async function lockDoor(): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/lockCommand");
  await set(path, getCommandPayload({ trigger: true }));
}

export async function unlockDoor(): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/unlockCommand");
  await set(path, getCommandPayload({ trigger: true }));
}

export async function unlockDoorWithPassword(password: string): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/passwordUnlock");
  await set(path, getCommandPayload({ password: password }));
}

export async function setMode(mode: DoorMode): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/doorMode");
  await set(path, getCommandPayload({ value: mode }));
}

export async function refreshStatusFromHardware(): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/refreshStatus");
  await set(path, getCommandPayload({ trigger: true }));
}

export async function setVentAuto(auto: boolean): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/fanAutoMode");
  await set(path, getCommandPayload({ enabled: auto }));
}

export async function setVentOn(on: boolean): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/fanManualOverride");
  await set(path, getCommandPayload({ value: on }));
}

export async function setTempThreshold(temp: number): Promise<void> {
  await ensureAuthenticated();
  
  // 1. ส่งคำสั่งไปที่ commands/tempThreshold 
  const commandRef = getDoorRef("commands/tempThreshold");
  const commandPromise = set(commandRef, getCommandPayload({ value: temp }));

  // 2. อัปเดตค่าใน state/tempThreshold โดยตรง
  const stateRef = getDoorRef("state/tempThreshold");
  const statePromise = set(stateRef, temp);

  // 3. บันทึก Log การตั้งค่า ⭐️ NEW LOG ACTION ⭐️
  const logEntry = getCommandPayload({
    type: "TEMP_THRESHOLD_SET", 
    message: `Temperature threshold set to ${temp}°C.`,
    value: temp
  });
  const logPromise = push(getDoorRef("logs"), logEntry);

  await Promise.all([commandPromise, statePromise, logPromise]);
}

/**
 * @function ringBell
 * @description บันทึก Log การกดกริ่งจำลอง
 */
export async function ringBell(): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("logs"); 
  // ใช้ getCommandPayload สำหรับ Log Entry เพื่อให้มี userId และ source
  const logEntry = getCommandPayload({
    type: "DOORBELL_PRESSED_SIMULATED", 
    message: "Doorbell pressed from Frontend UI (simulated).",
  });
  await push(path, logEntry);
}

/**
 * @function updatePassword
 * @description ส่งคำสั่งอัปเดตรหัสผ่านและบันทึก Log การพยายามอัปเดต ก่อน Throw Error
 */
export async function updatePassword(current: string, next: string): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/updatePassword");

  // 1. ส่งคำสั่งไปยัง Firebase (ไม่ควรรันใน Production UI)
  const commandPromise = set(path, getCommandPayload({ currentPassword: current, newPassword: next }));

  // 2. บันทึก Log การกระทำ ⭐️ NEW LOG ACTION ⭐️
  const logEntry = getCommandPayload({
    type: "PASSWORD_UPDATE_ATTEMPT", 
    message: "Attempted to update security password. (Details not logged for security)",
  });
  const logPromise = push(getDoorRef("logs"), logEntry);

  await Promise.all([commandPromise, logPromise]);

  throw new Error("Password update through frontend is not recommended. Implement securely via backend.");
}

// --- One-time Fetch Functions (ไม่ควรใช้ใน Production UI) ---

export async function fetchDoorStatusOneTime(): Promise<DoorStatus> {
  await ensureAuthenticated();
  const snapshot = await get(getDoorRef("state"));
  if (snapshot.exists()) {
    const data = snapshot.val();
    return mapFirebaseStatusToDoorStatus(data);
  }
  throw new Error("Door status not found in Firebase.");
}


export async function fetchLogsOneTime(): Promise<DoorLogEntry[]> {
  await ensureAuthenticated();
  const logsQuery = query(getDoorRef("logs"), orderByChild("timestamp"), limitToLast(50));
  const snapshot = await get(logsQuery);
  const fetchedLogs: DoorLogEntry[] = [];
  snapshot.forEach((childSnapshot) => {
    fetchedLogs.push(mapFirebaseLogToDoorLogEntry(childSnapshot.val(), childSnapshot.key || "unknown"));
  });
  fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return fetchedLogs;
}