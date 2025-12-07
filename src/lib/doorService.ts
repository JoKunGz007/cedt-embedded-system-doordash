import { db, auth } from "./firebase" ; // นำเข้า db และ auth จากไฟล์ config
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

import { DoorStatus, DoorLogEntry, DoorMode, LogLevel } from "./doorTypes"; // สมมติว่า doorTypes ถูกอัปเดตแล้ว

// กำหนด ID ของประตูสำหรับ Firebase
const SMART_DOOR_ID = "mainDoor";

// --- Firebase Authentication (เบื้องต้น: Anonymous Sign-in) ---
async function ensureAuthenticated(): Promise<void> {
  // ตรวจสอบว่ามีการ Authenticate แล้วหรือไม่
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
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

/**
 * @function mapFirebaseStatusToDoorStatus
 * @description แปลงข้อมูลจาก Firebase snapshot ให้อยู่ในรูปแบบ DoorStatus 
*/
function mapFirebaseStatusToDoorStatus(data: any): DoorStatus {
  // ค่าเริ่มต้นสำหรับฟิลด์ใหม่ (อิงตามโครงสร้างล่าสุด)
  const defaultStatus: DoorStatus = {
    AI: false, // สถานะ AI
    doorStatus: 'CLOSE', // สถานะประตู ('OPEN' | 'CLOSE')
    fire_State: 'No', // สถานะไฟไหม้ ('No' | 'Yes')
    humidity: 0, // ความชื้น
    lastUpdate: Date.now(), // UNIX timestamp (milliseconds)
    lockStatus: 'LOCK', // สถานะล็อค ('LOCK' | 'UNLOCK')
    tempThreshold: 28, // เกณฑ์อุณหภูมิ
    temperature: 25, // อุณหภูมิ
    password: '', // รหัสผ่าน (อยู่ใน state node)

  };

  if (!data) return defaultStatus;

  // การ Mapping ข้อมูล (ใช้ชื่อฟิลด์จาก Firebase ตรงๆ)
  const mappedStatus: DoorStatus = {
    AI: typeof data.AI === 'boolean' ? data.AI : defaultStatus.AI,
    doorStatus: data.doorStatus || defaultStatus.doorStatus, 
    fire_State: data.fire_State || defaultStatus.fire_State, 
    humidity: data.humidity || defaultStatus.humidity,
    lastUpdate: data.lastUpdate || defaultStatus.lastUpdate,
    lockStatus: data.lockStatus || defaultStatus.lockStatus, 
    tempThreshold: data.tempThreshold || defaultStatus.tempThreshold,
    temperature: data.temperature || defaultStatus.temperature,
    password: data.password || defaultStatus.password, // ⭐️ Mapping password จาก state node

  };

  return mappedStatus;
}
// ... (subscribeToDoorStatus และ subscribeToLogs ไม่มีอะไรเปลี่ยนแปลง) ...
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

// ... (mapFirebaseLogToDoorLogEntry เหมือนเดิม) ...
function mapFirebaseLogToDoorLogEntry(logData: any, key: string): DoorLogEntry {
  let level: LogLevel = "INFO"; // Default level
  if (logData.type?.includes("FAIL")) {
    level = "WARN";
  } else if (logData.type === "ERROR" || logData.status === "FAILED") {
    level = "ERROR";
  } else if (logData.type?.includes("FIRE") || logData.message?.includes("FIRE")) {
    level = "ALERT";
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
      value: logData.value,
      // ซ่อนข้อมูลที่ละเอียดอ่อน
      enteredPassword: logData.enteredPassword ? '***REDACTED***' : undefined, 
    }, null, 2),
  };
}

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


// ----------------------------------------------------------------------------------
// -------- Command Functions (เขียนข้อมูลไปยัง Firebase) ---------------------------
// ----------------------------------------------------------------------------------

/**
 * @function lockDoor
 * @description ส่งคำสั่งล็อคประตู
 */
export async function lockDoor(): Promise<void> {
    await ensureAuthenticated();
    const commandRef = getDoorRef("commands/lock");
    await set(commandRef, getCommandPayload({ 
        value: "LOCK", 
        message: "Request to lock door."
    }));
    
    // อัปเดต state ทันที (เพื่อการตอบสนองที่รวดเร็วของ UI)
    await set(getDoorRef("state/lockStatus"), "LOCK");
}

/**
 * @function unlockDoor
 * @description ส่งคำสั่งปลดล็อคประตู
 */
export async function unlockDoor(): Promise<void> {
    await ensureAuthenticated();
    const commandRef = getDoorRef("commands/unlock");
    await set(commandRef, getCommandPayload({ 
        value: "UNLOCK", 
        message: "Request to unlock door."
    }));
    
    // อัปเดต state ทันที (เพื่อการตอบสนองที่รวดเร็วของ UI)
    await set(getDoorRef("state/lockStatus"), "UNLOCK");
}


/**
 * @function setDoorMode
 * @description ตั้งค่าโหมดการทำงานของประตู (เช่น 'manual', 'password')
 */
export async function setDoorMode(mode: DoorMode): Promise<void> {
    await ensureAuthenticated();
    
    // 1. ส่งคำสั่งไปที่ commands/mode
    const commandRef = getDoorRef("commands/mode");
    const commandPromise = set(commandRef, getCommandPayload({ value: mode }));

    // 2. อัปเดตค่าใน state/mode โดยตรง
    const stateRef = getDoorRef("state/mode");
    const statePromise = set(stateRef, mode);

    // 3. บันทึก Log
    const logEntry = getCommandPayload({
        type: "DOOR_MODE_SET", 
        message: `Door mode set to ${mode}.`,
        value: mode
    });
    const logPromise = push(getDoorRef("logs"), logEntry);

    await Promise.all([commandPromise, statePromise, logPromise]);
}


/**
 * @function setPassword
 * @description ดึงรหัสผ่านปัจจุบันมาตรวจสอบก่อน จากนั้นส่งคำสั่งอัปเดตรหัสผ่านใหม่ไปยัง Firebase
 *
 * @param oldPassword รหัสผ่านเดิมที่ผู้ใช้กรอก
 * @param newPassword รหัสผ่านใหม่ที่ต้องการตั้ง
 * @returns Promise<void>
 */
export async function setPassword(oldPassword: string, newPassword: string): Promise<void> {
    
    // ⭐️ LOG 1: รับค่าเริ่มต้น
    console.log("--- setPassword Function Started ---");
    console.log(`INPUT: oldPassword = '${oldPassword}'`);
    console.log(`INPUT: newPassword = '${newPassword}'`);


    await ensureAuthenticated();
    
    // ⭐️ LOG 2: ตรวจสอบความยาวรหัสผ่านใหม่
    if (newPassword.length < 4) { 
        console.log(`VALIDATION FAILED: New password length is ${newPassword.length}, must be >= 4.`);
        throw new Error("New password must be at least 4 characters long.");
    }
    console.log("VALIDATION SUCCESS: New password length is acceptable.");
    
    // Path สำหรับเก็บรหัสผ่านจริง ⭐️ เปลี่ยนเป็น state/password
    const PASSWORD_KEY = 'password'; 
    const path = `state/${PASSWORD_KEY}`;
    const passwordRef = getDoorRef(path); 
    
    // ⭐️ LOG 3: แสดง Path ที่ใช้
    console.log(`DATABASE PATH: Target password path is '${path}'`);
    
    let currentPassword: string | null = null;
    
    try {
        // 1. ดึงรหัสผ่านปัจจุบันจาก state/password
        console.log("STEP 1: Attempting to fetch current password from Firebase...");
        const snapshot = await get(passwordRef);
        currentPassword = snapshot.val() as (string | null);
        
        // ⭐️ LOG 4: ค่ารหัสผ่านที่ดึงมาจาก Firebase
        console.log(`FETCH SUCCESS: currentPassword (from DB) = '${currentPassword}'`);
        
    } catch (error) {
        // ⭐️ LOG 5: Error ในการอ่าน
        console.error("Firebase Read Error:", error);
        throw new Error("Failed to read current password from database.");
    }

    // 2. ตรวจสอบรหัสผ่านเดิม
    console.log("STEP 2: Comparing oldPassword (input) with currentPassword (DB)...");
    
    if (!currentPassword) {
        console.log("CHECK FAILED: currentPassword is null/empty. Treating as invalid/uninitialized.");
    }
    
    if (!currentPassword || currentPassword !== oldPassword) {
        // ⭐️ LOG 6: ตรวจสอบไม่ผ่าน
        console.log("COMPARISON FAILED: Input oldPassword does NOT match DB currentPassword.");
        
        // บันทึก Log การพยายามเปลี่ยนรหัสผ่านที่ไม่สำเร็จ
        const failLog = getCommandPayload({
            type: "PASSWORD_UPDATE_FAIL", 
            message: "Failed attempt to update security password (invalid old password).",
        });
        
        console.log("ACTION: Pushing PASSWORD_UPDATE_FAIL log to Firebase.");
        await push(getDoorRef("logs"), failLog);
        
        throw new Error("Invalid old password provided.");
    }

    // ⭐️ LOG 7: ตรวจสอบผ่าน
    console.log("COMPARISON SUCCESS: Input oldPassword MATCHES DB currentPassword. Proceeding to update.");


    // 3. ถ้าถูกต้อง: อัปเดตรหัสผ่านใหม่ใน state/password และส่ง Command Trigger
    
    // Command Trigger (แจ้งเตือนอุปกรณ์ว่ามีการเปลี่ยนแปลงรหัสผ่าน)
    console.log("STEP 3A: Preparing 'passwordChangeTrigger' command (commands/passwordChangeTrigger)...");
    const commandPromise = set(getDoorRef("commands/passwordChangeTrigger"), getCommandPayload({ 
        success: true, 
    }));


    console.log(`STEP 3B: Preparing to update passwordRef (${path}) with new value: '${newPassword}'`);
    const updatePromise = set(passwordRef, newPassword);

    // บันทึก Log การเปลี่ยนแปลงสำเร็จ
    console.log("STEP 3C: Preparing 'PASSWORD_UPDATED' log (logs)...");
    const logEntry = getCommandPayload({
        type: "PASSWORD_UPDATED", 
        message: "Security password updated successfully.",
    });
    const logPromise = push(getDoorRef("logs"), logEntry);

    // ดำเนินการพร้อมกัน
    console.log("STEP 4: Executing Promise.all([commandPromise, updatePromise, logPromise])...");
    await Promise.all([commandPromise, updatePromise, logPromise]);
    

    console.log("--- setPassword Function Finished Successfully ---");
}


/**
 * @function toggleAI
 * @description ส่งคำสั่งเพื่อสลับสถานะ AI (เปิด/ปิด)
 */
export async function toggleAI(): Promise<void> {
    await ensureAuthenticated();
    // ส่ง trigger command เพื่อให้อุปกรณ์ Smart Door ทำการสลับสถานะ AI
    await set(getDoorRef("commands/aiToggleCommand"), getCommandPayload({ trigger: true }));
}

export async function refreshStatusFromHardware(): Promise<void> {
  await ensureAuthenticated();
  const path = getDoorRef("commands/refreshStatus");
  await set(path, getCommandPayload({ trigger: true }));
}

// ... (setTempThreshold และ ringBell เหมือนเดิม) ...
export async function setTempThreshold(temp: number): Promise<void> {
  await ensureAuthenticated();
  
  // 1. ส่งคำสั่งไปที่ commands/tempThreshold 
  const commandRef = getDoorRef("commands/tempThreshold");
  const commandPromise = set(commandRef, getCommandPayload({ value: temp }));

  // 2. อัปเดตค่าใน state/tempThreshold โดยตรง
  const stateRef = getDoorRef("state/tempThreshold");
  const statePromise = set(stateRef, temp);

  // 3. บันทึก Log การตั้งค่า 
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

// ... (fetchDoorStatusOneTime และ fetchLogsOneTime เหมือนเดิม) ...
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